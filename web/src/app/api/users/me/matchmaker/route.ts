import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { getMatchmakerStats } from "@/lib/services/matchmakers";

/**
 * GET /api/users/me/matchmaker
 * Get current user's matchmaker relationship
 */
export async function GET(request: NextRequest) {
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

  // Get active matchmaker relationship
  const { data: relationship, error } = await supabase
    .from("matchmaker_clients")
    .select("id, matchmaker_id, status, started_at")
    .eq("client_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Error fetching matchmaker relationship:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching relationship" },
      { status: 500 }
    );
  }

  if (!relationship) {
    return NextResponse.json({
      success: true,
      data: null,
      msg: "No active matchmaker relationship",
    });
  }

  // Get matchmaker details
  const { data: matchmaker } = await supabase
    .from("matchmakers")
    .select("id, user_id, bio, specialties")
    .eq("id", relationship.matchmaker_id)
    .single();

  if (!matchmaker) {
    return NextResponse.json({
      success: true,
      data: null,
      msg: "Matchmaker not found",
    });
  }

  // Get matchmaker user and profile
  const { data: mmUser } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", matchmaker.user_id)
    .single();

  const { data: mmProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name, profile_image_url")
    .eq("user_id", matchmaker.user_id)
    .single();

  // Get stats
  const { stats } = await getMatchmakerStats(supabase, matchmaker.id);

  const profileImageUrl = mmProfile?.profile_image_url
    ? await resolveStorageUrl(supabase, mmProfile.profile_image_url)
    : "";

  return NextResponse.json({
    success: true,
    data: {
      relationship_id: relationship.id,
      matchmaker_id: matchmaker.id,
      status: relationship.status,
      started_at: relationship.started_at,
      matchmaker: {
        display_name: mmUser?.display_name || "Matchmaker",
        first_name: mmProfile?.first_name || "",
        last_name: mmProfile?.last_name || "",
        profile_image_url: profileImageUrl,
        bio: matchmaker.bio,
        specialties: matchmaker.specialties || [],
        stats,
      },
    },
    msg: "Matchmaker relationship fetched successfully",
  });
}
