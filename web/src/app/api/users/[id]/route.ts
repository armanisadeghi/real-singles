import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";

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
  // Note: Allow both "active" and null status (for new users), only exclude suspended/deleted
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", targetUserId)
    .not("status", "in", "(suspended,deleted)")
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

  // Check if profile is hidden (paused account or admin)
  // Hidden profiles should show "Profile unavailable" unless viewing your own profile
  if (profile?.profile_hidden && currentUser?.id !== targetUserId) {
    return NextResponse.json(
      { success: false, msg: "Profile unavailable" },
      { status: 404 }
    );
  }

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
  let isMatched = false;

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

    // Check mutual match status
    // A mutual match exists when both users have liked each other
    const { data: currentUserLike } = await supabase
      .from("matches")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("target_user_id", targetUserId)
      .in("action", ["like", "super_like"])
      .eq("is_unmatched", false)
      .maybeSingle();

    const { data: targetUserLike } = await supabase
      .from("matches")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("target_user_id", currentUser.id)
      .in("action", ["like", "super_like"])
      .eq("is_unmatched", false)
      .maybeSingle();

    isMatched = !!(currentUserLike && targetUserLike);
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

  // Generate signed URLs for gallery items
  const galleryWithUrls = await Promise.all(
    (gallery || []).map(async (item) => {
      if (item.media_url.startsWith("http")) {
        return item;
      }
      
      const { data: signedData } = await supabase.storage
        .from("gallery")
        .createSignedUrl(item.media_url, 3600);
      
      return {
        ...item,
        media_url: signedData?.signedUrl || getGalleryPublicUrl(item.media_url),
        thumbnail_url: item.thumbnail_url 
          ? (await supabase.storage.from("gallery").createSignedUrl(item.thumbnail_url, 3600)).data?.signedUrl || null
          : null,
      };
    })
  );

  // Convert profile image URL to signed URL
  let profileImageUrl = "";
  if (profile?.profile_image_url) {
    if (profile.profile_image_url.startsWith("http")) {
      profileImageUrl = profile.profile_image_url;
    } else {
      const bucket = profile.profile_image_url.includes("/avatar") ? "avatars" : "gallery";
      const { data: imgData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(profile.profile_image_url, 3600);
      profileImageUrl = imgData?.signedUrl || "";
    }
  }

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
    Image: profileImageUrl,
    livePicture: profileImageUrl,
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
    
    // Dating Intentions
    DatingIntentions: profile?.dating_intentions || "",
    
    // Profile Prompts (Structured Storytelling)
    IdealFirstDate: profile?.ideal_first_date || "",
    NonNegotiables: profile?.non_negotiables || "",
    WorstJob: profile?.worst_job || "",
    DreamJob: profile?.dream_job || "",
    NightclubOrHome: profile?.nightclub_or_home || "",
    PetPeeves: profile?.pet_peeves || "",
    AfterWork: profile?.after_work || "",
    WayToHeart: profile?.way_to_heart || "",
    CraziestTravelStory: profile?.craziest_travel_story || "",
    WeirdestGift: profile?.weirdest_gift || "",
    PastEvent: profile?.past_event || "",
    
    // Verification & Stats
    is_verified: profile?.is_verified || false,
    RATINGS: avgRating,
    TotalRating: reviews?.length || 0,
    
    // Voice & Video Prompts
    VoicePromptUrl: await resolveVoicePromptUrl(supabase, profile?.voice_prompt_url),
    VideoIntroUrl: await resolveVideoIntroUrl(supabase, profile?.video_intro_url),
    VoicePromptDurationSeconds: profile?.voice_prompt_duration_seconds || null,
    VideoIntroDurationSeconds: profile?.video_intro_duration_seconds || null,
    
    // Relationship to current user
    IsFavorite: isFavorite ? 1 : 0,
    FollowStatus: followStatus,
    IsMatched: isMatched,
    
    // Gallery with signed URLs (generated below)
    gallery: galleryWithUrls,
  };

  return NextResponse.json({
    success: true,
    data: responseData,
    msg: "Profile fetched successfully",
  });
}
