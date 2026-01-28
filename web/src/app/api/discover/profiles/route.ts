import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/discover/profiles
 * Get profiles for the discovery grid (browse/like/pass flow)
 * 
 * This is the SSOT endpoint for browsing profiles.
 * Excludes: current user, blocked users, already acted-on users, paused profiles
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

    // Get current user's profile to check if paused
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("profile_hidden")
      .eq("user_id", user.id)
      .single();

    const isProfilePaused = currentUserProfile?.profile_hidden || false;

    // Get blocked user IDs to exclude
    const { data: blockedUsers } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id);

    const blockedIds = blockedUsers?.map(b => b.blocked_id).filter((id): id is string => id !== null) || [];

    // Get profiles already liked/passed to exclude
    const { data: matchedUsers } = await supabase
      .from("matches")
      .select("target_user_id")
      .eq("user_id", user.id);

    const matchedIds = matchedUsers?.map(m => m.target_user_id).filter((id): id is string => id !== null) || [];

    // Build exclude list
    const excludeIds = [user.id, ...blockedIds, ...matchedIds];

    // Get profiles excluding current user, blocked users, and already matched
    // Also exclude hidden/paused profiles
    const { data: profiles, error: profilesError, count } = await supabase
      .from("profiles")
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        date_of_birth,
        city,
        state,
        occupation,
        bio,
        profile_image_url,
        is_verified,
        height_inches,
        body_type,
        zodiac_sign,
        interests,
        education,
        religion,
        ethnicity,
        languages,
        has_kids,
        wants_kids,
        pets,
        smoking,
        drinking,
        marijuana,
        ideal_first_date,
        non_negotiables,
        way_to_heart,
        craziest_travel_story,
        worst_job,
        dream_job,
        after_work,
        weirdest_gift,
        pet_peeves,
        nightclub_or_home,
        past_event,
        user:user_id(display_name, status)
      `, { count: "exact" })
      .not("user_id", "in", `(${excludeIds.join(",")})`)
      .or("profile_hidden.is.null,profile_hidden.eq.false")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error("Profiles query error:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    // Transform user array to single object and resolve storage URLs
    const transformedProfiles = await Promise.all(
      (profiles || []).map(async (p) => ({
        ...p,
        user: Array.isArray(p.user) ? p.user[0] ?? null : p.user,
        profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
      }))
    );

    return NextResponse.json({
      profiles: transformedProfiles,
      isProfilePaused,
      total: count || transformedProfiles.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Discover profiles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
