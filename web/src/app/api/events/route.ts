import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/events
 * Get list of events
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

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
    .eq("is_public", true)
    .order("start_datetime", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filter by status
  if (status === "upcoming") {
    query = query
      .in("status", ["upcoming", "ongoing"])
      .gte("start_datetime", new Date().toISOString());
  } else if (status === "past") {
    query = query
      .eq("status", "completed")
      .lt("start_datetime", new Date().toISOString());
  }

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

  // Format events for mobile app
  const formattedEvents = (events || []).map((event: any) => {
    const attendees = event.event_attendees || [];
    const interestedUsers = attendees.filter((a: any) => a.status === "interested" || a.status === "registered");
    const isUserInterested = user ? attendees.some((a: any) => a.user_id === user.id) : false;

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
      EventImage: event.image_url || "",
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
  });

  return NextResponse.json({
    success: true,
    data: formattedEvents,
    msg: "Events fetched successfully",
  });
}

/**
 * POST /api/events
 * Create a new event
 */
export async function POST(request: Request) {
  const supabase = await createClient();

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
    let eventData: Record<string, any> = {};

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      eventData = {
        title: formData.get("EventName") || formData.get("title"),
        description: formData.get("Description") || formData.get("description"),
        event_type: formData.get("EventType") || formData.get("event_type") || "in_person",
        image_url: formData.get("EventImage") || formData.get("image_url"),
        venue_name: formData.get("VenueName") || formData.get("venue_name"),
        address: formData.get("Street") || formData.get("address"),
        city: formData.get("City") || formData.get("city"),
        state: formData.get("State") || formData.get("state"),
        latitude: formData.get("Latitude") ? parseFloat(formData.get("Latitude") as string) : null,
        longitude: formData.get("Longitude") ? parseFloat(formData.get("Longitude") as string) : null,
        start_datetime: formData.get("StartDateTime") || formData.get("start_datetime"),
        end_datetime: formData.get("EndDateTime") || formData.get("end_datetime"),
        max_attendees: formData.get("MaxAttendees") ? parseInt(formData.get("MaxAttendees") as string) : null,
      };
    } else {
      const body = await request.json();
      eventData = {
        title: body.EventName || body.title,
        description: body.Description || body.description,
        event_type: body.EventType || body.event_type || "in_person",
        image_url: body.EventImage || body.image_url,
        venue_name: body.VenueName || body.venue_name,
        address: body.Street || body.address,
        city: body.City || body.city,
        state: body.State || body.state,
        latitude: body.Latitude ? parseFloat(body.Latitude) : null,
        longitude: body.Longitude ? parseFloat(body.Longitude) : null,
        start_datetime: body.StartDateTime || body.start_datetime,
        end_datetime: body.EndDateTime || body.end_datetime,
        max_attendees: body.MaxAttendees ? parseInt(body.MaxAttendees) : null,
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
        ...eventData,
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
