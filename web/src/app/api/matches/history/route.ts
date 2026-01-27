import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/matches/history
 * Get the user's match action history (who they've liked/passed/super-liked)
 * 
 * Query params:
 * - action: filter by action type ("like", "pass", "super_like", or "all")
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();

    // Check authentication
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
    const actionFilter = searchParams.get("action") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("matches")
      .select("id, target_user_id, action, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply action filter
    if (actionFilter !== "all") {
      if (!["like", "pass", "super_like"].includes(actionFilter)) {
        return NextResponse.json(
          { error: "Invalid action filter" },
          { status: 400 }
        );
      }
      query = query.eq("action", actionFilter);
    }

    const { data: history, error: historyError, count } = await query;

    if (historyError) {
      console.error("History query error:", historyError);
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 }
      );
    }

    if (!history || history.length === 0) {
      return NextResponse.json({
        history: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Get profiles for the users in history
    const targetUserIds = history.map((h) => h.target_user_id);

    // Get profiles (exclude hidden profiles - show null for hidden users)
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        first_name,
        date_of_birth,
        gender,
        city,
        state,
        is_verified,
        profile_image_url,
        profile_hidden
      `
      )
      .in("user_id", targetUserIds)
      .eq("profile_hidden", false);

    // Combine data
    const historyWithProfiles = history.map((record) => {
      const profile = profiles?.find((p) => p.user_id === record.target_user_id);
      
      // Calculate age
      let age: number | null = null;
      if (profile?.date_of_birth) {
        const dob = new Date(profile.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      }

      return {
        id: record.id,
        target_user_id: record.target_user_id,
        action: record.action,
        created_at: record.created_at,
        profile: profile
          ? {
              first_name: profile.first_name,
              age,
              gender: profile.gender,
              city: profile.city,
              state: profile.state,
              is_verified: profile.is_verified,
              profile_image_url: profile.profile_image_url,
            }
          : null,
      };
    });

    return NextResponse.json({
      history: historyWithProfiles,
      total: count || historyWithProfiles.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
