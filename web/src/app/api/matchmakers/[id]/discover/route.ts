import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { verifyMatchmakerOwnership } from "@/lib/services/matchmakers";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/matchmakers/[id]/discover
 * Profile browser for matchmakers (matchmaker only)
 *
 * Unlike regular discovery, this shows ALL eligible profiles without
 * bidirectional gender matching - matchmakers need to see everyone.
 *
 * Query params:
 * - gender: string (filter by gender)
 * - min_age, max_age: number
 * - max_distance: number (in miles, requires lat/lng)
 * - limit: number (default 30, max 100)
 * - offset: number
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId } = await params;

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

  // Verify ownership
  const ownershipCheck = await verifyMatchmakerOwnership(
    supabase,
    matchmakerId,
    user.id
  );
  if (!ownershipCheck.success) {
    return NextResponse.json(
      { success: false, msg: ownershipCheck.error },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Optional filters
  const genderFilter = searchParams.getAll("gender");
  const minAge = searchParams.get("min_age");
  const maxAge = searchParams.get("max_age");

  try {
    // Build query for discoverable profiles
    let query = supabase
      .from("profiles")
      .select(
        `
        user_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        city,
        state,
        profile_image_url,
        is_verified,
        is_photo_verified,
        can_start_matching,
        profile_hidden,
        bio,
        occupation,
        height_inches,
        body_type,
        looking_for,
        users!inner (
          id,
          status
        )
      `
      )
      .eq("can_start_matching", true)
      .eq("profile_hidden", false)
      .eq("users.status", "active")
      .neq("user_id", user.id) // Exclude matchmaker's own profile
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply gender filter
    if (genderFilter.length > 0) {
      query = query.in("gender", genderFilter);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { success: false, msg: "Error fetching profiles" },
        { status: 500 }
      );
    }

    // Filter by age if specified (need to calculate from date_of_birth)
    let filteredProfiles = profiles || [];

    if (minAge || maxAge) {
      const today = new Date();
      filteredProfiles = filteredProfiles.filter((p) => {
        if (!p.date_of_birth) return false;
        const birthDate = new Date(p.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        if (minAge && age < parseInt(minAge)) return false;
        if (maxAge && age > parseInt(maxAge)) return false;
        return true;
      });
    }

    // Resolve profile image URLs
    const transformedProfiles = await Promise.all(
      filteredProfiles.map(async (p) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        gender: p.gender,
        city: p.city,
        state: p.state,
        profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
        is_verified: p.is_verified,
        is_photo_verified: p.is_photo_verified,
        bio: p.bio,
        occupation: p.occupation,
        height_inches: p.height_inches,
        body_type: p.body_type,
        looking_for: p.looking_for,
      }))
    );

    return NextResponse.json({
      success: true,
      profiles: transformedProfiles,
      total: transformedProfiles.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in matchmaker discover:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}
