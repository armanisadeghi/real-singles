import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const inviteSchema = z.object({
  calleeId: z.string().uuid("Invalid callee ID"),
  roomName: z.string().min(1, "Room name is required"),
  callType: z.enum(["audio", "video"]),
  conversationId: z.string().uuid().optional(),
});

/**
 * POST /api/calls/invite
 * Create a call invitation to notify another user of an incoming call
 *
 * Body:
 * - calleeId: UUID of the user to call
 * - roomName: LiveKit room name (usually conversation ID)
 * - callType: "audio" or "video"
 * - conversationId: Optional conversation ID for context
 */
export async function POST(request: Request) {
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

  try {
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { calleeId, roomName, callType, conversationId } = validation.data;

    // Can't call yourself
    if (calleeId === user.id) {
      return NextResponse.json(
        { success: false, msg: "Cannot call yourself" },
        { status: 400 }
      );
    }

    // Verify the caller has access to the conversation (if provided)
    if (conversationId) {
      const { data: participation } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (!participation) {
        return NextResponse.json(
          { success: false, msg: "You don't have access to this conversation" },
          { status: 403 }
        );
      }

      // Verify callee is also in the conversation
      const { data: calleeParticipation } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .eq("user_id", calleeId)
        .single();

      if (!calleeParticipation) {
        return NextResponse.json(
          { success: false, msg: "The other user is not in this conversation" },
          { status: 403 }
        );
      }
    }

    // Cancel any existing pending invitations for this caller/callee/room combination
    await supabase
      .from("call_invitations")
      .update({ status: "cancelled", ended_at: new Date().toISOString() })
      .eq("caller_id", user.id)
      .eq("callee_id", calleeId)
      .eq("room_name", roomName)
      .eq("status", "pending");

    // Create the call invitation
    const { data: invitation, error: insertError } = await supabase
      .from("call_invitations")
      .insert({
        caller_id: user.id,
        callee_id: calleeId,
        room_name: roomName,
        call_type: callType,
        conversation_id: conversationId || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating call invitation:", insertError);
      return NextResponse.json(
        { success: false, msg: "Failed to create call invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        invitationId: invitation.id,
        roomName,
        callType,
      },
      msg: "Call invitation sent",
    });
  } catch (error) {
    console.error("Error creating call invitation:", error);
    return NextResponse.json(
      { success: false, msg: "Error creating call invitation" },
      { status: 500 }
    );
  }
}
