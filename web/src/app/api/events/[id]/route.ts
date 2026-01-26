import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

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
  const attendeeUserIds = (event.event_attendees || []).map((a: any) => a.user_id);
  let attendeeProfiles: Record<string, any> = {};
  
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
    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.user_id] = p;
      return acc;
    }, {});
    
    const userMap = (users || []).reduce((acc: any, u: any) => {
      acc[u.id] = u;
      return acc;
    }, {});
    
    attendeeProfiles = { profileMap, userMap };
  }

  const attendees = event.event_attendees || [];
  const interestedUsers = attendees.filter((a: any) => a.status === "interested" || a.status === "registered");
  const isUserInterested = user ? attendees.some((a: any) => a.user_id === user.id) : false;

  // Resolve event image URL
  const eventImageUrl = await resolveStorageUrl(supabase, event.image_url);

  // Resolve interested user images
  const interestedUserImages = await Promise.all(
    interestedUsers.slice(0, 10).map((a: any) => {
      const profile = attendeeProfiles.profileMap?.[a.user_id];
      return resolveStorageUrl(supabase, profile?.profile_image_url);
    })
  );

  // Resolve interested users with profile images
  const formattedInterestedUsers = await Promise.all(
    interestedUsers.map(async (a: any) => {
      const profile = attendeeProfiles.profileMap?.[a.user_id];
      const userData = attendeeProfiles.userMap?.[a.user_id];
      return {
        user_id: a.user_id,
        display_name: userData?.display_name || profile?.first_name || "User",
        profile_image_url: await resolveStorageUrl(supabase, profile?.profile_image_url),
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
    const body = await request.json();
    const updates: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      EventName: "title",
      title: "title",
      Description: "description",
      description: "description",
      EventImage: "image_url",
      image_url: "image_url",
      VenueName: "venue_name",
      venue_name: "venue_name",
      Street: "address",
      address: "address",
      City: "city",
      city: "city",
      State: "state",
      state: "state",
      StartDateTime: "start_datetime",
      start_datetime: "start_datetime",
      EndDateTime: "end_datetime",
      end_datetime: "end_datetime",
      MaxAttendees: "max_attendees",
      max_attendees: "max_attendees",
      Status: "status",
      status: "status",
    };

    for (const [inputField, dbField] of Object.entries(fieldMap)) {
      if (body[inputField] !== undefined) {
        updates[dbField] = body[inputField];
      }
    }

    if (body.Latitude) updates.latitude = parseFloat(body.Latitude);
    if (body.Longitude) updates.longitude = parseFloat(body.Longitude);

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
