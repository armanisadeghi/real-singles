import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/conversations/[id]
 * Get conversation details including participants
 */
export async function GET(
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

  // Verify user is a participant
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("role, last_read_at, is_muted")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participation) {
    return NextResponse.json(
      { success: false, msg: "Conversation not found or you're not a participant" },
      { status: 404 }
    );
  }

  // Get conversation details
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select(`
      id,
      type,
      group_name,
      group_image_url,
      created_by,
      created_at,
      updated_at,
      conversation_participants(
        user_id,
        role,
        joined_at,
        last_read_at,
        is_muted
      )
    `)
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    console.error("Error fetching conversation:", convError);
    return NextResponse.json(
      { success: false, msg: "Error fetching conversation" },
      { status: 500 }
    );
  }

  // Get participant profiles
  const participantIds = conversation.conversation_participants
    .map((p) => p.user_id)
    .filter((id): id is string => id !== null);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, profile_image_url, is_verified")
    .in("user_id", participantIds);

  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, last_active_at")
    .in("id", participantIds);

  // Format participants with resolved profile image URLs
  const formattedParticipants = await Promise.all(
    conversation.conversation_participants
      .filter((p) => p.user_id !== null)
      .map(async (p) => {
        const user_id = p.user_id!; // Already filtered nulls above
        const profile = profiles?.find((pr) => pr.user_id === user_id);
        const userData = users?.find((u) => u.id === user_id);
        const isMe = user_id === user.id;
        const profileImageUrl = await resolveStorageUrl(supabase, profile?.profile_image_url);

        return {
          UserID: user_id,
          IsMe: isMe,
          DisplayName: userData?.display_name || profile?.first_name || "User",
          FirstName: profile?.first_name || "",
          ProfileImage: profileImageUrl,
          IsVerified: profile?.is_verified || false,
          LastActiveAt: userData?.last_active_at,
          Role: p.role || "",
          JoinedAt: p.joined_at || "",
          LastReadAt: p.last_read_at,
          IsMuted: p.is_muted || false,
        };
      })
  );

  // Determine display info for direct chats
  const otherParticipants = formattedParticipants.filter((p: { IsMe: boolean }) => !p.IsMe);
  let displayName = conversation.group_name;
  let displayImage = await resolveStorageUrl(supabase, conversation.group_image_url);

  if (conversation.type === "direct" && otherParticipants.length > 0) {
    displayName = otherParticipants[0].DisplayName;
    displayImage = otherParticipants[0].ProfileImage;
  }

  // Update last_read_at for current user
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  return NextResponse.json({
    success: true,
    data: {
      ConversationID: conversation.id,
      Type: conversation.type,
      DisplayName: displayName,
      DisplayImage: displayImage || "",
      GroupName: conversation.group_name,
      GroupImage: conversation.group_image_url,
      CreatedBy: conversation.created_by,
      CreatedAt: conversation.created_at,
      UpdatedAt: conversation.updated_at,
      MyRole: participation.role,
      IsMuted: participation.is_muted,
      Participants: formattedParticipants,
    },
    msg: "Conversation fetched successfully",
  });
}

/**
 * PUT /api/conversations/[id]
 * Update conversation settings (mute/unmute, group name for admins)
 */
export async function PUT(
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

  // Verify user is a participant
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participation) {
    return NextResponse.json(
      { success: false, msg: "Conversation not found" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { is_muted, group_name, group_image_url } = body;

    // Update mute status for current user
    if (typeof is_muted === "boolean") {
      await supabase
        .from("conversation_participants")
        .update({ is_muted })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
    }

    // Update group settings (only owner/admin can do this)
    if (group_name !== undefined || group_image_url !== undefined) {
      if (participation.role !== "owner" && participation.role !== "admin") {
        return NextResponse.json(
          { success: false, msg: "Only group admins can update group settings" },
          { status: 403 }
        );
      }

      const updateData: Record<string, string | null> = {};
      if (group_name !== undefined) updateData.group_name = group_name;
      if (group_image_url !== undefined) updateData.group_image_url = group_image_url;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("conversations")
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
    }

    return NextResponse.json({
      success: true,
      msg: "Conversation updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/conversations/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Leave a conversation (or delete if owner of group)
 */
export async function DELETE(
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

  // Get conversation and user's participation
  const { data: conversation } = await supabase
    .from("conversations")
    .select("type, created_by")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { success: false, msg: "Conversation not found" },
      { status: 404 }
    );
  }

  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participation) {
    return NextResponse.json(
      { success: false, msg: "You are not in this conversation" },
      { status: 404 }
    );
  }

  // For direct chats, just remove the participant (they can't see it anymore)
  // For groups, remove participant or delete entire group if owner
  if (conversation.type === "direct") {
    // Remove from participants
    await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      msg: "Left conversation successfully",
    });
  }

  // Group chat
  if (participation.role === "owner") {
    // Delete entire conversation (cascade will delete participants)
    await supabase.from("conversations").delete().eq("id", conversationId);

    return NextResponse.json({
      success: true,
      msg: "Group deleted successfully",
    });
  } else {
    // Just leave the group
    await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      msg: "Left group successfully",
    });
  }
}
