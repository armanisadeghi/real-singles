import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * DELETE /api/matches/[id]
 * Unmatch a user - removes match records in both directions
 * Optionally archives the conversation (doesn't delete messages)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createApiClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate target user ID is a valid UUID
    const uuidSchema = z.string().uuid("Invalid user ID");
    const validation = uuidSchema.safeParse(targetUserId);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Prevent self-unmatching
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot unmatch yourself" },
        { status: 400 }
      );
    }

    // Check if there's an existing match
    const { data: existingMatch, error: matchCheckError } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user_id.eq.${user.id},target_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},target_user_id.eq.${user.id})`
      )
      .limit(1)
      .single();

    if (matchCheckError && matchCheckError.code !== "PGRST116") {
      console.error("Error checking match:", matchCheckError);
      return NextResponse.json(
        { success: false, error: "Failed to check match status" },
        { status: 500 }
      );
    }

    if (!existingMatch) {
      return NextResponse.json(
        { success: false, error: "No match exists with this user" },
        { status: 404 }
      );
    }

    // Delete match records in both directions
    const { error: deleteError1 } = await supabase
      .from("matches")
      .delete()
      .eq("user_id", user.id)
      .eq("target_user_id", targetUserId);

    if (deleteError1) {
      console.error("Error deleting match (direction 1):", deleteError1);
    }

    const { error: deleteError2 } = await supabase
      .from("matches")
      .delete()
      .eq("user_id", targetUserId)
      .eq("target_user_id", user.id);

    if (deleteError2) {
      console.error("Error deleting match (direction 2):", deleteError2);
    }

    // Archive the conversation if it exists (set status to 'archived' rather than deleting)
    // First, find the conversation between these two users
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant1_id.eq.${user.id},participant2_id.eq.${targetUserId}),and(participant1_id.eq.${targetUserId},participant2_id.eq.${user.id})`
      )
      .single();

    if (conversation && !convError) {
      // Archive the conversation by updating its status
      // Note: If the conversations table doesn't have a status column, this will fail gracefully
      const { error: archiveError } = await supabase
        .from("conversations")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", conversation.id);

      if (archiveError) {
        // If updating status fails (column might not exist), try soft delete via metadata
        console.log("Could not archive conversation, status column may not exist");
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unmatched",
    });
  } catch (error) {
    console.error("Unmatch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/[id]
 * Get match status with a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createApiClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get match status from current user to target
    const { data: myAction, error: myActionError } = await supabase
      .from("matches")
      .select("action, created_at")
      .eq("user_id", user.id)
      .eq("target_user_id", targetUserId)
      .single();

    // Get match status from target to current user
    const { data: theirAction, error: theirActionError } = await supabase
      .from("matches")
      .select("action, created_at")
      .eq("user_id", targetUserId)
      .eq("target_user_id", user.id)
      .single();

    // Determine if it's a mutual match
    const isMutual =
      myAction &&
      theirAction &&
      ["like", "super_like"].includes(myAction.action) &&
      ["like", "super_like"].includes(theirAction.action);

    // Get conversation if mutual
    let conversationId = null;
    if (isMutual) {
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${targetUserId}),and(participant1_id.eq.${targetUserId},participant2_id.eq.${user.id})`
        )
        .single();

      conversationId = conversation?.id || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        my_action: myAction?.action || null,
        my_action_at: myAction?.created_at || null,
        their_action: theirAction?.action || null,
        their_action_at: theirAction?.created_at || null,
        is_mutual: isMutual,
        conversation_id: conversationId,
      },
    });
  } catch (error) {
    console.error("Get match status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
