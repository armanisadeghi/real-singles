import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { DbEventUpdate } from "@/types/db";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EventAttendeeRow {
  user_id: string | null;
  status: string | null;
  registered_at: string | null;
}

interface ProfileRow {
  user_id: string | null;
  first_name: string | null;
  profile_image_url: string | null;
}

interface UserRow {
  id: string;
  display_name: string | null;
}

interface AttendeeProfiles {
  profileMap: Record<string, ProfileRow>;
  userMap: Record<string, UserRow>;
}

/**
 * GET /api/events/[id]
 * Get event details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createApiClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      event_attendees(
        user_id,
        status,
        registered_at
      ),
      users:created_by(display_name)
    `)
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { success: false, msg: "Event not found", error: error.message },
      { status: 404 }
    );
  }

  if (!event) {
    return NextResponse.json(
      { success: false, msg: "Event not found" },
      { status: 404 }
    );
  }

  // Fetch attendee profiles separately to avoid complex nested joins
  const attendees = (event.event_attendees || []) as EventAttendeeRow[];
  const attendeeUserIds = attendees
    .map((a) => a.user_id)
    .filter((id): id is string => id !== null);
  
  let attendeeProfiles: AttendeeProfiles = { profileMap: {}, userMap: {} };
  
  if (attendeeUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, profile_image_url")
      .in("user_id", attendeeUserIds);
    
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", attendeeUserIds);
    
    // Create lookup maps
    const profileMap: Record<string, ProfileRow> = {};
    for (const p of profiles || []) {
      if (p.user_id) profileMap[p.user_id] = p as ProfileRow;
    }
    
    const userMap: Record<string, UserRow> = {};
    for (const u of users || []) {
      userMap[u.id] = u as UserRow;
    }
    
    attendeeProfiles = { profileMap, userMap };
  }

  const interestedUsers = attendees.filter((a) => a.status === "interested" || a.status === "registered");
  const isUserInterested = user ? attendees.some((a) => a.user_id === user.id) : false;

  // Resolve event image URL
  const eventImageUrl = await resolveStorageUrl(supabase, event.image_url, { bucket: "events" });

  // Resolve interested user images
  const interestedUserImages = await Promise.all(
    interestedUsers.slice(0, 10).map((a) => {
      const profile = a.user_id ? attendeeProfiles.profileMap[a.user_id] : null;
      return resolveStorageUrl(supabase, profile?.profile_image_url ?? null);
    })
  );

  // Resolve interested users with profile images
  const formattedInterestedUsers = await Promise.all(
    interestedUsers.map(async (a) => {
      const profile = a.user_id ? attendeeProfiles.profileMap[a.user_id] : null;
      const userData = a.user_id ? attendeeProfiles.userMap[a.user_id] : null;
      return {
        user_id: a.user_id,
        display_name: userData?.display_name || profile?.first_name || "User",
        profile_image_url: await resolveStorageUrl(supabase, profile?.profile_image_url ?? null),
        status: a.status,
      };
    })
  );

  const formattedEvent = {
    EventID: event.id,
    EventName: event.title,
    EventDate: event.start_datetime?.split("T")[0] || "",
    EventPrice: "0",
    StartTime: event.start_datetime
      ? new Date(event.start_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "",
    EndTime: event.end_datetime
      ? new Date(event.end_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "",
    Description: event.description || "",
    Street: event.address || "",
    VenueName: event.venue_name || "",
    City: event.city || "",
    State: event.state || "",
    PostalCode: "",
    EventImage: eventImageUrl,
    Link: "",
    Latitude: event.latitude?.toString() || "",
    Longitude: event.longitude?.toString() || "",
    UserID: event.created_by || "",
    CreateDate: event.created_at,
    interestedUserImage: interestedUserImages,
    interestedUsers: formattedInterestedUsers,
    HostedBy: event.users?.display_name || "RealSingles",
    HostedID: event.created_by || "",
    isMarkInterested: isUserInterested ? 1 : 0,
    MaxAttendees: event.max_attendees,
    CurrentAttendees: event.current_attendees || interestedUsers.length,
    EventType: event.event_type,
    Status: event.status,
  };

  return NextResponse.json({
    success: true,
    data: formattedEvent,
    msg: "Event fetched successfully",
  });
}

/**
 * PUT /api/events/[id]
 * Update event (creator only)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
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

  // Check if user owns the event
  const { data: event } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .single();

  if (!event || event.created_by !== user.id) {
    return NextResponse.json(
      { success: false, msg: "Not authorized to update this event" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const updates: DbEventUpdate = {};

    // Map input fields to database fields
    if (body.EventName !== undefined || body.title !== undefined) {
      updates.title = (body.EventName ?? body.title) as string;
    }
    if (body.Description !== undefined || body.description !== undefined) {
      updates.description = (body.Description ?? body.description) as string | null;
    }
    if (body.EventImage !== undefined || body.image_url !== undefined) {
      updates.image_url = (body.EventImage ?? body.image_url) as string | null;
    }
    if (body.VenueName !== undefined || body.venue_name !== undefined) {
      updates.venue_name = (body.VenueName ?? body.venue_name) as string | null;
    }
    if (body.Street !== undefined || body.address !== undefined) {
      updates.address = (body.Street ?? body.address) as string | null;
    }
    if (body.City !== undefined || body.city !== undefined) {
      updates.city = (body.City ?? body.city) as string | null;
    }
    if (body.State !== undefined || body.state !== undefined) {
      updates.state = (body.State ?? body.state) as string | null;
    }
    if (body.StartDateTime !== undefined || body.start_datetime !== undefined) {
      updates.start_datetime = (body.StartDateTime ?? body.start_datetime) as string;
    }
    if (body.EndDateTime !== undefined || body.end_datetime !== undefined) {
      updates.end_datetime = (body.EndDateTime ?? body.end_datetime) as string | null;
    }
    if (body.MaxAttendees !== undefined || body.max_attendees !== undefined) {
      updates.max_attendees = (body.MaxAttendees ?? body.max_attendees) as number | null;
    }
    if (body.Status !== undefined || body.status !== undefined) {
      updates.status = (body.Status ?? body.status) as string | null;
    }
    if (body.Latitude) {
      updates.latitude = parseFloat(body.Latitude as string);
    }
    if (body.Longitude) {
      updates.longitude = parseFloat(body.Longitude as string);
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId);

    if (error) {
      console.error("Error updating event:", error);
      return NextResponse.json(
        { success: false, msg: "Error updating event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/events/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Delete event (creator only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
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

  // Check if user owns the event
  const { data: event } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .single();

  if (!event || event.created_by !== user.id) {
    return NextResponse.json(
      { success: false, msg: "Not authorized to delete this event" },
      { status: 403 }
    );
  }

  // Set status to cancelled instead of hard delete
  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { success: false, msg: "Error deleting event" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Event cancelled successfully",
  });
}
