import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { z } from "zod";

// Validation schema for review
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review_text: z.string().min(10).max(1000).optional(),
});

/**
 * GET /api/matchmakers/[id]/reviews
 * Get reviews for a matchmaker (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId } = await params;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Get reviews
  const { data: reviews, error, count } = await supabase
    .from("matchmaker_reviews")
    .select("id, rating, review_text, is_verified_client, created_at, reviewer_user_id")
    .eq("matchmaker_id", matchmakerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching reviews" },
      { status: 500 }
    );
  }

  // Get reviewer details
  const reviewerIds = reviews?.map((r) => r.reviewer_user_id) || [];
  const { data: reviewerUsers } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", reviewerIds);

  const { data: reviewerProfiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, profile_image_url")
    .in("user_id", reviewerIds);

  const reviewerUserMap = new Map(reviewerUsers?.map((u) => [u.id, u]) || []);
  const reviewerProfileMap = new Map(
    reviewerProfiles?.map((p) => [p.user_id, p]) || []
  );

  // Format response
  const formatted = await Promise.all(
    (reviews || []).map(async (review) => {
      const reviewerUser = reviewerUserMap.get(review.reviewer_user_id);
      const profile = reviewerProfileMap.get(review.reviewer_user_id);
      const profileImageUrl = profile?.profile_image_url
        ? await resolveStorageUrl(supabase, profile.profile_image_url)
        : "";

      return {
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        is_verified_client: review.is_verified_client,
        created_at: review.created_at,
        reviewer: {
          display_name: reviewerUser?.display_name || "Anonymous",
          first_name: profile?.first_name || "",
          profile_image_url: profileImageUrl,
        },
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formatted,
    total: count || formatted.length,
    msg: "Reviews fetched successfully",
  });
}

/**
 * POST /api/matchmakers/[id]/reviews
 * Add a review for a matchmaker
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, msg: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { rating, review_text } = validation.data;

    // Check if user was a client of this matchmaker
    const { data: clientRelationship } = await supabase
      .from("matchmaker_clients")
      .select("id")
      .eq("matchmaker_id", matchmakerId)
      .eq("client_user_id", user.id)
      .maybeSingle();

    const isVerifiedClient = !!clientRelationship;

    // Check if user already reviewed this matchmaker
    const { data: existingReview } = await supabase
      .from("matchmaker_reviews")
      .select("id")
      .eq("matchmaker_id", matchmakerId)
      .eq("reviewer_user_id", user.id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { success: false, msg: "You have already reviewed this matchmaker" },
        { status: 409 }
      );
    }

    // Create review
    const { data: review, error: createError } = await supabase
      .from("matchmaker_reviews")
      .insert({
        matchmaker_id: matchmakerId,
        reviewer_user_id: user.id,
        rating,
        review_text: review_text || null,
        is_verified_client: isVerifiedClient,
      })
      .select("id")
      .single();

    if (createError || !review) {
      console.error("Error creating review:", createError);
      return NextResponse.json(
        { success: false, msg: "Error creating review" },
        { status: 500 }
      );
    }

    // Stats will be recalculated automatically by trigger

    return NextResponse.json({
      success: true,
      data: { review_id: review.id },
      msg: "Review submitted successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/matchmakers/[id]/reviews:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
