import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/conversations/unread-count
 * 
 * Lightweight endpoint to get the count of conversations with unread messages.
 * This is used by the header messages indicator for quick polling.
 * 
 * Returns:
 * - count: number of conversations with at least 1 unread message
 */
export async function GET() {
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
    // Get all conversations where user is a participant with their last_read_at
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (partError) {
      console.error("Error fetching participations:", partError);
      return NextResponse.json(
        { success: false, msg: "Error fetching unread count" },
        { status: 500 }
      );
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
      });
    }

    // Count conversations that have unread messages
    let unreadConversationsCount = 0;

    // Use Promise.all for parallel queries - more efficient
    const unreadChecks = await Promise.all(
      participations.map(async (participation) => {
        const { conversation_id, last_read_at } = participation;
        
        if (!conversation_id) return false;

        // Build query for unread messages in this conversation
        let query = supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversation_id)
          .neq("sender_id", user.id);

        // If we have a last_read_at, only count messages after that time
        if (last_read_at) {
          query = query.gt("created_at", last_read_at);
        }

        const { count, error } = await query;

        if (error) {
          console.error(`Error checking unread for conv ${conversation_id}:`, error);
          return false;
        }

        return (count || 0) > 0;
      })
    );

    // Count how many conversations have unread messages
    unreadConversationsCount = unreadChecks.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      count: unreadConversationsCount,
    });
  } catch (error) {
    console.error("Error in GET /api/conversations/unread-count:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching unread count" },
      { status: 500 }
    );
  }
}
