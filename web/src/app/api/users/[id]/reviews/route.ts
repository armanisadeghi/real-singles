import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/users/[id]/reviews
 * Get approved reviews for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const supabase = await createApiClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify the user exists
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, status")
    .eq("id", userId)
    .single();

  if (!targetUser || targetUser.status !== "active") {
    return NextResponse.json(
      { success: false, msg: "User not found" },
      { status: 404 }
    );
  }

  // Get approved reviews
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(`
      id,
      reviewer_id,
      relationship,
      rating,
      review_text,
      created_at,
      profiles:reviewer_id(
        first_name,
        profile_image_url,
        is_verified,
        users:user_id(display_name)
      )
    `)
    .eq("reviewed_user_id", userId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching reviews" },
      { status: 500 }
    );
  }

  // Calculate average rating
  const totalRating = (reviews || []).reduce((sum: number, r: any) => sum + r.rating, 0);
  const averageRating = reviews && reviews.length > 0 
    ? Math.round((totalRating / reviews.length) * 10) / 10 
    : null;

  // Format reviews
  const formattedReviews = (reviews || []).map((review: any) => ({
    id: review.id,
    reviewer_id: review.reviewer_id,
    reviewer_name: review.profiles?.users?.display_name || review.profiles?.first_name || "Anonymous",
    reviewer_image: review.profiles?.profile_image_url || "",
    reviewer_verified: review.profiles?.is_verified || false,
    relationship: review.relationship,
    rating: review.rating,
    review_text: review.review_text,
    created_at: review.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: {
      reviews: formattedReviews,
      total_reviews: reviews?.length || 0,
      average_rating: averageRating,
    },
    msg: "Reviews fetched successfully",
  });
}
