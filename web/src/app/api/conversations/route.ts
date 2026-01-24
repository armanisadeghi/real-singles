import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for creating a conversation
const createConversationSchema = z.object({
  type: z.enum(["direct", "group"]).default("direct"),
  participant_ids: z.array(z.string().uuid()).min(1, "At least one participant required"),
  group_name: z.string().optional(),
});

/**
 * GET /api/conversations
 * Get all conversations for the current user
 * 
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 */
export async function GET(request: NextRequest) {
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
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Get conversation IDs where user is a participant
  const { data: participations, error: partError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (partError) {
    console.error("Error fetching participations:", partError);
    return NextResponse.json(
      { success: false, msg: "Error fetching conversations" },
      { status: 500 }
    );
  }

  if (!participations || participations.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      msg: "No conversations found",
    });
  }

  const conversationIds = participations.map((p) => p.conversation_id).filter((id): id is string => id !== null);

  // Get conversations with participant info
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select(`
      id,
      type,
      group_name,
      group_image_url,
      created_by,
      agora_group_id,
      created_at,
      updated_at,
      conversation_participants(
        user_id,
        role,
        last_read_at,
        is_muted
      )
    `)
    .in("id", conversationIds)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (convError) {
    console.error("Error fetching conversations:", convError);
    return NextResponse.json(
      { success: false, msg: "Error fetching conversations" },
      { status: 500 }
    );
  }

  // Get all participant user IDs
  const allParticipantIds = new Set<string>();
  conversations?.forEach((conv) => {
    conv.conversation_participants?.forEach((p) => {
      if (p.user_id && p.user_id !== user.id) {
        allParticipantIds.add(p.user_id);
      }
    });
  });

  // Get profiles for all participants
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, profile_image_url")
    .in("user_id", Array.from(allParticipantIds));

  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, last_active_at")
    .in("id", Array.from(allParticipantIds));

  // Format conversations
  const formattedConversations = (conversations || []).map((conv) => {
    const participants = conv.conversation_participants || [];
    const otherParticipants = participants.filter(
      (p) => p.user_id && p.user_id !== user.id
    );
    const myParticipation = participants.find(
      (p) => p.user_id === user.id
    );

    // Get other user info for direct chats
    const otherUserIds = otherParticipants.map((p) => p.user_id).filter((id): id is string => id !== null);
    const otherProfiles = profiles?.filter((p) => p.user_id && otherUserIds.includes(p.user_id)) || [];
    const otherUsers = users?.filter((u) => otherUserIds.includes(u.id)) || [];

    // Determine display name and image
    let displayName = conv.group_name;
    let displayImage = conv.group_image_url;

    if (conv.type === "direct" && otherProfiles.length > 0) {
      const otherProfile = otherProfiles[0];
      const otherUser = otherUsers.find((u) => u.id === otherProfile?.user_id);
      displayName = otherUser?.display_name || 
        `${otherProfile?.first_name || ""} ${otherProfile?.last_name || ""}`.trim() || 
        "User";
      displayImage = otherProfile?.profile_image_url;
    }

    return {
      ConversationID: conv.id,
      Type: conv.type,
      DisplayName: displayName,
      DisplayImage: displayImage || "",
      GroupName: conv.group_name,
      GroupImage: conv.group_image_url,
      AgoraGroupID: conv.agora_group_id,
      CreatedAt: conv.created_at,
      UpdatedAt: conv.updated_at,
      IsMuted: myParticipation?.is_muted || false,
      LastReadAt: myParticipation?.last_read_at,
      Participants: otherParticipants
        .filter((p) => p.user_id !== null)
        .map((p) => {
          const profile = profiles?.find((pr) => pr.user_id === p.user_id);
          const userData = users?.find((u) => u.id === p.user_id);
          return {
            UserID: p.user_id!,
            DisplayName: userData?.display_name || profile?.first_name || "User",
            FirstName: profile?.first_name || "",
            LastName: profile?.last_name || "",
            ProfileImage: profile?.profile_image_url || "",
            LastActiveAt: userData?.last_active_at,
            Role: p.role || "member",
          };
        }),
    };
  });

  return NextResponse.json({
    success: true,
    data: formattedConversations,
    total: conversationIds.length,
    msg: "Conversations fetched successfully",
  });
}

/**
 * POST /api/conversations
 * Create a new conversation or return existing one for direct chat
 * 
 * Body:
 * - type: "direct" | "group"
 * - participant_ids: array of user IDs
 * - group_name: (optional) name for group chats
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
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { type, participant_ids, group_name } = validation.data;

    // Can't create conversation with yourself only
    if (participant_ids.length === 1 && participant_ids[0] === user.id) {
      return NextResponse.json(
        { success: false, msg: "Cannot create conversation with only yourself" },
        { status: 400 }
      );
    }

    // Remove current user from participant_ids if included
    const otherParticipants = participant_ids.filter((id) => id !== user.id);

    if (otherParticipants.length === 0) {
      return NextResponse.json(
        { success: false, msg: "At least one other participant required" },
        { status: 400 }
      );
    }

    // Verify all participants exist
    const { data: validUsers } = await supabase
      .from("users")
      .select("id")
      .in("id", otherParticipants)
      .eq("status", "active");

    if (!validUsers || validUsers.length !== otherParticipants.length) {
      return NextResponse.json(
        { success: false, msg: "One or more participants not found" },
        { status: 400 }
      );
    }

    // Check for blocks
    const { data: blocks } = await supabase
      .from("blocks")
      .select("id")
      .or(
        otherParticipants
          .map(
            (id) =>
              `and(blocker_id.eq.${user.id},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${user.id})`
          )
          .join(",")
      );

    if (blocks && blocks.length > 0) {
      return NextResponse.json(
        { success: false, msg: "Cannot create conversation with blocked users" },
        { status: 403 }
      );
    }

    // For direct chats, check if conversation already exists
    if (type === "direct" && otherParticipants.length === 1) {
      const otherUserId = otherParticipants[0];

      // Get all direct conversations for current user
      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvos && myConvos.length > 0) {
        const myConvoIds = myConvos.map((c) => c.conversation_id);

        // Check if other user is in any of these conversations
        const { data: sharedConvo } = await supabase
          .from("conversation_participants")
          .select(`
            conversation_id,
            conversations!inner(id, type)
          `)
          .eq("user_id", otherUserId)
          .in("conversation_id", myConvoIds)
          .eq("conversations.type", "direct")
          .limit(1)
          .maybeSingle();

        if (sharedConvo) {
          // Return existing conversation
          return NextResponse.json({
            success: true,
            data: { ConversationID: sharedConvo.conversation_id },
            existing: true,
            msg: "Existing conversation found",
          });
        }
      }
    }

    // Create new conversation
    const { data: newConvo, error: createError } = await supabase
      .from("conversations")
      .insert({
        type,
        group_name: type === "group" ? group_name : null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (createError || !newConvo) {
      console.error("Error creating conversation:", createError);
      return NextResponse.json(
        { success: false, msg: "Error creating conversation" },
        { status: 500 }
      );
    }

    // Add all participants including current user
    const allParticipants = [user.id, ...otherParticipants];
    const participantRecords = allParticipants.map((userId, index) => ({
      conversation_id: newConvo.id,
      user_id: userId,
      role: userId === user.id ? "owner" : "member",
    }));

    const { error: participantError } = await supabase
      .from("conversation_participants")
      .insert(participantRecords);

    if (participantError) {
      console.error("Error adding participants:", participantError);
      // Rollback conversation creation
      await supabase.from("conversations").delete().eq("id", newConvo.id);
      return NextResponse.json(
        { success: false, msg: "Error adding participants" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ConversationID: newConvo.id },
      existing: false,
      msg: "Conversation created successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/conversations:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
