import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
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
    .select("user_id, first_name, profile_image_url")
    .in("user_id", Array.from(allParticipantIds));

  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, last_active_at")
    .in("id", Array.from(allParticipantIds));

  // ============================================================================
  // BATCH FETCH: Get last messages and unread counts for ALL conversations at once
  // This replaces N+1 queries (2 queries per conversation) with just 2 total queries
  // ============================================================================

  // Get last messages for all conversations in one query
  // We fetch recent messages and deduplicate in JS (more efficient than N queries)
  const { data: allMessages } = await supabase
    .from("messages")
    .select("conversation_id, content, message_type, created_at, sender_id")
    .in("conversation_id", conversationIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Build a map of conversation_id -> last message
  const lastMessageMap = new Map<string, typeof allMessages extends (infer T)[] | null ? T : never>();
  if (allMessages) {
    for (const msg of allMessages) {
      if (msg.conversation_id && !lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    }
  }

  // Build participation map for quick lookup of last_read_at
  const participationMap = new Map<string, { last_read_at: string | null; is_muted: boolean }>();
  conversations?.forEach((conv) => {
    const myPart = conv.conversation_participants?.find((p) => p.user_id === user.id);
    if (myPart) {
      participationMap.set(conv.id, {
        last_read_at: myPart.last_read_at,
        is_muted: myPart.is_muted || false,
      });
    }
  });

  // Calculate unread counts from the messages we already fetched
  // Group messages by conversation and count those after last_read_at from other users
  const unreadCountMap = new Map<string, number>();
  if (allMessages) {
    for (const msg of allMessages) {
      if (!msg.conversation_id || msg.sender_id === user.id) continue;
      
      const participation = participationMap.get(msg.conversation_id);
      const lastReadAt = participation?.last_read_at;
      
      // Count as unread if message is from another user and after last_read_at (or no last_read_at)
      const isUnread = !lastReadAt || new Date(msg.created_at!) > new Date(lastReadAt);
      
      if (isUnread) {
        unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1);
      }
    }
  }

  // Pre-resolve all profile image URLs in parallel
  const profileImageUrls = new Map<string, string>();
  const imageUrlPromises: Promise<void>[] = [];
  
  profiles?.forEach((profile) => {
    if (profile.user_id && profile.profile_image_url) {
      imageUrlPromises.push(
        resolveStorageUrl(supabase, profile.profile_image_url).then((url) => {
          profileImageUrls.set(profile.user_id!, url);
        })
      );
    }
  });
  await Promise.all(imageUrlPromises);

  // Helper function to format message preview
  const formatMessagePreview = (msg: { message_type: string | null; content: string | null } | null): string | null => {
    if (!msg) return null;
    if (msg.message_type === "text" && msg.content) {
      return msg.content.length > 50 ? msg.content.substring(0, 50) + "..." : msg.content;
    } else if (msg.message_type === "image") {
      return "📷 Photo";
    } else if (msg.message_type === "video") {
      return "🎥 Video";
    } else if (msg.message_type === "audio") {
      return "🎵 Audio";
    } else if (msg.message_type === "file") {
      return "📎 File";
    }
    return null;
  };

  // Format conversations - now synchronous since we pre-fetched everything
  const formattedConversations = await Promise.all(
    (conversations || []).map(async (conv) => {
      const participants = conv.conversation_participants || [];
      const otherParticipants = participants.filter(
        (p) => p.user_id && p.user_id !== user.id
      );
      const myParticipation = participationMap.get(conv.id);

      // Get other user info for direct chats
      const otherUserIds = otherParticipants.map((p) => p.user_id).filter((id): id is string => id !== null);
      const otherProfiles = profiles?.filter((p) => p.user_id && otherUserIds.includes(p.user_id)) || [];
      const otherUsers = users?.filter((u) => otherUserIds.includes(u.id)) || [];

      // Determine display name and image
      let displayName = conv.group_name;
      let displayImage = conv.group_image_url ? await resolveStorageUrl(supabase, conv.group_image_url) : "";

      if (conv.type === "direct" && otherProfiles.length > 0) {
        const otherProfile = otherProfiles[0];
        const otherUser = otherUsers.find((u) => u.id === otherProfile?.user_id);
        displayName = otherUser?.display_name || otherProfile?.first_name || "User";
        displayImage = profileImageUrls.get(otherProfile?.user_id || "") || "";
      }

      // Get last message from pre-fetched map
      const lastMessage = lastMessageMap.get(conv.id) || null;
      const lastMessagePreview = formatMessagePreview(lastMessage);

      // Get unread count from pre-calculated map
      const unreadCount = unreadCountMap.get(conv.id) || 0;

      // Format participants using pre-resolved image URLs
      const formattedParticipants = otherParticipants
        .filter((p) => p.user_id !== null)
        .map((p) => {
          const profile = profiles?.find((pr) => pr.user_id === p.user_id);
          const userData = users?.find((u) => u.id === p.user_id);
          const profileImage = profileImageUrls.get(p.user_id!) || "";
          return {
            UserID: p.user_id!,
            DisplayName: userData?.display_name || profile?.first_name || "User",
            FirstName: profile?.first_name || "",
            ProfileImage: profileImage,
            LastActiveAt: userData?.last_active_at,
            Role: p.role || "member",
          };
        });

      return {
        ConversationID: conv.id,
        Type: conv.type,
        DisplayName: displayName,
        DisplayImage: displayImage,
        GroupName: conv.group_name,
        GroupImage: conv.group_image_url ? await resolveStorageUrl(supabase, conv.group_image_url) : "",
        CreatedAt: conv.created_at,
        UpdatedAt: conv.updated_at,
        IsMuted: myParticipation?.is_muted || false,
        LastReadAt: myParticipation?.last_read_at,
        Participants: formattedParticipants,
        // New fields for messages page
        LastMessage: lastMessagePreview,
        LastMessageAt: lastMessage?.created_at || conv.updated_at,
        UnreadCount: unreadCount,
      };
    })
  );

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
