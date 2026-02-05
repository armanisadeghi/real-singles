import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl, resolveOptimizedImageUrl, resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";
import {
  getDiscoverableCandidates,
  getUserProfileContextWithError,
  userFiltersToDiscoveryFilters,
  type DiscoverableProfile,
  type DiscoveryEmptyReason,
} from "@/lib/services/discovery";

/**
 * PERFORMANCE STANDARDS IMPLEMENTATION
 * See /PERFORMANCE-STANDARDS.md for full requirements
 *
 * Note: Discovery is NOT cached at the route level because:
 * 1. Results are highly personalized per user
 * 2. Exclusion lists (blocks, likes, passes) change frequently
 * 3. Client-side caching via TanStack Query handles deduplication
 *
 * Optimization is done via:
 * - Parallel query execution in getDiscoverableCandidates
 * - Image optimization via resolveOptimizedImageUrl
 * - Field-specific selects (no SELECT *)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Formatted profile for mobile API response */
interface FormattedProfile {
  ID: string | null;
  id: string | null;
  DisplayName: string;
  FirstName: string;
  DOB: string;
  Gender: string;
  Image: string | null;
  livePicture: string | null;
  About: string;
  City: string;
  State: string;
  Height: string;
  BodyType: string;
  Ethnicity: string[];
  Religion: string;
  HSign: string;
  Interest: string;
  is_verified: boolean;
  IsFavorite: number;
  RATINGS: number;
  TotalRating: number;
  distance_in_km?: number;
  has_liked_me?: boolean;
  // Voice & Video Prompts
  VoicePromptUrl: string;
  VideoIntroUrl: string;
  VoicePromptDurationSeconds: number | null;
  VideoIntroDurationSeconds: number | null;
}

/** Video gallery item from database */
interface VideoGalleryRow {
  id: string;
  user_id: string | null;
  media_url: string;
  thumbnail_url: string | null;
  created_at: string | null;
}

/**
 * GET /api/discover
 * Home screen aggregated data - Top Matches, Nearby, Videos, Events, Virtual Dating
 * 
 * Uses the shared discovery service for profile filtering to ensure:
 * - Bidirectional gender match
 * - Profile eligibility
 * - Proper exclusions (blocked, passed, mutual matches)
 * 
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function GET() {
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

  // Check user's status first - this helps diagnose RLS issues
  const { data: userData } = await supabase
    .from("users")
    .select("status")
    .eq("id", user.id)
    .single();

  // Get user profile context for discovery
  const profileResult = await getUserProfileContextWithError(supabase, user.id);

  if (!profileResult.profile) {
    // Determine the reason for failure
    let emptyReason: DiscoveryEmptyReason = "profile_not_found";
    let errorMessage = "Profile not found";
    
    // If user record exists but profile read failed, it might be RLS
    // (user.status != 'active' blocks reading their own profile)
    if (userData && userData.status !== "active") {
      emptyReason = "user_inactive";
      errorMessage = `Your account is ${userData.status}. Please contact support.`;
    }

    return NextResponse.json({
      success: false,
      msg: errorMessage,
      emptyReason,
      TopMatch: [],
      NearBy: [],
      Videos: [],
      event: [],
      Virtual: [],
    });
  }

  const userProfile = profileResult.profile;

  // Get user's saved filters - select only fields used by userFiltersToDiscoveryFilters
  const { data: userFilters } = await supabase
    .from("user_filters")
    .select(`
      min_age, max_age, min_height, max_height, max_distance_miles,
      body_types, ethnicities, religions, education_levels, zodiac_signs,
      smoking, drinking, marijuana, has_kids, wants_kids
    `)
    .eq("user_id", user.id)
    .single();

  const filters = userFiltersToDiscoveryFilters(userFilters);

  // Get favorites for marking
  const { data: favorites } = await supabase
    .from("favorites")
    .select("favorite_user_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set(
    favorites?.map((f) => f.favorite_user_id).filter((id): id is string => id !== null) || []
  );

  // Format profile for mobile API response
  // Uses "card" size (400x400) for profile images to reduce bandwidth
  const formatProfile = async (profile: DiscoverableProfile): Promise<FormattedProfile> => {
    // Use "card" size for discover cards - smaller than full resolution, good for card views
    const imageUrl = await resolveOptimizedImageUrl(supabase, profile.profile_image_url, "card");
    return {
      ID: profile.user_id,
      id: profile.user_id,
      DisplayName: profile.user?.display_name || profile.first_name || "",
      FirstName: profile.first_name || "",
      DOB: profile.date_of_birth || "",
      Gender: profile.gender || "",
      Image: imageUrl,
      livePicture: imageUrl,
      About: profile.bio || "",
      City: profile.city || "",
      State: profile.state || "",
      Height: profile.height_inches?.toString() || "",
      BodyType: profile.body_type || "",
      Ethnicity: profile.ethnicity || [],
      Religion: profile.religion || "",
      HSign: profile.zodiac_sign || "",
      Interest: profile.interests?.join(", ") || "",
      is_verified: profile.is_verified || false,
      IsFavorite: profile.is_favorite ? 1 : 0,
      RATINGS: 0, // TODO: Calculate from reviews
      TotalRating: 0,
      distance_in_km: profile.distance_km,
      has_liked_me: profile.has_liked_me,
      // Voice & Video Prompts
      VoicePromptUrl: await resolveVoicePromptUrl(supabase, profile.voice_prompt_url),
      VideoIntroUrl: await resolveVideoIntroUrl(supabase, profile.video_intro_url),
      VoicePromptDurationSeconds: profile.voice_prompt_duration_seconds,
      VideoIntroDurationSeconds: profile.video_intro_duration_seconds,
    };
  };

  // ============================================================================
  // TOP MATCHES - Use discovery service
  // ============================================================================

  const topMatchResult = await getDiscoverableCandidates(supabase, {
    userProfile,
    filters,
    pagination: { limit: 10, offset: 0 },
    sortBy: "recent",
  });

  const TopMatch = await Promise.all(
    topMatchResult.profiles.map(formatProfile)
  );

  // ============================================================================
  // NEARBY - Use discovery service with distance sort
  // ============================================================================

  let NearBy: FormattedProfile[] = [];
  if (userProfile.latitude && userProfile.longitude) {
    const nearbyResult = await getDiscoverableCandidates(supabase, {
      userProfile,
      filters: {
        ...filters,
        maxDistanceMiles: filters.maxDistanceMiles || 500, // Default 500 miles (nationwide)
      },
      pagination: { limit: 10, offset: 0 },
      sortBy: "distance",
    });

    NearBy = await Promise.all(
      nearbyResult.profiles.map(formatProfile)
    );
  }

  // ============================================================================
  // VIDEOS - Keep existing logic (not user-specific filtering)
  // ============================================================================

  // Get blocked users for video filtering
  const { data: blockedUsers } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  const blockedIds = new Set<string>();
  blockedUsers?.forEach((block) => {
    if (block.blocker_id === user.id && block.blocked_id) {
      blockedIds.add(block.blocked_id);
    } else if (block.blocker_id) {
      blockedIds.add(block.blocker_id);
    }
  });
  blockedIds.add(user.id);

  const { data: videoGallery } = await supabase
    .from("user_gallery")
    .select("id, user_id, media_url, thumbnail_url, created_at")
    .eq("media_type", "video")
    .not("user_id", "in", `(${Array.from(blockedIds).join(",")})`)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get user info for video owners
  const videoUserIds = (videoGallery || [])
    .map((v) => v.user_id)
    .filter((id): id is string => id !== null);
  
  const videoUserMap: Record<string, { display_name: string | null; first_name: string | null }> = {};
  if (videoUserIds.length > 0) {
    const { data: videoUsers } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", videoUserIds);
    
    const { data: videoProfiles } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .in("user_id", videoUserIds);
    
    for (const u of videoUsers || []) {
      const profile = (videoProfiles || []).find((p) => p.user_id === u.id);
      videoUserMap[u.id] = {
        display_name: u.display_name,
        first_name: profile?.first_name ?? null,
      };
    }
  }

  const baseImageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/";
  
  const Videos = await Promise.all(
    ((videoGallery || []) as VideoGalleryRow[]).map(async (video) => {
      let videoUrl = video.media_url;
      
      if (!video.media_url.startsWith("http")) {
        const { data: signedData } = await supabase.storage
          .from("gallery")
          .createSignedUrl(video.media_url, 3600);
        videoUrl = signedData?.signedUrl || `${baseImageUrl}gallery/${video.media_url}`;
      }
      
      const userInfo = video.user_id ? videoUserMap[video.user_id] : null;
      
      return {
        ID: video.id,
        Name: userInfo?.display_name || userInfo?.first_name || "User",
        Link: videoUrl,
        VideoURL: videoUrl,
        CreatedDate: video.created_at,
      };
    })
  );

  // ============================================================================
  // EVENTS
  // ============================================================================

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, image_url, address, city, state, latitude, longitude, start_datetime, end_datetime, created_by, created_at")
    .eq("status", "upcoming")
    .eq("is_public", true)
    .gte("start_datetime", startOfToday.toISOString())
    .order("start_datetime", { ascending: true })
    .limit(5);

  const formattedEvents = await Promise.all(
    (events || []).map(async (event) => {
      const eventImageUrl = await resolveStorageUrl(supabase, event.image_url, { bucket: "events" });
      return {
        EventID: event.id,
        EventName: event.title,
        EventDate: event.start_datetime?.split("T")[0] || "",
        EventPrice: "0",
        StartTime: event.start_datetime ? new Date(event.start_datetime).toLocaleTimeString() : "",
        EndTime: event.end_datetime ? new Date(event.end_datetime).toLocaleTimeString() : "",
        Description: event.description || "",
        Street: event.address || "",
        City: event.city || "",
        State: event.state || "",
        PostalCode: "",
        EventImage: eventImageUrl,
        Link: "",
        Latitude: event.latitude?.toString() || "",
        Longitude: event.longitude?.toString() || "",
        UserID: event.created_by || "",
        CreateDate: event.created_at,
        interestedUserImage: [],
        HostedBy: "",
        HostedID: event.created_by || "",
      };
    })
  );

  // ============================================================================
  // VIRTUAL SPEED DATING
  // ============================================================================

  const { data: virtualDating } = await supabase
    .from("virtual_speed_dating")
    .select("id, title, description, image_url, scheduled_datetime, duration_minutes, max_participants, status")
    .eq("status", "scheduled")
    .gte("scheduled_datetime", new Date().toISOString())
    .order("scheduled_datetime", { ascending: true })
    .limit(5);

  const Virtual = await Promise.all(
    (virtualDating || []).map(async (session) => {
      const imageUrl = await resolveStorageUrl(supabase, session.image_url, { bucket: "events" });
      return {
        ID: session.id,
        Title: session.title,
        Description: session.description || "",
        Image: imageUrl,
        ScheduledDate: session.scheduled_datetime?.split("T")[0] || "",
        ScheduledTime: session.scheduled_datetime ? new Date(session.scheduled_datetime).toLocaleTimeString() : "",
        Duration: session.duration_minutes,
        MaxParticipants: session.max_participants,
        Status: session.status,
      };
    })
  );

  // Determine emptyReason if TopMatch is empty
  const emptyReason: DiscoveryEmptyReason = TopMatch.length === 0 
    ? topMatchResult.emptyReason || "no_matches"
    : null;

  return NextResponse.json({
    success: true,
    status: 200,
    TopMatch,
    NearBy,
    Videos,
    event: formattedEvents,
    Virtual,
    baseImageUrl,
    emptyReason,
    msg: "Home data fetched successfully",
  });
}
