import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for updating a message
const updateMessageSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  deleted: z.boolean().optional(),
  deleted_for_everyone: z.boolean().optional(),
});

/**
 * GET /api/messages/[id]
 * Get a single message by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id } = await params;

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

  // Get the message - select only fields needed for display
  const { data: message, error } = await supabase
    .from("messages")
    .select(`
      id, conversation_id, sender_id, content, message_type,
      media_url, media_thumbnail_url, media_metadata,
      reply_to_id, client_message_id, status,
      created_at, edited_at, deleted_at, deleted_for_everyone
    `)
    .eq("id", id)
    .single();

  if (error || !message) {
    return NextResponse.json(
      { success: false, msg: "Message not found" },
      { status: 404 }
    );
  }

  // Verify user is a participant in the conversation
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", user.id)
    .single();

  if (!participation) {
    return NextResponse.json(
      { success: false, msg: "Not authorized to view this message" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: message,
    msg: "Message fetched successfully",
  });
}

/**
 * PATCH /api/messages/[id]
 * Update a message (edit or delete)
 *
 * Body:
 * - content: string (optional, for editing)
 * - deleted: boolean (optional, for soft delete)
 * - deleted_for_everyone: boolean (optional)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id } = await params;

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
    const validation = updateMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, deleted, deleted_for_everyone } = validation.data;

    // Get the message to verify ownership - only need sender_id
    const { data: existingMessage, error: fetchError } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json(
        { success: false, msg: "Message not found" },
        { status: 404 }
      );
    }

    // Only the sender can edit/delete their own messages
    if (existingMessage.sender_id !== user.id) {
      return NextResponse.json(
        { success: false, msg: "Not authorized to modify this message" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (content !== undefined) {
      updateData.content = content.trim();
      updateData.edited_at = new Date().toISOString();
    }

    if (deleted) {
      updateData.deleted_at = new Date().toISOString();
      updateData.deleted_for_everyone = deleted_for_everyone || false;

      if (deleted_for_everyone) {
        updateData.content = "[Message deleted]";
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, msg: "No updates provided" },
        { status: 400 }
      );
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from("messages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating message:", updateError);
      return NextResponse.json(
        { success: false, msg: "Error updating message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMessage,
      msg: deleted ? "Message deleted successfully" : "Message updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/messages/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/messages/[id]
 * Permanently delete a message (only for sender)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id } = await params;

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

  // Get the message to verify ownership
  const { data: existingMessage, error: fetchError } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingMessage) {
    return NextResponse.json(
      { success: false, msg: "Message not found" },
      { status: 404 }
    );
  }

  // Only the sender can delete their own messages
  if (existingMessage.sender_id !== user.id) {
    return NextResponse.json(
      { success: false, msg: "Not authorized to delete this message" },
      { status: 403 }
    );
  }

  // Soft delete the message
  const { error: deleteError } = await supabase
    .from("messages")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_for_everyone: true,
      content: "[Message deleted]",
    })
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting message:", deleteError);
    return NextResponse.json(
      { success: false, msg: "Error deleting message" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Message deleted successfully",
  });
}
