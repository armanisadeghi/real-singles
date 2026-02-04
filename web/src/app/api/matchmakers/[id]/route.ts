import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { getMatchmakerStats, verifyMatchmakerOwnership } from "@/lib/services/matchmakers";
import { z } from "zod";

// Validation schema for profile updates
const updateSchema = z.object({
  bio: z.string().min(50).max(1000).optional(),
  specialties: z.array(z.string()).min(1).max(10).optional(),
  years_experience: z.number().min(0).max(50).optional(),
  certifications: z.array(z.string()).optional(),
});

/**
 * GET /api/matchmakers/[id]
 * Get matchmaker profile with stats and reviews
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id } = await params;

  // Get matchmaker profile
  const { data: matchmaker, error } = await supabase
    .from("matchmakers")
    .select(
      `
      id,
      user_id,
      status,
      bio,
      specialties,
      years_experience,
      certifications,
      created_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !matchmaker) {
    return NextResponse.json(
      { success: false, msg: "Matchmaker not found" },
      { status: 404 }
    );
  }

  // Check if matchmaker is approved (unless requesting user is owner or admin)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user && matchmaker.user_id === user.id;
  const isAdmin = user
    ? (
        await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
      ).data?.role === "admin"
    : false;

  if (matchmaker.status !== "approved" && !isOwner && !isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Matchmaker not found" },
      { status: 404 }
    );
  }

  // Get user and profile data separately to avoid ambiguous joins
  const { data: userData } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", matchmaker.user_id)
    .single();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("first_name, last_name, profile_image_url, city, state")
    .eq("user_id", matchmaker.user_id)
    .single();

  // Get stats
  const { stats } = await getMatchmakerStats(supabase, id);

  // Get reviews with user data
  const { data: reviews } = await supabase
    .from("matchmaker_reviews")
    .select("id, rating, review_text, is_verified_client, created_at, reviewer_user_id")
    .eq("matchmaker_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

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
  const profile = profileData;

  const profileImageUrl = profile?.profile_image_url
    ? await resolveStorageUrl(supabase, profile.profile_image_url)
    : "";

  const formattedReviews = await Promise.all(
    (reviews || []).map(async (review) => {
      const reviewerUser = reviewerUserMap.get(review.reviewer_user_id);
      const reviewerProfile = reviewerProfileMap.get(review.reviewer_user_id);
      const reviewerImage = reviewerProfile?.profile_image_url
        ? await resolveStorageUrl(supabase, reviewerProfile.profile_image_url)
        : "";

      return {
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        is_verified_client: review.is_verified_client,
        created_at: review.created_at,
        reviewer: {
          display_name: reviewerUser?.display_name || "Anonymous",
          first_name: reviewerProfile?.first_name || "",
          profile_image_url: reviewerImage,
        },
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      id: matchmaker.id,
      user_id: matchmaker.user_id,
      status: matchmaker.status,
      display_name: userData?.display_name || "Matchmaker",
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      profile_image_url: profileImageUrl,
      city: profile?.city || "",
      state: profile?.state || "",
      bio: matchmaker.bio,
      specialties: matchmaker.specialties || [],
      years_experience: matchmaker.years_experience,
      certifications: matchmaker.certifications || [],
      created_at: matchmaker.created_at,
      stats,
      reviews: formattedReviews,
    },
    msg: "Matchmaker profile fetched successfully",
  });
}

/**
 * PATCH /api/matchmakers/[id]
 * Update matchmaker profile (owner only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id } = await params;

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

  // Verify ownership
  const ownershipCheck = await verifyMatchmakerOwnership(supabase, id, user.id);
  if (!ownershipCheck.success) {
    return NextResponse.json(
      { success: false, msg: ownershipCheck.error },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Update matchmaker profile
    const { error: updateError } = await supabase
      .from("matchmakers")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating matchmaker:", updateError);
      return NextResponse.json(
        { success: false, msg: "Error updating profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/matchmakers/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
