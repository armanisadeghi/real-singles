import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/explore
 * Lightweight endpoint for explore page - only fetches events and speed dating
 * 
 * This is much faster than /api/discover which fetches unnecessary profile data.
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

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const nowIso = new Date().toISOString();

  // Fetch events and speed dating in parallel - just 2 simple queries
  const [eventsResult, speedDatingResult] = await Promise.all([
    // Events - upcoming public events
    supabase
      .from("events")
      .select("id, title, description, start_datetime, end_datetime, address, city, state, image_url, created_by")
      .eq("status", "upcoming")
      .eq("is_public", true)
      .gte("start_datetime", startOfToday.toISOString())
      .order("start_datetime", { ascending: true })
      .limit(10),

    // Virtual Speed Dating - scheduled sessions
    supabase
      .from("virtual_speed_dating")
      .select("id, title, description, scheduled_datetime, duration_minutes, max_participants, status, image_url")
      .eq("status", "scheduled")
      .gte("scheduled_datetime", nowIso)
      .order("scheduled_datetime", { ascending: true })
      .limit(10),
  ]);

  const events = eventsResult.data || [];
  const speedDating = speedDatingResult.data || [];

  // Collect all image URLs that need resolution
  const eventImageUrls = events.map(e => e.image_url).filter(Boolean);
  const speedDatingImageUrls = speedDating.map(s => s.image_url).filter(Boolean);
  
  // Resolve all image URLs in parallel
  const allImageUrls = [...eventImageUrls, ...speedDatingImageUrls];
  const resolvedUrls = await Promise.all(
    allImageUrls.map(url => resolveStorageUrl(supabase, url, { bucket: "events" }))
  );
  
  // Create a map for quick lookup
  const urlMap = new Map<string, string>();
  allImageUrls.forEach((original, i) => {
    if (original) urlMap.set(original, resolvedUrls[i]);
  });

  // Format events
  const formattedEvents = events.map(event => ({
    EventID: event.id,
    EventName: event.title,
    EventDate: event.start_datetime?.split("T")[0] || "",
    EventPrice: "0", // TODO: Add price field when available
    StartTime: event.start_datetime ? new Date(event.start_datetime).toLocaleTimeString() : "",
    EndTime: event.end_datetime ? new Date(event.end_datetime).toLocaleTimeString() : "",
    Description: event.description || "",
    Street: event.address || "",
    City: event.city || "",
    State: event.state || "",
    EventImage: event.image_url ? urlMap.get(event.image_url) || null : null,
    HostedBy: "",
  }));

  // Format speed dating sessions
  const formattedSpeedDating = speedDating.map(session => ({
    ID: session.id,
    Title: session.title,
    Description: session.description || "",
    Image: session.image_url ? urlMap.get(session.image_url) || "" : "",
    ScheduledDate: session.scheduled_datetime?.split("T")[0] || "",
    ScheduledTime: session.scheduled_datetime 
      ? new Date(session.scheduled_datetime).toLocaleTimeString() 
      : "",
    Duration: session.duration_minutes,
    MaxParticipants: session.max_participants,
    Status: session.status,
  }));

  return NextResponse.json({
    success: true,
    event: formattedEvents,
    Virtual: formattedSpeedDating,
    msg: "Explore data fetched successfully",
  });
}
