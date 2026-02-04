import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const startCallSchema = z.object({
  roomName: z.string().min(1, "Room name is required"),
  callType: z.enum(["audio", "video"]),
  conversationId: z.string().uuid().optional(),
});

/**
 * POST /api/calls/start
 * Start a call and create a record in the calls table
 *
 * Body:
 * - roomName: LiveKit room name (usually conversation ID)
 * - callType: "audio" or "video"
 * - conversationId: Optional conversation ID
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
    const validation = startCallSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { roomName, callType, conversationId } = validation.data;

    // Verify user has access to the conversation if provided
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
    }

    // Check if there's already an active call for this room
    const { data: existingCall } = await supabase
      .from("calls")
      .select("id")
      .eq("room_name", roomName)
      .is("ended_at", null)
      .single();

    if (existingCall) {
      // Update the existing call to add this participant
      const { data: call } = await supabase
        .from("calls")
        .select("participants")
        .eq("id", existingCall.id)
        .single();

      const participants = (call?.participants as string[]) || [];
      if (!participants.includes(user.id)) {
        await supabase
          .from("calls")
          .update({
            participants: [...participants, user.id],
          })
          .eq("id", existingCall.id);
      }

      return NextResponse.json({
        success: true,
        data: { callId: existingCall.id },
        msg: "Joined existing call",
      });
    }

    // Create a new call record
    const { data: newCall, error: insertError } = await supabase
      .from("calls")
      .insert({
        room_name: roomName,
        conversation_id: conversationId || null,
        call_type: callType,
        participants: [user.id],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating call record:", insertError);
      return NextResponse.json(
        { success: false, msg: "Failed to create call record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { callId: newCall.id },
      msg: "Call started",
    });
  } catch (error) {
    console.error("Error starting call:", error);
    return NextResponse.json(
      { success: false, msg: "Error starting call" },
      { status: 500 }
    );
  }
}
