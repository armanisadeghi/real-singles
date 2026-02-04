import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

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
    .select(
      `
      id,
      matchmaker_id,
      status,
      started_at,
      matchmakers!inner (
        id,
        user_id,
        bio,
        specialties,
        users (
          display_name,
          profiles (
            first_name,
            last_name,
            profile_image_url
          )
        ),
        matchmaker_stats (
          total_introductions,
          successful_introductions,
          average_rating
        )
      )
    `
    )
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

  // Format response
  const matchmaker = relationship.matchmakers;
  const mmUser = matchmaker?.users;
  const mmProfile = mmUser?.profiles?.[0];
  const stats = matchmaker?.matchmaker_stats?.[0];

  const profileImageUrl = mmProfile?.profile_image_url
    ? await resolveStorageUrl(supabase, mmProfile.profile_image_url)
    : "";

  const successRate =
    stats && stats.total_introductions > 0
      ? Math.round(
          (stats.successful_introductions / stats.total_introductions) * 100
        )
      : 0;

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
        stats: {
          total_introductions: stats?.total_introductions || 0,
          successful_introductions: stats?.successful_introductions || 0,
          success_rate: successRate,
          average_rating: stats?.average_rating || null,
        },
      },
    },
    msg: "Matchmaker relationship fetched successfully",
  });
}
