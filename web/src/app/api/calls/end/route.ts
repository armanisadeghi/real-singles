import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const endCallSchema = z.object({
  roomName: z.string().min(1, "Room name is required"),
  duration: z.number().optional(), // Duration in seconds (optional, can be calculated)
});

/**
 * POST /api/calls/end
 * End a call and update the calls table (triggers message creation)
 *
 * Body:
 * - roomName: LiveKit room name (usually conversation ID)
 * - duration: Optional duration in seconds
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
    const validation = endCallSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { roomName, duration } = validation.data;

    // Find the active call for this room
    const { data: activeCall, error: findError } = await supabase
      .from("calls")
      .select("*")
      .eq("room_name", roomName)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !activeCall) {
      // No active call found - might have already ended or never started
      // Try to create a call record if we have a conversation ID
      const isConversationId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomName);
      
      if (isConversationId) {
        // Check if user is part of this conversation
        const { data: participation } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", roomName)
          .eq("user_id", user.id)
          .single();

        if (!participation) {
          return NextResponse.json(
            { success: false, msg: "You are not part of this conversation" },
            { status: 403 }
          );
        }

        // Get other participant
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", roomName)
          .neq("user_id", user.id)
          .single();

        // Create call record with ended state
        const { data: newCall, error: insertError } = await supabase
          .from("calls")
          .insert({
            room_name: roomName,
            conversation_id: roomName,
            call_type: "video", // Default to video
            started_at: new Date(Date.now() - (duration || 0) * 1000).toISOString(),
            ended_at: new Date().toISOString(),
            duration_seconds: duration || 0,
            participants: [user.id, otherParticipant?.user_id].filter((id): id is string => Boolean(id)),
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
          msg: "Call record created",
        });
      }

      return NextResponse.json(
        { success: false, msg: "No active call found for this room" },
        { status: 404 }
      );
    }

    // Verify user is part of this call
    const participantIds = activeCall.participants as string[] || [];
    if (!participantIds.includes(user.id)) {
      // Add user to participants if they're part of the conversation
      if (activeCall.conversation_id) {
        const { data: participation } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", activeCall.conversation_id)
          .eq("user_id", user.id)
          .single();

        if (!participation) {
          return NextResponse.json(
            { success: false, msg: "You are not part of this call" },
            { status: 403 }
          );
        }
      }
    }

    // Calculate duration if not provided
    const calculatedDuration = duration ?? 
      (activeCall.started_at 
        ? Math.floor((Date.now() - new Date(activeCall.started_at).getTime()) / 1000)
        : 0);

    // End the call - this triggers the database trigger to create a message
    const { data: updatedCall, error: updateError } = await supabase
      .from("calls")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: calculatedDuration,
        // Add user to participants if not already there
        participants: participantIds.includes(user.id) 
          ? participantIds 
          : [...participantIds, user.id],
      })
      .eq("id", activeCall.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error ending call:", updateError);
      return NextResponse.json(
        { success: false, msg: "Failed to end call" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        callId: updatedCall.id,
        duration: updatedCall.duration_seconds,
      },
      msg: "Call ended successfully",
    });
  } catch (error) {
    console.error("Error ending call:", error);
    return NextResponse.json(
      { success: false, msg: "Error ending call" },
      { status: 500 }
    );
  }
}
