import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl, resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";
import {
  getDiscoverableCandidates,
  getUserProfileContextWithError,
  userFiltersToDiscoveryFilters,
  type DiscoveryEmptyReason,
} from "@/lib/services/discovery";

/**
 * GET /api/discover/profiles
 * Get profiles for the discovery grid (browse/like/pass flow)
 * 
 * This is the SSOT endpoint for browsing profiles.
 * Uses the shared discovery service to ensure consistent filtering:
 * - Bidirectional gender match
 * - Profile eligibility (can_start_matching, not hidden, not suspended)
 * - Excludes: current user, blocked users, already acted-on users, paused profiles
 * - Excludes users who have passed/blocked the current user
 * - Excludes mutual matches (already matched)
 * 
 * Query params:
 * - limit: number of profiles to return (default 40, max 100)
 * - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "40"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check user's status first - this helps diagnose RLS issues
    const { data: userData } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    // Get current user's profile context (gender, looking_for, location)
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

      // Return a response that the frontend can use to show appropriate UI
      return NextResponse.json({
        profiles: [],
        isProfilePaused: false,
        total: 0,
        limit,
        offset,
        emptyReason,
        error: errorMessage,
      });
    }

    const userProfile = profileResult.profile;

    // Check if user's profile is paused
    const { data: profileData } = await supabase
      .from("profiles")
      .select("profile_hidden")
      .eq("user_id", user.id)
      .single();

    const isProfilePaused = profileData?.profile_hidden || false;

    // Get user's saved filters
    const { data: userFilters } = await supabase
      .from("user_filters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Convert to discovery filters
    const filters = userFiltersToDiscoveryFilters(userFilters);

    // Get discoverable candidates using the SSOT service
    const result = await getDiscoverableCandidates(supabase, {
      userProfile,
      filters,
      pagination: { limit, offset },
    });

    // Resolve storage URLs for profile images
    const transformedProfiles = await Promise.all(
      result.profiles.map(async (p) => ({
        id: p.id,
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        city: p.city,
        state: p.state,
        occupation: p.occupation,
        bio: p.bio,
        profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
        is_verified: p.is_verified,
        height_inches: p.height_inches,
        body_type: p.body_type,
        zodiac_sign: p.zodiac_sign,
        interests: p.interests,
        education: p.education,
        religion: p.religion,
        ethnicity: p.ethnicity,
        languages: p.languages,
        has_kids: p.has_kids,
        wants_kids: p.wants_kids,
        pets: p.pets,
        smoking: p.smoking,
        drinking: p.drinking,
        marijuana: p.marijuana,
        ideal_first_date: p.ideal_first_date,
        non_negotiables: p.non_negotiables,
        way_to_heart: p.way_to_heart,
        craziest_travel_story: p.craziest_travel_story,
        worst_job: p.worst_job,
        dream_job: p.dream_job,
        after_work: p.after_work,
        weirdest_gift: p.weirdest_gift,
        pet_peeves: p.pet_peeves,
        nightclub_or_home: p.nightclub_or_home,
        past_event: p.past_event,
        // Voice & Video Prompts
        voice_prompt_url: await resolveVoicePromptUrl(supabase, p.voice_prompt_url),
        video_intro_url: await resolveVideoIntroUrl(supabase, p.video_intro_url),
        voice_prompt_duration_seconds: p.voice_prompt_duration_seconds,
        video_intro_duration_seconds: p.video_intro_duration_seconds,
        user: p.user ? {
          display_name: p.user.display_name,
          status: p.user.status,
        } : null,
        // Additional fields from discovery service
        distance_km: p.distance_km,
        is_favorite: p.is_favorite,
        has_liked_me: p.has_liked_me,
      }))
    );

    return NextResponse.json({
      profiles: transformedProfiles,
      isProfilePaused,
      total: result.total,
      limit,
      offset,
      // Include emptyReason so frontend can show appropriate message
      emptyReason: result.emptyReason,
    });
  } catch (error) {
    console.error("Discover profiles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
