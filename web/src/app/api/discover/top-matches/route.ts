import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl, resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";
import {
  getDiscoverableCandidates,
  getUserProfileContext,
  type DiscoveryFilters,
  type DiscoverableProfile,
} from "@/lib/services/discovery";

// Type for formatted profile with distance
interface FormattedProfile {
  ID: string | null;
  id: string | null;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  Email: string;
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

/**
 * GET /api/discover/top-matches
 * Get top matches with optional filter parameters
 * 
 * Uses the shared discovery service for consistent filtering:
 * - Bidirectional gender match
 * - Profile eligibility
 * - Proper exclusions (blocked, passed, mutual matches)
 * 
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function GET(request: Request) {
  const supabase = await createApiClient();
  const { searchParams } = new URL(request.url);

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

  // Get user profile context
  const userProfile = await getUserProfileContext(supabase, user.id);

  if (!userProfile) {
    return NextResponse.json(
      { success: false, msg: "Profile not found" },
      { status: 404 }
    );
  }

  // Parse filter parameters from query string
  const queryFilters = {
    min_age: searchParams.get("min_age"),
    max_age: searchParams.get("max_age"),
    min_height: searchParams.get("min_height"),
    max_height: searchParams.get("max_height"),
    BodyType: searchParams.get("BodyType"),
    Ethnicity: searchParams.get("Ethnicity"),
    Drinks: searchParams.get("Drinks"),
    Religion: searchParams.get("Religion"),
    Education: searchParams.get("Education"),
    HaveChild: searchParams.get("HaveChild"),
    WantChild: searchParams.get("WantChild"),
    Hsign: searchParams.get("Hsign"),
    Marijuana: searchParams.get("Marijuana"),
    Smoke: searchParams.get("Smoke"),
    max_distance: searchParams.get("max_distance"),
  };

  // Convert query params to DiscoveryFilters format
  const filters: DiscoveryFilters = {};

  if (queryFilters.min_age) {
    filters.minAge = parseInt(queryFilters.min_age);
  }
  if (queryFilters.max_age) {
    filters.maxAge = parseInt(queryFilters.max_age);
  }
  if (queryFilters.min_height) {
    // Convert feet to inches (input is in feet)
    filters.minHeight = Math.round(parseFloat(queryFilters.min_height) * 12);
  }
  if (queryFilters.max_height) {
    filters.maxHeight = Math.round(parseFloat(queryFilters.max_height) * 12);
  }
  if (queryFilters.max_distance) {
    filters.maxDistanceMiles = parseFloat(queryFilters.max_distance);
  }
  if (queryFilters.BodyType) {
    filters.bodyTypes = [queryFilters.BodyType.toLowerCase()];
  }
  if (queryFilters.Ethnicity) {
    filters.ethnicities = [queryFilters.Ethnicity];
  }
  if (queryFilters.Religion) {
    filters.religions = [queryFilters.Religion];
  }
  if (queryFilters.Education) {
    filters.educationLevels = [queryFilters.Education];
  }
  if (queryFilters.Hsign) {
    const zodiacSigns = queryFilters.Hsign.split(",").filter(Boolean);
    if (zodiacSigns.length > 0) {
      filters.zodiacSigns = zodiacSigns;
    }
  }
  if (queryFilters.Smoke) {
    filters.smoking = queryFilters.Smoke.toLowerCase();
  }
  if (queryFilters.Drinks) {
    filters.drinking = queryFilters.Drinks.toLowerCase();
  }
  if (queryFilters.Marijuana) {
    filters.marijuana = queryFilters.Marijuana.toLowerCase();
  }
  if (queryFilters.HaveChild && queryFilters.HaveChild !== "any") {
    const hasKidsValue = queryFilters.HaveChild === "Yes" || queryFilters.HaveChild === "true" ? "Yes" : "No";
    filters.hasKids = hasKidsValue;
  }
  if (queryFilters.WantChild && queryFilters.WantChild !== "any") {
    filters.wantsKids = queryFilters.WantChild;
  }

  // Get discoverable candidates using the SSOT service
  const result = await getDiscoverableCandidates(supabase, {
    userProfile,
    filters,
    pagination: { limit: 50, offset: 0 },
    sortBy: "recent",
  });

  // Format profiles for mobile API response
  const formatProfile = async (profile: DiscoverableProfile): Promise<FormattedProfile> => {
    const imageUrl = await resolveStorageUrl(supabase, profile.profile_image_url);
    return {
      ID: profile.user_id,
      id: profile.user_id,
      DisplayName: profile.user?.display_name || profile.first_name || "",
      FirstName: profile.first_name || "",
      LastName: profile.last_name || "",
      Email: profile.user?.email || "",
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

  const formattedProfiles = await Promise.all(
    result.profiles.map(formatProfile)
  );

  return NextResponse.json({
    success: true,
    data: formattedProfiles,
    msg: "Top matches fetched successfully",
  });
}
