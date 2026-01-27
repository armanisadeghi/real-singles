import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { DbEventAttendee } from "@/types/db";

// Type for attendee with JOIN data
interface AttendeeWithDetails extends DbEventAttendee {
  users: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  } | null;
}

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
 * GET /api/admin/events/[id]/attendees
 * Get list of attendees for an event (admin only)
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

  // Fetch event to verify it exists
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Fetch attendees with user details
  const { data: attendees, error: attendeesError } = await supabase
    .from("event_attendees")
    .select(`
      id,
      status,
      registered_at,
      user_id,
      users:user_id (
        id,
        email,
        display_name
      ),
      profiles:user_id (
        first_name,
        last_name,
        profile_image_url
      )
    `)
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  if (attendeesError) {
    console.error("Error fetching attendees:", attendeesError);
    return NextResponse.json({ error: "Error fetching attendees" }, { status: 500 });
  }

  // Format and resolve profile image URLs
  const typedAttendees = (attendees || []) as AttendeeWithDetails[];
  const formattedAttendees = await Promise.all(
    typedAttendees.map(async (attendee) => {
      const profileImageUrl = attendee.profiles?.profile_image_url
        ? await resolveStorageUrl(supabase, attendee.profiles.profile_image_url)
        : null;

      return {
        id: attendee.id,
        userId: attendee.user_id,
        email: attendee.users?.email || "",
        displayName: attendee.users?.display_name || 
          `${attendee.profiles?.first_name || ""} ${attendee.profiles?.last_name || ""}`.trim() ||
          "Unknown User",
        firstName: attendee.profiles?.first_name || "",
        lastName: attendee.profiles?.last_name || "",
        profileImageUrl,
        status: attendee.status,
        registeredAt: attendee.registered_at,
      };
    })
  );

  // Group by status
  const registered = formattedAttendees.filter(a => a.status === "registered");
  const interested = formattedAttendees.filter(a => a.status === "interested");
  const cancelled = formattedAttendees.filter(a => a.status === "cancelled");

  return NextResponse.json({
    success: true,
    eventId,
    eventTitle: event.title,
    attendees: formattedAttendees,
    summary: {
      total: formattedAttendees.length,
      registered: registered.length,
      interested: interested.length,
      cancelled: cancelled.length,
    },
  });
}

/**
 * DELETE /api/admin/events/[id]/attendees
 * Remove an attendee from an event (admin only)
 * Body: { userId: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Delete the attendee record
  const { error } = await supabase
    .from("event_attendees")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing attendee:", error);
    return NextResponse.json({ error: "Error removing attendee" }, { status: 500 });
  }

  // Update attendee count
  const { data: event } = await supabase
    .from("events")
    .select("current_attendees")
    .eq("id", eventId)
    .single();

  if (event && event.current_attendees !== null && event.current_attendees > 0) {
    await supabase
      .from("events")
      .update({ current_attendees: event.current_attendees - 1 })
      .eq("id", eventId);
  }

  return NextResponse.json({
    success: true,
    msg: "Attendee removed successfully",
  });
}
