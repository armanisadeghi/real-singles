import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/notifications
 * Get user's notifications
 * Supports both cookie auth (web) and Bearer token auth (mobile)
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
  const unreadOnly = searchParams.get("unread") === "true";

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching notifications" },
      { status: 500 }
    );
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  // Format notifications for mobile app
  const formattedNotifications = (notifications || []).map((n) => ({
    ID: n.id,
    Type: n.type,
    Title: n.title,
    Body: n.body,
    Data: n.data,
    IsRead: n.is_read,
    ReadAt: n.read_at,
    CreatedAt: n.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: formattedNotifications,
    unread_count: unreadCount || 0,
    msg: "Notifications fetched successfully",
  });
}

/**
 * PUT /api/notifications
 * Mark all notifications as read
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function PUT() {
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

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { success: false, msg: "Error updating notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "All notifications marked as read",
  });
}
