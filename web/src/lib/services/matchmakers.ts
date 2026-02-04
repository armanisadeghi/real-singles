/**
 * Matchmakers Service Layer
 * 
 * All business logic for the matchmakers feature lives here.
 * These functions are called by API routes to ensure consistent logic across all platforms.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type DbClient = SupabaseClient<Database>;

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify matchmaker exists and has approved status
 */
export async function verifyMatchmakerApproved(
  supabase: DbClient,
  matchmakerId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: matchmaker, error } = await supabase
    .from("matchmakers")
    .select("id, status, user_id")
    .eq("id", matchmakerId)
    .single();

  if (error || !matchmaker) {
    return { success: false, error: "Matchmaker not found" };
  }

  if (matchmaker.status !== "approved") {
    return { success: false, error: "Matchmaker is not approved" };
  }

  return { success: true };
}

/**
 * Verify user is the owner of the matchmaker account
 */
export async function verifyMatchmakerOwnership(
  supabase: DbClient,
  matchmakerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: matchmaker, error } = await supabase
    .from("matchmakers")
    .select("user_id")
    .eq("id", matchmakerId)
    .single();

  if (error || !matchmaker) {
    return { success: false, error: "Matchmaker not found" };
  }

  if (matchmaker.user_id !== userId) {
    return { success: false, error: "Not authorized" };
  }

  return { success: true };
}

// ============================================================================
// INTRODUCTION VALIDATION
// ============================================================================

/**
 * Check if users are already matched
 */
export async function checkExistingMatch(
  supabase: DbClient,
  userAId: string,
  userBId: string
): Promise<{ exists: boolean }> {
  const { data, error } = await supabase
    .from("matches")
    .select("id")
    .or(
      `and(user_id.eq.${userAId},target_user_id.eq.${userBId}),and(user_id.eq.${userBId},target_user_id.eq.${userAId})`
    )
    .eq("is_unmatched", false)
    .limit(1)
    .maybeSingle();

  return { exists: !!data };
}

/**
 * Check if either user has blocked the other
 */
export async function checkBlockStatus(
  supabase: DbClient,
  userAId: string,
  userBId: string
): Promise<{ blocked: boolean }> {
  const { data, error } = await supabase
    .from("blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${userAId},blocked_id.eq.${userBId}),and(blocker_id.eq.${userBId},blocked_id.eq.${userAId})`
    )
    .limit(1)
    .maybeSingle();

  return { blocked: !!data };
}

/**
 * Check for duplicate pending introduction between same users
 */
export async function checkDuplicateIntro(
  supabase: DbClient,
  matchmakerId: string,
  userAId: string,
  userBId: string
): Promise<{ exists: boolean; introId?: string }> {
  // Check for any pending intro between these users (regardless of order)
  const { data, error } = await supabase
    .from("matchmaker_introductions")
    .select("id")
    .eq("matchmaker_id", matchmakerId)
    .or(
      `and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`
    )
    .in("status", ["pending", "user_a_accepted", "user_b_accepted"])
    .limit(1)
    .maybeSingle();

  if (data) {
    return { exists: true, introId: data.id };
  }

  return { exists: false };
}

/**
 * Verify both users exist and are active
 */
export async function verifyUsersExist(
  supabase: DbClient,
  userIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const { data: users, error } = await supabase
    .from("users")
    .select("id, status")
    .in("id", userIds);

  if (error || !users) {
    return { success: false, error: "Error verifying users" };
  }

  if (users.length !== userIds.length) {
    return { success: false, error: "One or more users not found" };
  }

  const inactiveUser = users.find((u) => u.status !== "active");
  if (inactiveUser) {
    return { success: false, error: "One or more users are inactive" };
  }

  return { success: true };
}

// ============================================================================
// INTRODUCTION CREATION
// ============================================================================

/**
 * Create a 3-person group conversation for an introduction
 * Returns the conversation ID
 */
export async function createIntroductionConversation(
  supabase: DbClient,
  introId: string,
  matchmakerId: string,
  userAId: string,
  userBId: string,
  introMessage: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    // Get matchmaker's user_id
    const { data: matchmaker, error: mmError } = await supabase
      .from("matchmakers")
      .select("user_id")
      .eq("id", matchmakerId)
      .single();

    if (mmError || !matchmaker) {
      return { success: false, error: "Matchmaker not found" };
    }

    // Get matchmaker's display name for group name
    const { data: mmUser, error: mmUserError } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", matchmaker.user_id)
      .single();

    if (mmUserError || !mmUser) {
      return { success: false, error: "Matchmaker user not found" };
    }

    const groupName = `Introduction from ${mmUser.display_name}`;

    // Create the conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        type: "group",
        group_name: groupName,
        created_by: matchmaker.user_id,
      })
      .select("id")
      .single();

    if (convError || !conversation) {
      return { success: false, error: "Failed to create conversation" };
    }

    // Add all 3 participants
    const participants = [
      {
        conversation_id: conversation.id,
        user_id: matchmaker.user_id,
        role: "owner",
      },
      {
        conversation_id: conversation.id,
        user_id: userAId,
        role: "member",
      },
      {
        conversation_id: conversation.id,
        user_id: userBId,
        role: "member",
      },
    ];

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert(participants);

    if (partError) {
      // Rollback: delete conversation
      await supabase.from("conversations").delete().eq("id", conversation.id);
      return { success: false, error: "Failed to add participants" };
    }

    // Post system message with intro text
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: matchmaker.user_id,
      content: introMessage,
      message_type: "system",
      status: "sent",
    });

    if (msgError) {
      console.error("Failed to post intro message:", msgError);
      // Don't fail the whole operation - conversation is created
    }

    // Update introduction record with conversation_id
    const { error: updateError } = await supabase
      .from("matchmaker_introductions")
      .update({ conversation_id: conversation.id })
      .eq("id", introId);

    if (updateError) {
      console.error("Failed to link conversation to intro:", updateError);
      // Don't fail - conversation is still usable
    }

    return { success: true, conversationId: conversation.id };
  } catch (error) {
    console.error("Error creating introduction conversation:", error);
    return { success: false, error: "Unexpected error creating conversation" };
  }
}

// ============================================================================
// STATS CALCULATION
// ============================================================================

/**
 * Calculate and cache matchmaker statistics
 * Calls the database function that updates the matchmaker_stats table
 */
export async function calculateMatchmakerStats(
  supabase: DbClient,
  matchmakerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc("calculate_matchmaker_stats", {
      p_matchmaker_id: matchmakerId,
    });

    if (error) {
      console.error("Error calculating matchmaker stats:", error);
      return { success: false, error: "Failed to calculate stats" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in calculateMatchmakerStats:", error);
    return { success: false, error: "Unexpected error" };
  }
}

/**
 * Get matchmaker's performance metrics
 */
export async function getMatchmakerStats(
  supabase: DbClient,
  matchmakerId: string
): Promise<{
  success: boolean;
  stats?: {
    total_introductions: number;
    successful_introductions: number;
    active_clients: number;
    total_clients: number;
    average_rating: number | null;
    total_reviews: number;
    success_rate: number;
  };
  error?: string;
}> {
  const { data: stats, error } = await supabase
    .from("matchmaker_stats")
    .select("*")
    .eq("matchmaker_id", matchmakerId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found
    return { success: false, error: "Failed to fetch stats" };
  }

  if (!stats) {
    // Return zeros if no stats exist yet
    return {
      success: true,
      stats: {
        total_introductions: 0,
        successful_introductions: 0,
        active_clients: 0,
        total_clients: 0,
        average_rating: null,
        total_reviews: 0,
        success_rate: 0,
      },
    };
  }

  // Calculate success rate percentage
  const success_rate =
    stats.total_introductions > 0
      ? Math.round(
          (stats.successful_introductions / stats.total_introductions) * 100
        )
      : 0;

  return {
    success: true,
    stats: {
      ...stats,
      success_rate,
    },
  };
}

// ============================================================================
// CLIENT RELATIONSHIP MANAGEMENT
// ============================================================================

/**
 * Check if user already has an active relationship with this matchmaker
 */
export async function checkExistingClientRelationship(
  supabase: DbClient,
  matchmakerId: string,
  clientUserId: string
): Promise<{ exists: boolean; relationshipId?: string }> {
  const { data, error } = await supabase
    .from("matchmaker_clients")
    .select("id")
    .eq("matchmaker_id", matchmakerId)
    .eq("client_user_id", clientUserId)
    .eq("status", "active")
    .maybeSingle();

  if (data) {
    return { exists: true, relationshipId: data.id };
  }

  return { exists: false };
}

// ============================================================================
// INTRODUCTION STATUS UPDATES
// ============================================================================

/**
 * Update introduction status based on user response
 * Returns new status and whether a conversation should be created
 */
export function calculateIntroStatusUpdate(
  currentStatus: string,
  respondingUserId: string,
  userAId: string,
  userBId: string,
  action: "accept" | "decline"
): {
  newStatus: string;
  shouldCreateConversation: boolean;
  responseField: "user_a_response_at" | "user_b_response_at";
} {
  const isUserA = respondingUserId === userAId;
  const responseField = isUserA ? "user_a_response_at" : "user_b_response_at";

  if (action === "decline") {
    const newStatus = isUserA ? "user_a_declined" : "user_b_declined";
    return { newStatus, shouldCreateConversation: false, responseField };
  }

  // User is accepting
  if (currentStatus === "pending") {
    // First user to accept
    const newStatus = isUserA ? "user_a_accepted" : "user_b_accepted";
    return { newStatus, shouldCreateConversation: false, responseField };
  } else if (
    (currentStatus === "user_a_accepted" && !isUserA) ||
    (currentStatus === "user_b_accepted" && isUserA)
  ) {
    // Second user accepting - both have accepted!
    return {
      newStatus: "both_accepted",
      shouldCreateConversation: true,
      responseField,
    };
  }

  // User trying to accept twice or other invalid state
  return { newStatus: currentStatus, shouldCreateConversation: false, responseField };
}
