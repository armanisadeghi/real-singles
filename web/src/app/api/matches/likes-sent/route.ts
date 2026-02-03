import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl, resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/matches/likes-sent
 * Get users that the current user has liked (but who haven't liked them back yet)
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

    // Get all users that the current user has liked
    const actions = includeSuperLikes ? ["like", "super_like"] : ["like"];
    
    const { data: likesSent, error: likesError, count } = await supabase
      .from("matches")
      .select("id, target_user_id, action, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .in("action", actions)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (likesError) {
      console.error("Likes sent query error:", likesError);
      return NextResponse.json(
        { error: "Failed to fetch likes sent" },
        { status: 500 }
      );
    }

    if (!likesSent || likesSent.length === 0) {
      return NextResponse.json({
        likes: [],
        total: 0,
        limit,
        offset,
      });
    }

    const likedUserIds = likesSent
      .map((l) => l.target_user_id)
      .filter((id): id is string => id !== null);

    // Check which ones have liked us back (these are already matches, exclude them)
    const { data: theirActions } = await supabase
      .from("matches")
      .select("user_id, action")
      .in("user_id", likedUserIds)
      .eq("target_user_id", user.id)
      .in("action", ["like", "super_like"]);

    const mutualLikeIds = new Set(
      theirActions?.map((a) => a.user_id).filter((id): id is string => id !== null) || []
    );

    // Filter to only show non-mutual likes (pending likes)
    const pendingLikes = likesSent.filter(
      (l) => l.target_user_id && !mutualLikeIds.has(l.target_user_id)
    );

    if (pendingLikes.length === 0) {
      return NextResponse.json({
        likes: [],
        total: 0,
        limit,
        offset,
        message: "All your likes have been matched or expired",
      });
    }

    const pendingUserIds = pendingLikes
      .map((l) => l.target_user_id)
      .filter((id): id is string => id !== null);

    // Get profiles for users we liked (exclude hidden profiles)
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
        profile_image_url,
        profile_hidden,
        voice_prompt_url,
        voice_prompt_duration_seconds,
        video_intro_url,
        video_intro_duration_seconds
      `
      )
      .in("user_id", pendingUserIds)
      .eq("profile_hidden", false);

    // Get user data
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, last_active_at")
      .in("id", pendingUserIds);

    // Get primary gallery photos
    const { data: galleries } = await supabase
      .from("user_gallery")
      .select("user_id, media_url")
      .in("user_id", pendingUserIds)
      .eq("media_type", "image")
      .eq("is_primary", true);

    // Combine data with resolved profile image URLs
    const likesWithProfiles = await Promise.all(
      pendingLikes.map(async (like) => {
        const profile = profiles?.find((p) => p.user_id === like.target_user_id);
        const userData = users?.find((u) => u.id === like.target_user_id);
        const gallery = galleries?.find((g) => g.user_id === like.target_user_id);

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

        // Get profile image URL
        const profileImageUrl = profile?.profile_image_url || gallery?.media_url;
        
        return {
          id: like.id,
          user_id: like.target_user_id,
          action: like.action,
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
          // Voice & Video Prompts
          voice_prompt_url: await resolveVoicePromptUrl(supabase, profile?.voice_prompt_url),
          video_intro_url: await resolveVideoIntroUrl(supabase, profile?.video_intro_url),
          voice_prompt_duration_seconds: profile?.voice_prompt_duration_seconds || null,
          video_intro_duration_seconds: profile?.video_intro_duration_seconds || null,
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
      pending_count: pendingLikes.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Likes sent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
