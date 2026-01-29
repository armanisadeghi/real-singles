import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { TypedSupabaseClient, DbEventInsert } from "@/types/db";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EventAttendeeRow {
  user_id: string | null;
  status: string | null;
}

interface EventWithRelations {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  image_url: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  start_datetime: string;
  end_datetime: string | null;
  max_attendees: number | null;
  current_attendees: number | null;
  created_by: string | null;
  created_at: string | null;
  status: string | null;
  event_attendees: EventAttendeeRow[] | null;
  users: { display_name: string | null } | null;
}

interface EventFormData {
  title: string | null;
  description: string | null;
  event_type: string;
  image_url: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  start_datetime: string | null;
  end_datetime: string | null;
  max_attendees: number | null;
}

// Verify the current user is an admin
async function verifyAdmin(supabase: TypedSupabaseClient, userId: string): Promise<boolean> {
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  return userData?.role === "admin" || userData?.role === "moderator";
}

// Get start of today in ISO format (for filtering events)
function getStartOfToday(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

/**
 * GET /api/events
 * Get list of events
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const status = searchParams.get("status") || "upcoming";
  const city = searchParams.get("city");

  let query = supabase
    .from("events")
    .select(`
      *,
      event_attendees(user_id, status),
      users:created_by(display_name)
    `)
    .eq("is_public", true);

  // Filter by status
  // Note: We filter primarily by date, not the status column.
  // The status column may not be kept up-to-date, so we use start_datetime as the source of truth.
  if (status === "upcoming") {
    // Show events that haven't started yet (today or future)
    // Exclude cancelled events, order by soonest first
    query = query
      .neq("status", "cancelled")
      .gte("start_datetime", getStartOfToday())
      .order("start_datetime", { ascending: true });
  } else if (status === "past") {
    // Show events that have already started (before today)
    // Exclude cancelled events, order by most recent first
    query = query
      .neq("status", "cancelled")
      .lt("start_datetime", getStartOfToday())
      .order("start_datetime", { ascending: false });
  } else {
    // Default ordering for any other status filter
    query = query.order("start_datetime", { ascending: true });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  // Filter by city
  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching events" },
      { status: 500 }
    );
  }

  // Format events for mobile app (with image URL resolution)
  const formattedEvents = await Promise.all(
    ((events || []) as EventWithRelations[]).map(async (event) => {
      const attendees = event.event_attendees || [];
      const interestedUsers = attendees.filter((a) => a.status === "interested" || a.status === "registered");
      const isUserInterested = user ? attendees.some((a) => a.user_id === user.id) : false;

      // Resolve storage URL for event image
      const eventImageUrl = await resolveStorageUrl(supabase, event.image_url, { bucket: "events" });

      return {
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
        City: event.city || "",
        State: event.state || "",
        PostalCode: "",
        EventImage: eventImageUrl || "",
        Link: "",
        Latitude: event.latitude?.toString() || "",
        Longitude: event.longitude?.toString() || "",
        UserID: event.created_by || "",
        CreateDate: event.created_at,
        interestedUserImage: interestedUsers.slice(0, 5).map(() => ""), // Placeholder
        HostedBy: event.users?.display_name || "RealSingles",
        HostedID: event.created_by || "",
        isMarkInterested: isUserInterested ? 1 : 0,
        MaxAttendees: event.max_attendees,
        CurrentAttendees: event.current_attendees || interestedUsers.length,
        EventType: event.event_type,
        Status: event.status,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formattedEvents,
    msg: "Events fetched successfully",
  });
}

/**
 * POST /api/events
 * Create a new event (Admin only)
 * Supports both cookie auth (web) and Bearer token auth (mobile)
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

  // Check if user is admin
  const isAdmin = await verifyAdmin(supabase, user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Only administrators can create events" },
      { status: 403 }
    );
  }

  try {
    let eventData: EventFormData;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const getStringValue = (key1: string, key2: string): string | null => {
        const value = formData.get(key1) || formData.get(key2);
        return value ? String(value) : null;
      };
      eventData = {
        title: getStringValue("EventName", "title"),
        description: getStringValue("Description", "description"),
        event_type: getStringValue("EventType", "event_type") || "in_person",
        image_url: getStringValue("EventImage", "image_url"),
        venue_name: getStringValue("VenueName", "venue_name"),
        address: getStringValue("Street", "address"),
        city: getStringValue("City", "city"),
        state: getStringValue("State", "state"),
        latitude: formData.get("Latitude") ? parseFloat(formData.get("Latitude") as string) : null,
        longitude: formData.get("Longitude") ? parseFloat(formData.get("Longitude") as string) : null,
        start_datetime: getStringValue("StartDateTime", "start_datetime"),
        end_datetime: getStringValue("EndDateTime", "end_datetime"),
        max_attendees: formData.get("MaxAttendees") ? parseInt(formData.get("MaxAttendees") as string) : null,
      };
    } else {
      const body = await request.json() as Record<string, unknown>;
      eventData = {
        title: (body.EventName || body.title || null) as string | null,
        description: (body.Description || body.description || null) as string | null,
        event_type: ((body.EventType || body.event_type || "in_person") as string),
        image_url: (body.EventImage || body.image_url || null) as string | null,
        venue_name: (body.VenueName || body.venue_name || null) as string | null,
        address: (body.Street || body.address || null) as string | null,
        city: (body.City || body.city || null) as string | null,
        state: (body.State || body.state || null) as string | null,
        latitude: body.Latitude ? parseFloat(body.Latitude as string) : null,
        longitude: body.Longitude ? parseFloat(body.Longitude as string) : null,
        start_datetime: (body.StartDateTime || body.start_datetime || null) as string | null,
        end_datetime: (body.EndDateTime || body.end_datetime || null) as string | null,
        max_attendees: body.MaxAttendees ? parseInt(body.MaxAttendees as string) : null,
      };
    }

    if (!eventData.title) {
      return NextResponse.json(
        { success: false, msg: "Event title is required" },
        { status: 400 }
      );
    }

    if (!eventData.start_datetime) {
      return NextResponse.json(
        { success: false, msg: "Event start date/time is required" },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title: eventData.title!,
        event_type: eventData.event_type || "in_person",
        start_datetime: eventData.start_datetime!,
        description: eventData.description || null,
        image_url: eventData.image_url || null,
        venue_name: eventData.venue_name || null,
        address: eventData.address || null,
        city: eventData.city || null,
        state: eventData.state || null,
        latitude: eventData.latitude || null,
        longitude: eventData.longitude || null,
        end_datetime: eventData.end_datetime || null,
        max_attendees: eventData.max_attendees || null,
        created_by: user.id,
        is_public: true,
        status: "upcoming",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return NextResponse.json(
        { success: false, msg: "Error creating event" },
        { status: 500 }
      );
    }

    // Auto-register creator as attendee
    await supabase.from("event_attendees").insert({
      event_id: event.id,
      user_id: user.id,
      status: "registered",
    });

    return NextResponse.json({
      success: true,
      data: { EventID: event.id },
      msg: "Event created successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/events:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
