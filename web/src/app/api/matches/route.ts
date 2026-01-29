import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl, resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";
import { getMutualMatches } from "@/lib/services/discovery";
import { z } from "zod";

// Validation schema for match action
const matchActionSchema = z.object({
  target_user_id: z.string().uuid("Invalid user ID"),
  action: z.enum(["like", "pass", "super_like"]),
});

/**
 * POST /api/matches
 * Record a match action (like, pass, or super-like)
 * 
 * Body:
 * - target_user_id: UUID of the user being acted upon
 * - action: "like" | "pass" | "super_like"
 * 
 * Returns:
 * - The match record
 * - is_mutual: boolean indicating if this created a mutual match
 * - conversation_id: if mutual, the conversation ID for chatting
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = matchActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { target_user_id, action } = validation.data;

    // Prevent self-matching
    if (target_user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot match with yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists and is active
    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("id, status")
      .eq("id", target_user_id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Allow matching with users who are "active" or have null status (new users)
    // Only reject suspended/deleted users
    if (targetUser.status === "suspended" || targetUser.status === "deleted") {
      return NextResponse.json(
        { error: "User is not available" },
        { status: 400 }
      );
    }

    // Check if user is blocked by target or has blocked target
    const { data: blockExists } = await supabase
      .from("blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${user.id},blocked_id.eq.${target_user_id}),and(blocker_id.eq.${target_user_id},blocked_id.eq.${user.id})`
      )
      .maybeSingle();

    if (blockExists) {
      return NextResponse.json(
        { error: "Cannot interact with this user" },
        { status: 403 }
      );
    }

    // Upsert the match action (update if exists, insert if not)
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .upsert(
        {
          user_id: user.id,
          target_user_id,
          action,
        },
        {
          onConflict: "user_id,target_user_id",
        }
      )
      .select()
      .single();

    if (matchError) {
      console.error("Match error:", matchError);
      return NextResponse.json(
        { error: "Failed to record action" },
        { status: 500 }
      );
    }

    // Check for mutual match (both users liked each other)
    let isMutual = false;
    let conversationId: string | null = null;

    if (action === "like" || action === "super_like") {
      // Check if target has also liked the current user
      const { data: reciprocalMatch } = await supabase
        .from("matches")
        .select("id, action")
        .eq("user_id", target_user_id)
        .eq("target_user_id", user.id)
        .in("action", ["like", "super_like"])
        .maybeSingle();

      if (reciprocalMatch) {
        isMutual = true;

        // Check if conversation already exists
        const { data: existingConvo } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Find conversation with target user
        if (existingConvo?.conversation_id) {
          const { data: sharedConvo } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("conversation_id", existingConvo.conversation_id)
            .eq("user_id", target_user_id)
            .maybeSingle();

          if (sharedConvo) {
            conversationId = sharedConvo.conversation_id;
          }
        }

        // Create new conversation if none exists
        if (!conversationId) {
          const { data: newConvo, error: convoError } = await supabase
            .from("conversations")
            .insert({
              type: "direct",
              created_by: user.id,
            })
            .select("id")
            .single();

          if (!convoError && newConvo) {
            conversationId = newConvo.id;

            // Add both participants
            await supabase.from("conversation_participants").insert([
              { conversation_id: conversationId, user_id: user.id },
              { conversation_id: conversationId, user_id: target_user_id },
            ]);

            // Create notification for the other user
            await supabase.from("notifications").insert({
              user_id: target_user_id,
              type: "match",
              title: "New Match!",
              body: "You have a new match! Start a conversation now.",
              data: {
                match_user_id: user.id,
                conversation_id: conversationId,
              },
            });
          }
        }
      }
    }

    // Award points for super-like (costs points typically, but let's award for demo)
    if (action === "super_like") {
      // Note: In production, you might deduct points instead
      // For now, we'll just log it
      console.log(`User ${user.id} used super-like on ${target_user_id}`);
    }

    // Update last_active_at
    await supabase
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      match: matchData,
      is_mutual: isMutual,
      conversation_id: conversationId,
    });
  } catch (error) {
    console.error("Match error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches
 * Get all mutual matches for the current user
 * 
 * Uses the shared discovery service getMutualMatches() for consistent logic.
 * 
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 * 
 * Returns profiles of users who have mutually matched
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

    // Use the SSOT getMutualMatches function
    const allMatches = await getMutualMatches(supabase, user.id);

    if (allMatches.length === 0) {
      return NextResponse.json({
        matches: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Apply pagination
    const paginatedMatches = allMatches.slice(offset, offset + limit);

    // Get gallery photos for matched users
    const matchedUserIds = paginatedMatches.map(m => m.userId);
    
    const { data: galleries } = await supabase
      .from("user_gallery")
      .select("user_id, media_url, is_primary")
      .in("user_id", matchedUserIds)
      .eq("media_type", "image")
      .order("is_primary", { ascending: false })
      .order("display_order", { ascending: true });

    // Get last_active_at for each user
    const { data: users } = await supabase
      .from("users")
      .select("id, last_active_at")
      .in("id", matchedUserIds);

    // Format matches with profile data and resolve URLs
    const matchesWithProfiles = await Promise.all(
      paginatedMatches.map(async (match) => {
        const profile = match.profile;
        const userGallery = galleries?.filter((g) => g.user_id === match.userId) || [];
        const userData = users?.find((u) => u.id === match.userId);

        // Calculate age from date of birth
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

        // Convert profile image URL
        const profileImageUrl = await resolveStorageUrl(
          supabase, 
          match.primaryPhoto || profile?.profile_image_url
        );
        
        // Convert gallery URLs
        const galleryWithUrls = await Promise.all(
          userGallery.slice(0, 3).map(async (g) => ({
            ...g,
            media_url: await resolveStorageUrl(supabase, g.media_url),
          }))
        );

        return {
          user_id: match.userId,
          display_name: match.user?.display_name,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          age,
          gender: profile?.gender,
          city: profile?.city,
          state: profile?.state,
          occupation: profile?.occupation,
          bio: profile?.bio,
          is_verified: profile?.is_verified || false,
          profile_image_url: profileImageUrl,
          gallery: galleryWithUrls,
          last_active_at: userData?.last_active_at,
          matched_at: match.matchedAt,
          conversation_id: match.conversationId || null,
          // Voice & Video Prompts
          voice_prompt_url: await resolveVoicePromptUrl(supabase, profile?.voice_prompt_url),
          video_intro_url: await resolveVideoIntroUrl(supabase, profile?.video_intro_url),
          voice_prompt_duration_seconds: profile?.voice_prompt_duration_seconds || null,
          video_intro_duration_seconds: profile?.video_intro_duration_seconds || null,
        };
      })
    );

    return NextResponse.json({
      matches: matchesWithProfiles,
      total: allMatches.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
