import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/matches/undo
 * Undo the last match action (like, pass, or super_like)
 * 
 * Body:
 * - target_user_id: UUID of the user to undo action for
 * 
 * Returns:
 * - success: boolean
 * - undone_action: the action that was undone
 * - target_user_id: the user ID for navigation back
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
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { target_user_id } = body;

    if (!target_user_id) {
      return NextResponse.json(
        { success: false, error: "target_user_id is required" },
        { status: 400 }
      );
    }

    // Find the match record to undo
    const { data: matchRecord, error: findError } = await supabase
      .from("matches")
      .select("id, action, created_at")
      .eq("user_id", user.id)
      .eq("target_user_id", target_user_id)
      .single();

    if (findError || !matchRecord) {
      return NextResponse.json(
        { success: false, error: "No action found to undo" },
        { status: 404 }
      );
    }

    // Check if the action is recent enough to undo (within 5 minutes)
    if (!matchRecord.created_at) {
      return NextResponse.json(
        { success: false, error: "Invalid match record" },
        { status: 400 }
      );
    }

    const createdAt = new Date(matchRecord.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 5) {
      return NextResponse.json(
        { success: false, error: "Action is too old to undo (max 5 minutes)" },
        { status: 400 }
      );
    }

    // Delete the match record
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchRecord.id);

    if (deleteError) {
      console.error("Error undoing match:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to undo action" },
        { status: 500 }
      );
    }

    // Update last_active_at
    await supabase
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      undone_action: matchRecord.action,
      target_user_id,
      msg: `Successfully undid ${matchRecord.action} action`,
    });
  } catch (error) {
    console.error("Undo match error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/undo
 * Get the last action that can be undone
 * 
 * Returns the most recent match action (within 5 minutes) that can be undone
 */
export async function GET() {
  try {
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

    // Find the most recent match record within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: matchRecord, error: findError } = await supabase
      .from("matches")
      .select("id, action, target_user_id, created_at")
      .eq("user_id", user.id)
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Error finding undoable action:", findError);
      return NextResponse.json(
        { success: false, error: "Failed to check undo status" },
        { status: 500 }
      );
    }

    if (!matchRecord || !matchRecord.created_at) {
      return NextResponse.json({
        success: true,
        can_undo: false,
        msg: "No recent action to undo",
      });
    }

    // Calculate time remaining
    const createdAt = new Date(matchRecord.created_at);
    const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
    const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    return NextResponse.json({
      success: true,
      can_undo: true,
      last_action: {
        action: matchRecord.action,
        target_user_id: matchRecord.target_user_id,
        created_at: matchRecord.created_at,
        seconds_remaining: secondsRemaining,
      },
    });
  } catch (error) {
    console.error("Get undo status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
