import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  image_url: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  start_datetime: string;
  end_datetime: string | null;
  max_attendees: number | null;
  current_attendees: number | null;
  status: string | null;
}

/**
 * GET /api/public/events/[id]
 * Get public event details - NO AUTH REQUIRED
 * Returns sanitized data without attendee details or exact location
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createApiClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      event_type,
      image_url,
      venue_name,
      address,
      city,
      state,
      start_datetime,
      end_datetime,
      max_attendees,
      current_attendees,
      status
    `)
    .eq("id", eventId)
    .eq("is_public", true)
    .single();

  if (error || !event) {
    return NextResponse.json(
      { success: false, msg: "Event not found" },
      { status: 404 }
    );
  }

  const typedEvent = event as EventRow;

  // Only show published/upcoming events publicly
  if (typedEvent.status !== "upcoming" && typedEvent.status !== "ongoing") {
    return NextResponse.json(
      { success: false, msg: "Event not found" },
      { status: 404 }
    );
  }

  // Resolve event image URL
  const eventImageUrl = await resolveStorageUrl(supabase, typedEvent.image_url, { bucket: "events" });

  // Calculate if event is full
  const isFull = typedEvent.max_attendees 
    ? (typedEvent.current_attendees || 0) >= typedEvent.max_attendees
    : false;

  // Calculate spots remaining
  const spotsRemaining = typedEvent.max_attendees
    ? Math.max(0, typedEvent.max_attendees - (typedEvent.current_attendees || 0))
    : null;

  const formattedEvent = {
    id: typedEvent.id,
    title: typedEvent.title,
    description: typedEvent.description || "",
    event_type: typedEvent.event_type,
    image_url: eventImageUrl || "",
    venue_name: typedEvent.venue_name || "",
    // Show city/state but not exact address for public
    city: typedEvent.city || "",
    state: typedEvent.state || "",
    date: typedEvent.start_datetime?.split("T")[0] || "",
    start_time: typedEvent.start_datetime
      ? new Date(typedEvent.start_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "",
    end_time: typedEvent.end_datetime
      ? new Date(typedEvent.end_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "",
    start_datetime: typedEvent.start_datetime,
    end_datetime: typedEvent.end_datetime,
    max_attendees: typedEvent.max_attendees,
    attendee_count: typedEvent.current_attendees || 0,
    is_full: isFull,
    spots_remaining: spotsRemaining,
    // Explicitly NOT including: attendee list, attendee photos, exact address, lat/lng
  };

  return NextResponse.json({
    success: true,
    data: formattedEvent,
    msg: "Event details fetched successfully",
  });
}
