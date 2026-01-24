import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/reviews
 * Get reviews for a user (via query param) or reviews submitted by current user
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

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

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const type = searchParams.get("type") || "received"; // received or submitted
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query;

  if (userId) {
    // Get reviews for a specific user
    query = supabase
      .from("reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          profiles:id(first_name, profile_image_url, users:user_id(display_name))
        )
      `)
      .eq("reviewed_user_id", userId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
  } else if (type === "submitted") {
    // Get reviews submitted by current user
    query = supabase
      .from("reviews")
      .select(`
        *,
        reviewed_user:reviewed_user_id(
          profiles:id(first_name, profile_image_url, users:user_id(display_name))
        )
      `)
      .eq("reviewer_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
  } else {
    // Get reviews received by current user
    query = supabase
      .from("reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          profiles:id(first_name, profile_image_url, users:user_id(display_name))
        )
      `)
      .eq("reviewed_user_id", user.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching reviews" },
      { status: 500 }
    );
  }

  // Calculate average rating if looking at a user's reviews
  let avgRating = 0;
  let totalReviews = 0;

  if (userId || type === "received") {
    const targetUserId = userId || user.id;
    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewed_user_id", targetUserId)
      .eq("is_approved", true);

    if (allReviews && allReviews.length > 0) {
      const validRatings = allReviews.filter((r) => r.rating !== null).map((r) => r.rating!);
      if (validRatings.length > 0) {
        avgRating = validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
      }
      totalReviews = allReviews.length;
    }
  }

  // Format reviews
  const formattedReviews = (reviews || []).map((review: any) => ({
    ReviewID: review.id,
    ReviewerID: review.reviewer_id,
    ReviewerName: review.reviewer?.profiles?.users?.display_name || 
                  review.reviewer?.profiles?.first_name || "Anonymous",
    ReviewerImage: review.reviewer?.profiles?.profile_image_url || "",
    ReviewedUserID: review.reviewed_user_id,
    ReviewedUserName: review.reviewed_user?.profiles?.users?.display_name ||
                      review.reviewed_user?.profiles?.first_name || "",
    Relationship: review.relationship,
    Rating: review.rating,
    ReviewText: review.review_text,
    IsApproved: review.is_approved,
    PointsAwarded: review.points_awarded,
    CreatedAt: review.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: {
      reviews: formattedReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews,
    },
    msg: "Reviews fetched successfully",
  });
}

/**
 * POST /api/reviews
 * Submit a review for another user
 */
export async function POST(request: Request) {
  const supabase = await createApiClient();

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
    let reviewedUserId: string | null = null;
    let relationship: string | null = null;
    let rating: number | null = null;
    let reviewText: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      reviewedUserId = formData.get("ReviewedUserID") as string || formData.get("reviewed_user_id") as string;
      relationship = formData.get("Relationship") as string || formData.get("relationship") as string;
      rating = parseInt(formData.get("Rating") as string || formData.get("rating") as string);
      reviewText = formData.get("ReviewText") as string || formData.get("review_text") as string;
    } else {
      const body = await request.json();
      reviewedUserId = body.ReviewedUserID || body.reviewed_user_id;
      relationship = body.Relationship || body.relationship;
      rating = body.Rating || body.rating;
      reviewText = body.ReviewText || body.review_text;
    }

    // Validation
    if (!reviewedUserId) {
      return NextResponse.json(
        { success: false, msg: "Reviewed user ID is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, msg: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Can't review yourself
    if (reviewedUserId === user.id) {
      return NextResponse.json(
        { success: false, msg: "Cannot review yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: reviewedUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", reviewedUserId)
      .single();

    if (!reviewedUser) {
      return NextResponse.json(
        { success: false, msg: "User not found" },
        { status: 404 }
      );
    }

    // Check for existing recent review
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("reviewer_id", user.id)
      .eq("reviewed_user_id", reviewedUserId)
      .gte("created_at", thirtyDaysAgo)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { success: false, msg: "You have already reviewed this user recently" },
        { status: 400 }
      );
    }

    // Create review (starts as not approved, requires moderation)
    const { data: review, error: createError } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: user.id,
        reviewed_user_id: reviewedUserId,
        relationship: relationship || "other",
        rating,
        review_text: reviewText,
        is_approved: false, // Requires moderation
        points_awarded: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating review:", createError);
      return NextResponse.json(
        { success: false, msg: "Error submitting review" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ReviewID: review.id },
      msg: "Review submitted successfully. It will be visible after moderation.",
    });
  } catch (error) {
    console.error("Error in POST /api/reviews:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
