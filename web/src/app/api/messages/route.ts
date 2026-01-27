import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for sending a message
const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1, "Message content required").max(10000),
  message_type: z.enum(["text", "image", "video", "audio", "file", "system"]).default("text"),
  media_url: z.string().url().optional(),
  media_thumbnail_url: z.string().url().optional(),
  media_metadata: z.record(z.unknown()).optional(),
  reply_to_id: z.string().uuid().optional(),
  client_message_id: z.string().optional(),
});

/**
 * GET /api/messages
 * Get messages for a conversation
 *
 * Query params:
 * - conversation_id: UUID (required)
 * - limit: number (default 50, max 100)
 * - before: ISO timestamp for pagination (optional)
 * - after: ISO timestamp for pagination (optional)
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
  const conversationId = searchParams.get("conversation_id");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const before = searchParams.get("before");
  const after = searchParams.get("after");

  if (!conversationId) {
    return NextResponse.json(
      { success: false, msg: "conversation_id is required" },
      { status: 400 }
    );
  }

  // Verify user is a participant in this conversation
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participation) {
    return NextResponse.json(
      { success: false, msg: "Not a participant in this conversation" },
      { status: 403 }
    );
  }

  // Build query
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  if (after) {
    query = query.gt("created_at", after);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching messages" },
      { status: 500 }
    );
  }

  // Return in chronological order
  const sortedMessages = (messages || []).reverse();

  return NextResponse.json({
    success: true,
    data: sortedMessages,
    msg: "Messages fetched successfully",
  });
}

/**
 * POST /api/messages
 * Send a new message
 *
 * Body:
 * - conversation_id: UUID
 * - content: string
 * - message_type: "text" | "image" | "video" | "audio" | "file" | "system" (default: "text")
 * - media_url: string (optional)
 * - media_thumbnail_url: string (optional)
 * - media_metadata: object (optional)
 * - reply_to_id: UUID (optional)
 * - client_message_id: string (optional, for deduplication)
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
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      conversation_id,
      content,
      message_type,
      media_url,
      media_thumbnail_url,
      media_metadata,
      reply_to_id,
      client_message_id,
    } = validation.data;

    // Verify user is a participant in this conversation
    const { data: participation } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("user_id", user.id)
      .single();

    if (!participation) {
      return NextResponse.json(
        { success: false, msg: "Not a participant in this conversation" },
        { status: 403 }
      );
    }

    // Check for blocks
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversation_id)
      .neq("user_id", user.id);

    if (participants && participants.length > 0) {
      const otherUserIds = participants.map((p) => p.user_id).filter(Boolean);

      const { data: blocks } = await supabase
        .from("blocks")
        .select("id")
        .or(
          otherUserIds
            .map(
              (id) =>
                `and(blocker_id.eq.${user.id},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${user.id})`
            )
            .join(",")
        );

      if (blocks && blocks.length > 0) {
        return NextResponse.json(
          { success: false, msg: "Cannot send message to blocked users" },
          { status: 403 }
        );
      }
    }

    // Check for duplicate message (by client_message_id)
    if (client_message_id) {
      const { data: existingMessage } = await supabase
        .from("messages")
        .select("id")
        .eq("client_message_id", client_message_id)
        .single();

      if (existingMessage) {
        // Return existing message instead of creating duplicate
        const { data: message } = await supabase
          .from("messages")
          .select("*")
          .eq("id", existingMessage.id)
          .single();

        return NextResponse.json({
          success: true,
          data: message,
          duplicate: true,
          msg: "Message already exists",
        });
      }
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content.trim(),
        message_type,
        media_url,
        media_thumbnail_url,
        media_metadata,
        reply_to_id,
        client_message_id,
        status: "sent",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error sending message:", insertError);
      return NextResponse.json(
        { success: false, msg: "Error sending message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
      msg: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/messages:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
