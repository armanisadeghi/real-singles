import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * DELETE /api/matches/[id]
 * Unmatch a user - soft-deletes match records and archives conversation
 * Preserves history to prevent rediscovery
 * 
 * Query params (optional):
 * - reason: string (e.g., "not_interested", "inappropriate", etc.)
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

    // Get optional unmatch reason from query params
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") ?? undefined;

    // Use database function to soft-delete match (preserves history)
    const { data: result, error: unmatchError } = await supabase.rpc(
      "unmatch_user",
      {
        p_user_id: user.id,
        p_target_user_id: targetUserId,
        p_reason: reason,
      }
    );

    if (unmatchError) {
      console.error("Unmatch error:", unmatchError);
      return NextResponse.json(
        { success: false, error: "Failed to unmatch user" },
        { status: 500 }
      );
    }

    // The RPC function returns a JSON response
    const unmatchResult = result as {
      success: boolean;
      error?: string;
      unmatched_count?: number;
      conversation_archived?: boolean;
      conversation_id?: string;
    };

    if (!unmatchResult.success) {
      return NextResponse.json(
        { success: false, error: unmatchResult.error || "Unmatch failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unmatched",
      data: {
        unmatched_count: unmatchResult.unmatched_count,
        conversation_archived: unmatchResult.conversation_archived,
        conversation_id: unmatchResult.conversation_id,
      },
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
    const { data: myAction } = await supabase
      .from("matches")
      .select("action, created_at, is_unmatched, unmatched_at")
      .eq("user_id", user.id)
      .eq("target_user_id", targetUserId)
      .single();

    // Get match status from target to current user
    const { data: theirAction } = await supabase
      .from("matches")
      .select("action, created_at, is_unmatched, unmatched_at")
      .eq("user_id", targetUserId)
      .eq("target_user_id", user.id)
      .single();

    // Check if either side has been unmatched
    const isUnmatched = myAction?.is_unmatched || theirAction?.is_unmatched;

    // Determine if it's a mutual match (only if not unmatched)
    const isMutual =
      !isUnmatched &&
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
        is_unmatched: isUnmatched || false,
        unmatched_at: myAction?.unmatched_at || theirAction?.unmatched_at || null,
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
