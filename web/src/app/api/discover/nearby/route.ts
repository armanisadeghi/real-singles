import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl, resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";
import {
  getDiscoverableCandidates,
  type DiscoverableProfile,
  type UserProfileContext,
} from "@/lib/services/discovery";

// Type for formatted profile with distance
interface FormattedProfileWithDistance {
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
  distance_in_km: number;
  has_liked_me?: boolean;
  // Voice & Video Prompts
  VoicePromptUrl: string;
  VideoIntroUrl: string;
  VoicePromptDurationSeconds: number | null;
  VideoIntroDurationSeconds: number | null;
}

/**
 * GET /api/discover/nearby
 * POST /api/discover/nearby
 * Get profiles near the user's location
 * 
 * Uses the shared discovery service for consistent filtering:
 * - Bidirectional gender match
 * - Profile eligibility
 * - Proper exclusions (blocked, passed, mutual matches)
 * 
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function GET(request: Request) {
  return handleNearbyRequest(request);
}

export async function POST(request: Request) {
  return handleNearbyRequest(request);
}

async function handleNearbyRequest(request: Request) {
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

  // Get location from request body (POST) or query params (GET)
  let userLat: number | null = null;
  let userLon: number | null = null;
  let maxDistanceMiles = 62; // Default ~100 km in miles

  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      userLat = formData.get("Latitude") ? parseFloat(formData.get("Latitude") as string) : null;
      userLon = formData.get("Longitude") ? parseFloat(formData.get("Longitude") as string) : null;
      if (formData.get("max_distance")) {
        // Assume max_distance is in km, convert to miles
        maxDistanceMiles = parseFloat(formData.get("max_distance") as string) / 1.60934;
      }
    } catch {
      // If formData fails, try JSON
      try {
        const body = await request.json();
        userLat = body.Latitude ? parseFloat(body.Latitude) : null;
        userLon = body.Longitude ? parseFloat(body.Longitude) : null;
        if (body.max_distance) {
          maxDistanceMiles = parseFloat(body.max_distance) / 1.60934;
        }
      } catch {
        // No body provided
      }
    }
  } else {
    const { searchParams } = new URL(request.url);
    userLat = searchParams.get("Latitude") ? parseFloat(searchParams.get("Latitude")!) : null;
    userLon = searchParams.get("Longitude") ? parseFloat(searchParams.get("Longitude")!) : null;
    if (searchParams.get("max_distance")) {
      maxDistanceMiles = parseFloat(searchParams.get("max_distance")!) / 1.60934;
    }
  }

  // Get current user's profile for location and looking_for preference
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("gender, looking_for, latitude, longitude")
    .eq("user_id", user.id)
    .single();

  if (!currentUserProfile) {
    return NextResponse.json(
      { success: false, msg: "Profile not found" },
      { status: 404 }
    );
  }

  // If no location provided in request, use user's profile location
  if (!userLat || !userLon) {
    if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
      userLat = currentUserProfile.latitude;
      userLon = currentUserProfile.longitude;
    }
  }

  if (!userLat || !userLon) {
    return NextResponse.json({
      success: true,
      data: [],
      msg: "No location available. Please enable location services.",
    });
  }

  // Build user profile context with location (possibly from request)
  const userProfile: UserProfileContext = {
    userId: user.id,
    gender: currentUserProfile.gender,
    lookingFor: currentUserProfile.looking_for,
    latitude: userLat,
    longitude: userLon,
  };

  // Get discoverable candidates using the SSOT service
  const result = await getDiscoverableCandidates(supabase, {
    userProfile,
    filters: {
      maxDistanceMiles,
    },
    pagination: { limit: 100, offset: 0 },
    sortBy: "distance",
  });

  // Format profiles for mobile API response
  const formatProfile = async (profile: DiscoverableProfile): Promise<FormattedProfileWithDistance | null> => {
    // Only include profiles with valid distance
    if (profile.distance_km === undefined) {
      return null;
    }

    const imageUrl = await resolveStorageUrl(supabase, profile.profile_image_url);
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
      RATINGS: 0,
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

  const formattedProfiles = (await Promise.all(
    result.profiles.map(formatProfile)
  )).filter((p): p is FormattedProfileWithDistance => p !== null);

  return NextResponse.json({
    success: true,
    data: formattedProfiles,
    msg: "Nearby profiles fetched successfully",
  });
}
