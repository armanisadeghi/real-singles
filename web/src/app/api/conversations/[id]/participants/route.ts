import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const addParticipantSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
});

/**
 * POST /api/conversations/[id]/participants
 * Add a participant to a group conversation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
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

  // Verify conversation exists and is a group
  const { data: conversation } = await supabase
    .from("conversations")
    .select("type")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { success: false, msg: "Conversation not found" },
      { status: 404 }
    );
  }

  if (conversation.type !== "group") {
    return NextResponse.json(
      { success: false, msg: "Can only add participants to group conversations" },
      { status: 400 }
    );
  }

  // Verify current user is owner or admin
  const { data: myParticipation } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!myParticipation || (myParticipation.role !== "owner" && myParticipation.role !== "admin")) {
    return NextResponse.json(
      { success: false, msg: "Only group admins can add participants" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validation = addParticipantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { user_id: newUserId } = validation.data;

    // Verify new user exists
    const { data: newUser } = await supabase
      .from("users")
      .select("id, status")
      .eq("id", newUserId)
      .single();

    if (!newUser || newUser.status !== "active") {
      return NextResponse.json(
        { success: false, msg: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is blocked by or has blocked any participants
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const participantIds = participants?.map((p) => p.user_id) || [];

    const { data: blocks } = await supabase
      .from("blocks")
      .select("id")
      .or(
        participantIds
          .map(
            (id) =>
              `and(blocker_id.eq.${newUserId},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${newUserId})`
          )
          .join(",")
      );

    if (blocks && blocks.length > 0) {
      return NextResponse.json(
        { success: false, msg: "Cannot add user due to block restrictions" },
        { status: 403 }
      );
    }

    // Check if already a participant
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", newUserId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        msg: "User is already in this conversation",
      });
    }

    // Add participant
    const { error: addError } = await supabase
      .from("conversation_participants")
      .insert({
        conversation_id: conversationId,
        user_id: newUserId,
        role: "member",
      });

    if (addError) {
      console.error("Error adding participant:", addError);
      return NextResponse.json(
        { success: false, msg: "Error adding participant" },
        { status: 500 }
      );
    }

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json({
      success: true,
      msg: "Participant added successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/conversations/[id]/participants:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]/participants
 * Remove a participant from a group conversation
 * 
 * Query params:
 * - user_id: ID of user to remove
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
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

  const { searchParams } = new URL(request.url);
  const userIdToRemove = searchParams.get("user_id");

  if (!userIdToRemove) {
    return NextResponse.json(
      { success: false, msg: "User ID is required" },
      { status: 400 }
    );
  }

  // Verify conversation exists and is a group
  const { data: conversation } = await supabase
    .from("conversations")
    .select("type")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { success: false, msg: "Conversation not found" },
      { status: 404 }
    );
  }

  if (conversation.type !== "group") {
    return NextResponse.json(
      { success: false, msg: "Can only remove participants from group conversations" },
      { status: 400 }
    );
  }

  // Verify current user is owner or admin (or removing themselves)
  const { data: myParticipation } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!myParticipation) {
    return NextResponse.json(
      { success: false, msg: "You are not in this conversation" },
      { status: 403 }
    );
  }

  const isRemovingSelf = userIdToRemove === user.id;
  const isAdmin = myParticipation.role === "owner" || myParticipation.role === "admin";

  if (!isRemovingSelf && !isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Only group admins can remove other participants" },
      { status: 403 }
    );
  }

  // Check target user's participation
  const { data: targetParticipation } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userIdToRemove)
    .single();

  if (!targetParticipation) {
    return NextResponse.json(
      { success: false, msg: "User is not in this conversation" },
      { status: 404 }
    );
  }

  // Can't remove owner
  if (targetParticipation.role === "owner" && !isRemovingSelf) {
    return NextResponse.json(
      { success: false, msg: "Cannot remove the group owner" },
      { status: 403 }
    );
  }

  // Remove participant
  const { error: removeError } = await supabase
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userIdToRemove);

  if (removeError) {
    console.error("Error removing participant:", removeError);
    return NextResponse.json(
      { success: false, msg: "Error removing participant" },
      { status: 500 }
    );
  }

  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({
    success: true,
    msg: isRemovingSelf ? "You have left the group" : "Participant removed successfully",
  });
}
