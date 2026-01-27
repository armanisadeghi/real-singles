import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

// Verify the current user is an admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const supabase = await createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { isAdmin: false };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { 
    isAdmin: userData?.role === "admin" || userData?.role === "moderator",
    userId: user.id 
  };
}

/**
 * GET /api/admin/events/[id]
 * Get event details (admin only)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      users:created_by (
        id,
        display_name,
        email
      )
    `)
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Resolve image URL
  const resolvedImageUrl = event.image_url
    ? await resolveStorageUrl(supabase, event.image_url, { bucket: "events" })
    : null;

  // Get attendee counts
  const { count: registeredCount } = await supabase
    .from("event_attendees")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "registered");

  const { count: interestedCount } = await supabase
    .from("event_attendees")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "interested");

  return NextResponse.json({
    success: true,
    event: {
      ...event,
      image_url: resolvedImageUrl,
    },
    attendeeCounts: {
      registered: registeredCount || 0,
      interested: interestedCount || 0,
    },
  });
}

/**
 * PUT /api/admin/events/[id]
 * Update event (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createAdminClient();

  // Only allow updating specific fields
  const allowedFields = [
    "title", "description", "event_type", "image_url",
    "venue_name", "address", "city", "state", "latitude", "longitude",
    "start_datetime", "end_datetime", "timezone",
    "max_attendees", "is_public", "requires_approval", "status"
  ];

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedFields.includes(key)) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId);

  if (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, msg: "Event updated successfully" });
}

/**
 * DELETE /api/admin/events/[id]
 * Cancel/delete event (admin only)
 * Sets status to 'cancelled' (soft delete)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Soft delete - set status to cancelled
  const { error } = await supabase
    .from("events")
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", eventId);

  if (error) {
    console.error("Error cancelling event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, msg: "Event cancelled successfully" });
}
