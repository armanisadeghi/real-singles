import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// Helper to convert storage path to public URL
function getGalleryPublicUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/gallery/${path}`;
}

/**
 * GET /api/users/[id]
 * Get another user's public profile
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const supabase = await createApiClient();

  // Get current user (optional - for checking favorite/follow status)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Get the target user's data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", targetUserId)
    .eq("status", "active")
    .single();

  if (userError || !userData) {
    return NextResponse.json(
      { success: false, msg: "User not found" },
      { status: 404 }
    );
  }

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json(
      { success: false, msg: "Error fetching profile" },
      { status: 500 }
    );
  }

  // Get gallery images
  const { data: gallery } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", targetUserId)
    .order("display_order", { ascending: true });

  // Check if current user has favorited this profile
  let isFavorite = false;
  let followStatus = "not_following";

  if (currentUser) {
    // Check favorite status
    const { data: favorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("favorite_user_id", targetUserId)
      .single();

    isFavorite = !!favorite;

    // Check follow status
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", targetUserId)
      .single();

    followStatus = follow ? "following" : "not_following";

    // Check if blocked
    const { data: blocked } = await supabase
      .from("blocks")
      .select("id")
      .or(`blocker_id.eq.${currentUser.id},blocked_id.eq.${currentUser.id}`)
      .or(`blocker_id.eq.${targetUserId},blocked_id.eq.${targetUserId}`)
      .single();

    if (blocked) {
      return NextResponse.json(
        { success: false, msg: "Cannot view this profile" },
        { status: 403 }
      );
    }
  }

  // Get average rating
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", targetUserId)
    .eq("is_approved", true);

  const validRatings = reviews?.filter((r) => r.rating !== null).map((r) => r.rating!) || [];
  const avgRating =
    validRatings.length > 0
      ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
      : 0;

  // Transform data to match mobile app format
  const responseData = {
    ID: targetUserId,
    id: targetUserId,
    Email: userData.email,
    DisplayName: userData.display_name || profile?.first_name || "",
    FirstName: profile?.first_name || "",
    LastName: profile?.last_name || "",
    
    // Profile details
    DOB: profile?.date_of_birth || "",
    Gender: profile?.gender || "",
    Image: profile?.profile_image_url || "",
    livePicture: profile?.profile_image_url || "",
    About: profile?.bio || "",
    
    // Location (limited for privacy)
    City: profile?.city || "",
    State: profile?.state || "",
    
    // Physical attributes
    Height: profile?.height_inches?.toString() || "",
    BodyType: profile?.body_type || "",
    Ethnicity: profile?.ethnicity || [],
    
    // Lifestyle
    Religion: profile?.religion || "",
    Education: profile?.education || "",
    JobTitle: profile?.occupation || "",
    Smoking: profile?.smoking || "",
    Drinks: profile?.drinking || "",
    Marijuana: profile?.marijuana || "",
    
    // Family
    HaveChild: profile?.has_kids ? "Yes" : "No",
    WantChild: profile?.wants_kids || "",
    Pets: profile?.pets?.join(", ") || "",
    
    // Interests & Personality
    HSign: profile?.zodiac_sign || "",
    Interest: profile?.interests?.join(", ") || "",
    
    // Verification & Stats
    is_verified: profile?.is_verified || false,
    RATINGS: avgRating,
    TotalRating: reviews?.length || 0,
    
    // Relationship to current user
    IsFavorite: isFavorite ? 1 : 0,
    FollowStatus: followStatus,
    
    // Gallery - transform paths to full URLs and normalize media_type
    gallery: (gallery || []).map((item) => ({
      ...item,
      media_url: getGalleryPublicUrl(item.media_url),
      // Normalize: DB stores "photo" but clients expect "image"
      media_type: item.media_type === "photo" ? "image" : item.media_type,
      thumbnail_url: item.thumbnail_url ? getGalleryPublicUrl(item.thumbnail_url) : null,
    })),
  };

  return NextResponse.json({
    success: true,
    data: responseData,
    msg: "Profile fetched successfully",
  });
}
