import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/matches/likes-received
 * Get users who have liked the current user (but haven't been matched yet)
 * This is typically a premium feature - shows "who liked you"
 * 
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 * - include_super: include super-likes (default true)
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeSuperLikes = searchParams.get("include_super") !== "false";

    // Get all users who have liked the current user
    const actions = includeSuperLikes ? ["like", "super_like"] : ["like"];
    
    const { data: likesReceived, error: likesError, count } = await supabase
      .from("matches")
      .select("id, user_id, action, created_at", { count: "exact" })
      .eq("target_user_id", user.id)
      .in("action", actions)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (likesError) {
      console.error("Likes query error:", likesError);
      return NextResponse.json(
        { error: "Failed to fetch likes" },
        { status: 500 }
      );
    }

    if (!likesReceived || likesReceived.length === 0) {
      return NextResponse.json({
        likes: [],
        total: 0,
        limit,
        offset,
      });
    }

    const likerIds = likesReceived
      .map((l) => l.user_id)
      .filter((id): id is string => id !== null);

    // Check which ones the current user has already acted on
    const { data: myActions } = await supabase
      .from("matches")
      .select("target_user_id, action")
      .eq("user_id", user.id)
      .in("target_user_id", likerIds);

    const myActionsMap: Record<string, string> = {};
    myActions?.forEach((a) => {
      if (a.target_user_id) {
        myActionsMap[a.target_user_id] = a.action;
      }
    });

    // Filter to only show unacted likes (not yet mutual or passed)
    const unactedLikes = likesReceived.filter(
      (l) => l.user_id && !myActionsMap[l.user_id]
    );

    if (unactedLikes.length === 0) {
      return NextResponse.json({
        likes: [],
        total: 0,
        limit,
        offset,
        message: "You've already responded to all likes",
      });
    }

    const unactedLikerIds = unactedLikes
      .map((l) => l.user_id)
      .filter((id): id is string => id !== null);

    // Get profiles for users who liked
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
        occupation,
        bio,
        is_verified,
        profile_image_url
      `
      )
      .in("user_id", unactedLikerIds);

    // Get user data
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, last_active_at")
      .in("id", unactedLikerIds);

    // Get primary gallery photos
    const { data: galleries } = await supabase
      .from("user_gallery")
      .select("user_id, media_url")
      .in("user_id", unactedLikerIds)
      .eq("media_type", "image")
      .eq("is_primary", true);

    // Combine data with resolved profile image URLs
    const likesWithProfiles = await Promise.all(
      unactedLikes.map(async (like) => {
        const profile = profiles?.find((p) => p.user_id === like.user_id);
        const userData = users?.find((u) => u.id === like.user_id);
        const gallery = galleries?.find((g) => g.user_id === like.user_id);

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

        // Get profile image URL - might be a storage path, so convert if needed
        const profileImageUrl = profile?.profile_image_url || gallery?.media_url;
        
        return {
          id: like.id,
          user_id: like.user_id,
          action: like.action, // "like" or "super_like"
          is_super_like: like.action === "super_like",
          liked_at: like.created_at,
          display_name: userData?.display_name,
          first_name: profile?.first_name,
          age,
          gender: profile?.gender,
          city: profile?.city,
          state: profile?.state,
          occupation: profile?.occupation,
          bio: profile?.bio ? profile.bio.substring(0, 150) + "..." : null,
          is_verified: profile?.is_verified || false,
          profile_image_url: await resolveStorageUrl(supabase, profileImageUrl),
          last_active_at: userData?.last_active_at,
        };
      })
    );

    // Sort super-likes first, then by date
    likesWithProfiles.sort((a, b) => {
      if (a.is_super_like && !b.is_super_like) return -1;
      if (!a.is_super_like && b.is_super_like) return 1;
      const aTime = a.liked_at ? new Date(a.liked_at).getTime() : 0;
      const bTime = b.liked_at ? new Date(b.liked_at).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      likes: likesWithProfiles,
      total: count || likesWithProfiles.length,
      unacted_count: unactedLikes.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Likes received error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
