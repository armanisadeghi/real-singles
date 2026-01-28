import { NextRequest, NextResponse } from "next/server";
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
  city: string | null;
  state: string | null;
  start_datetime: string;
  end_datetime: string | null;
  max_attendees: number | null;
  current_attendees: number | null;
}

// Get start of today in ISO format (for filtering events)
function getStartOfToday(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

/**
 * GET /api/public/events
 * Get list of public events - NO AUTH REQUIRED
 * Returns sanitized data without attendee details
 * 
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 * - city: filter by city
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const city = searchParams.get("city");

  let query = supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      event_type,
      image_url,
      venue_name,
      city,
      state,
      start_datetime,
      end_datetime,
      max_attendees,
      current_attendees
    `)
    .eq("is_public", true)
    .eq("status", "upcoming")
    .gte("start_datetime", getStartOfToday())
    .order("start_datetime", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filter by city
  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching public events:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching events" },
      { status: 500 }
    );
  }

  // Format events for public display (sanitized, no user-specific data)
  const formattedEvents = await Promise.all(
    ((events || []) as EventRow[]).map(async (event) => {
      // Resolve storage URL for event image
      const eventImageUrl = await resolveStorageUrl(supabase, event.image_url, { bucket: "events" });

      return {
        id: event.id,
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        image_url: eventImageUrl || "",
        venue_name: event.venue_name || "",
        city: event.city || "",
        state: event.state || "",
        date: event.start_datetime?.split("T")[0] || "",
        start_time: event.start_datetime
          ? new Date(event.start_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "",
        end_time: event.end_datetime
          ? new Date(event.end_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "",
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        max_attendees: event.max_attendees,
        attendee_count: event.current_attendees || 0,
        // Explicitly NOT including: attendee list, user registration status, exact address
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formattedEvents,
    msg: "Public events fetched successfully",
  });
}
