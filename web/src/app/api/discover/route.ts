import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/discover
 * Home screen aggregated data - Top Matches, Nearby, Videos, Events, Virtual Dating
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

  // Get current user's profile and filters
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: userFilters } = await supabase
    .from("user_filters")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get blocked users (both directions)
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
  blockedIds.add(user.id); // Exclude self

  // Get user's favorites for marking
  const { data: favorites } = await supabase
    .from("favorites")
    .select("favorite_user_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set(favorites?.map((f) => f.favorite_user_id).filter((id): id is string => id !== null) || []);

  // Build base query for profiles
  // Note: Include users with "active" status OR null status (new users)
  // This is more inclusive than requiring exactly "active"
  let profilesQuery = supabase
    .from("profiles")
    .select(`
      *,
      users!inner(id, display_name, status, email)
    `)
    .not("user_id", "in", `(${Array.from(blockedIds).join(",")})`);

  // ALWAYS apply user's "looking_for" preference from their profile
  // This is the core gender preference that determines who the user wants to see
  if (currentUserProfile?.looking_for && currentUserProfile.looking_for.length > 0) {
    profilesQuery = profilesQuery.in("gender", currentUserProfile.looking_for);
  }

  // Apply additional filters if they exist (but NOT gender - that comes from profile)
  if (userFilters) {
    if (userFilters.min_age || userFilters.max_age) {
      const today = new Date();
      if (userFilters.max_age) {
        const minDate = new Date(today.getFullYear() - userFilters.max_age, today.getMonth(), today.getDate());
        profilesQuery = profilesQuery.gte("date_of_birth", minDate.toISOString().split("T")[0]);
      }
      if (userFilters.min_age) {
        const maxDate = new Date(today.getFullYear() - userFilters.min_age, today.getMonth(), today.getDate());
        profilesQuery = profilesQuery.lte("date_of_birth", maxDate.toISOString().split("T")[0]);
      }
    }
    // Note: Gender filter removed - it comes from user's profile looking_for preference
    if (userFilters.min_height) {
      profilesQuery = profilesQuery.gte("height_inches", userFilters.min_height);
    }
    if (userFilters.max_height) {
      profilesQuery = profilesQuery.lte("height_inches", userFilters.max_height);
    }
  }

  // Fetch top matches (limit 10)
  const { data: topMatchProfiles } = await profilesQuery
    .limit(10)
    .order("updated_at", { ascending: false });

  // Format profiles for mobile app (async to handle image URL conversion)
  const formatProfile = async (profile: any): Promise<any> => {
    const imageUrl = await resolveStorageUrl(supabase, profile.profile_image_url);
    return {
      ID: profile.user_id,
      id: profile.user_id,
      DisplayName: profile.users?.display_name || profile.first_name || "",
      FirstName: profile.first_name || "",
      LastName: profile.last_name || "",
      Email: profile.users?.email || "",
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
      IsFavorite: favoriteIds.has(profile.user_id) ? 1 : 0,
      RATINGS: 0, // TODO: Calculate from reviews
      TotalRating: 0,
    };
  };

  const TopMatch = await Promise.all((topMatchProfiles || []).map(formatProfile));

  // Get nearby profiles (if user has location)
  let NearBy: any[] = [];
  if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
    // For now, just get profiles with location set (proper distance calculation would use PostGIS)
    let nearbyQuery = supabase
      .from("profiles")
      .select(`
        *,
        users!inner(id, display_name, status, email)
      `)
      .not("user_id", "in", `(${Array.from(blockedIds).join(",")})`)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    // Apply looking_for preference to nearby profiles too
    if (currentUserProfile?.looking_for && currentUserProfile.looking_for.length > 0) {
      nearbyQuery = nearbyQuery.in("gender", currentUserProfile.looking_for);
    }

    const { data: nearbyProfiles } = await nearbyQuery.limit(10);

    NearBy = await Promise.all(
      (nearbyProfiles || []).map(async (profile) => {
        const formatted = await formatProfile(profile);
        // Simple distance calculation (for demo - real app would use PostGIS)
        if (profile.latitude && profile.longitude && currentUserProfile.latitude && currentUserProfile.longitude) {
          const R = 6371; // Earth's radius in km
          const dLat = ((profile.latitude - currentUserProfile.latitude) * Math.PI) / 180;
          const dLon = ((profile.longitude - currentUserProfile.longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((currentUserProfile.latitude * Math.PI) / 180) *
              Math.cos((profile.latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          formatted.distance_in_km = Math.round(distance * 10) / 10;
        }
        return formatted;
      })
    );
  }

  // Get featured videos (profiles with videos in gallery)
  const { data: videoGallery } = await supabase
    .from("user_gallery")
    .select(`
      id,
      user_id,
      media_url,
      thumbnail_url,
      created_at,
      profiles!inner(
        first_name,
        last_name,
        users!inner(display_name)
      )
    `)
    .eq("media_type", "video")
    .not("user_id", "in", `(${Array.from(blockedIds).join(",")})`)
    .order("created_at", { ascending: false })
    .limit(10);

  const baseImageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/";
  
  // Generate signed URLs for videos
  const Videos = await Promise.all(
    (videoGallery || []).map(async (video: any) => {
      let videoUrl = video.media_url;
      
      if (!video.media_url.startsWith("http")) {
        const { data: signedData } = await supabase.storage
          .from("gallery")
          .createSignedUrl(video.media_url, 3600);
        videoUrl = signedData?.signedUrl || `${baseImageUrl}gallery/${video.media_url}`;
      }
      
      return {
        ID: video.id,
        Name: video.profiles?.users?.display_name || video.profiles?.first_name || "User",
        Link: videoUrl,
        VideoURL: videoUrl,
        CreatedDate: video.created_at,
      };
    })
  );

  // Get upcoming events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "upcoming")
    .eq("is_public", true)
    .gte("start_datetime", new Date().toISOString())
    .order("start_datetime", { ascending: true })
    .limit(5);

  const formattedEvents = (events || []).map((event) => ({
    EventID: event.id,
    EventName: event.title,
    EventDate: event.start_datetime?.split("T")[0] || "",
    EventPrice: "0", // TODO: Add pricing to events
    StartTime: event.start_datetime ? new Date(event.start_datetime).toLocaleTimeString() : "",
    EndTime: event.end_datetime ? new Date(event.end_datetime).toLocaleTimeString() : "",
    Description: event.description || "",
    Street: event.address || "",
    City: event.city || "",
    State: event.state || "",
    PostalCode: "",
    EventImage: event.image_url || "",
    Link: "",
    Latitude: event.latitude?.toString() || "",
    Longitude: event.longitude?.toString() || "",
    UserID: event.created_by || "",
    CreateDate: event.created_at,
    interestedUserImage: [],
    HostedBy: "",
    HostedID: event.created_by || "",
  }));

  // Get virtual speed dating sessions
  const { data: virtualDating } = await supabase
    .from("virtual_speed_dating")
    .select("*")
    .eq("status", "scheduled")
    .gte("scheduled_datetime", new Date().toISOString())
    .order("scheduled_datetime", { ascending: true })
    .limit(5);

  const Virtual = (virtualDating || []).map((session) => ({
    ID: session.id,
    Title: session.title,
    Description: session.description || "",
    Image: session.image_url || "",
    ScheduledDate: session.scheduled_datetime?.split("T")[0] || "",
    ScheduledTime: session.scheduled_datetime ? new Date(session.scheduled_datetime).toLocaleTimeString() : "",
    Duration: session.duration_minutes,
    MaxParticipants: session.max_participants,
    Status: session.status,
  }));

  return NextResponse.json({
    success: true,
    status: 200,
    TopMatch,
    NearBy,
    Videos,
    event: formattedEvents,
    Virtual,
    baseImageUrl,
    msg: "Home data fetched successfully",
  });
}
