import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/users/me/introductions
 * Get introductions where the current user is a participant
 *
 * Query params:
 * - status: filter by status (pending, active, declined)
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 */
export async function GET(request: NextRequest) {
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

  const statusFilter = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Fetch introductions where user is either user_a or user_b
  let query = supabase
    .from("matchmaker_introductions")
    .select(
      `
      id,
      matchmaker_id,
      user_a_id,
      user_b_id,
      intro_message,
      status,
      user_a_response_at,
      user_b_response_at,
      outcome,
      conversation_id,
      created_at,
      expires_at
    `
    )
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: intros, error, count } = await query.range(
    offset,
    offset + limit - 1
  );

  if (error) {
    console.error("Error fetching user introductions:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching introductions" },
      { status: 500 }
    );
  }

  // Get all user IDs we need to look up (other user + matchmaker)
  const userIds = new Set<string>();
  const matchmakerIds = new Set<string>();

  intros?.forEach((intro) => {
    // Add the OTHER user (not current user)
    if (intro.user_a_id === user.id) {
      userIds.add(intro.user_b_id);
    } else {
      userIds.add(intro.user_a_id);
    }
    matchmakerIds.add(intro.matchmaker_id);
  });

  // Fetch profiles for the other users
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "user_id, first_name, last_name, profile_image_url, city, state, date_of_birth, bio, occupation"
    )
    .in("user_id", Array.from(userIds));

  // Fetch matchmaker info
  const { data: matchmakers } = await supabase
    .from("matchmakers")
    .select("id, user_id, bio")
    .in("id", Array.from(matchmakerIds));

  // Also get matchmaker profiles for name and image
  const matchmakerUserIds = matchmakers?.map((m) => m.user_id) || [];
  const { data: matchmakerProfiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, profile_image_url")
    .in("user_id", matchmakerUserIds);

  // Also get display names
  const { data: matchmakerUsers } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", matchmakerUserIds);

  // Create lookup maps
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
  const matchmakerMap = new Map(matchmakers?.map((m) => [m.id, m]) || []);
  const matchmakerProfileMap = new Map(
    matchmakerProfiles?.map((p) => [p.user_id, p]) || []
  );
  const matchmakerUserMap = new Map(
    matchmakerUsers?.map((u) => [u.id, u]) || []
  );

  // Helper to determine user's response from status
  const getUserResponse = (
    status: string,
    isUserA: boolean
  ): string | null => {
    if (status === "pending") return null;
    if (status === "both_accepted" || status === "active") return "accepted";
    if (isUserA) {
      if (status === "user_a_accepted") return "accepted";
      if (status === "user_a_declined") return "declined";
      // If user_b declined/accepted and user_a hasn't responded
      if (status === "user_b_accepted" || status === "user_b_declined")
        return null;
    } else {
      if (status === "user_b_accepted") return "accepted";
      if (status === "user_b_declined") return "declined";
      // If user_a declined/accepted and user_b hasn't responded
      if (status === "user_a_accepted" || status === "user_a_declined")
        return null;
    }
    return null;
  };

  // Format response
  const formatted = await Promise.all(
    (intros || []).map(async (intro) => {
      // Determine which user is the "other" user
      const isUserA = intro.user_a_id === user.id;
      const otherUserId = isUserA ? intro.user_b_id : intro.user_a_id;
      const myResponse = getUserResponse(intro.status, isUserA);

      const otherProfile = profileMap.get(otherUserId);
      const matchmaker = matchmakerMap.get(intro.matchmaker_id);
      const matchmakerProfile = matchmaker
        ? matchmakerProfileMap.get(matchmaker.user_id)
        : null;
      const matchmakerUser = matchmaker
        ? matchmakerUserMap.get(matchmaker.user_id)
        : null;

      // Resolve image URLs
      const otherImageUrl = otherProfile?.profile_image_url
        ? await resolveStorageUrl(supabase, otherProfile.profile_image_url)
        : null;

      const matchmakerImageUrl = matchmakerProfile?.profile_image_url
        ? await resolveStorageUrl(supabase, matchmakerProfile.profile_image_url)
        : null;

      // Calculate age
      let otherAge = null;
      if (otherProfile?.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(otherProfile.date_of_birth);
        otherAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          otherAge--;
        }
      }

      // Get matchmaker display name
      const matchmakerName =
        matchmakerUser?.display_name ||
        `${matchmakerProfile?.first_name || ""} ${matchmakerProfile?.last_name || ""}`.trim() ||
        "Matchmaker";

      return {
        id: intro.id,
        status: intro.status,
        my_response: myResponse,
        intro_message: intro.intro_message,
        conversation_id: intro.conversation_id,
        created_at: intro.created_at,
        expires_at: intro.expires_at,
        // The other user in the introduction
        other_user: {
          id: otherUserId,
          first_name: otherProfile?.first_name || null,
          last_name: otherProfile?.last_name || null,
          profile_image_url: otherImageUrl,
          city: otherProfile?.city || null,
          state: otherProfile?.state || null,
          age: otherAge,
          bio: otherProfile?.bio || null,
          occupation: otherProfile?.occupation || null,
        },
        // The matchmaker who made the introduction
        matchmaker: {
          id: intro.matchmaker_id,
          name: matchmakerName,
          profile_image_url: matchmakerImageUrl,
        },
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formatted,
    total: count || formatted.length,
    msg: "Introductions fetched successfully",
  });
}
