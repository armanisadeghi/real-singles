import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { DbVirtualSpeedDating } from "@/types/db";

// Type for registration from JOIN query
interface SpeedDatingRegistration {
  user_id: string | null;
  status: string | null;
}

// Type for session with registrations JOIN
interface SessionWithRegistrations extends DbVirtualSpeedDating {
  speed_dating_registrations: SpeedDatingRegistration[];
}

// Get start of today in ISO format (for filtering sessions)
function getStartOfToday(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

/**
 * GET /api/speed-dating
 * Get list of virtual speed dating sessions
 * 
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 * - status: filter by status. Can be:
 *   - "upcoming": sessions scheduled for today or future (date-based, ignores status column)
 *   - "past": sessions before today (date-based, ignores status column)
 *   - "scheduled", "in_progress", "completed", "cancelled": filter by actual status column
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const status = searchParams.get("status");

  let query = supabase
    .from("virtual_speed_dating")
    .select(`
      *,
      speed_dating_registrations(user_id, status)
    `);

  // Filter by status
  // Note: We filter primarily by date for "upcoming" and "past", not the status column.
  // The status column may not be kept up-to-date, so we use scheduled_datetime as the source of truth.
  if (status === "upcoming") {
    // Show sessions that haven't started yet (today or future)
    // Exclude cancelled sessions, order by soonest first
    query = query
      .neq("status", "cancelled")
      .gte("scheduled_datetime", getStartOfToday())
      .order("scheduled_datetime", { ascending: true });
  } else if (status === "past") {
    // Show sessions that have already started (before today)
    // Exclude cancelled sessions, order by most recent first
    query = query
      .neq("status", "cancelled")
      .lt("scheduled_datetime", getStartOfToday())
      .order("scheduled_datetime", { ascending: false });
  } else if (status) {
    // Filter by specific status column value (scheduled, in_progress, completed, cancelled)
    query = query
      .eq("status", status)
      .order("scheduled_datetime", { ascending: true });
  } else {
    // Default: show upcoming and in-progress sessions based on date
    query = query
      .neq("status", "cancelled")
      .gte("scheduled_datetime", getStartOfToday())
      .order("scheduled_datetime", { ascending: true });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: sessions, error } = await query;

  if (error) {
    console.error("Error fetching speed dating sessions:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching sessions" },
      { status: 500 }
    );
  }

  // Format sessions and resolve image URLs
  const typedSessions = (sessions || []) as SessionWithRegistrations[];
  const formattedSessions = await Promise.all(
    typedSessions.map(async (session) => {
      const registrations = session.speed_dating_registrations || [];
      const isUserRegistered = user 
        ? registrations.some((r) => r.user_id === user.id)
        : false;
      const registeredCount = registrations.length;
      const spotsAvailable = (session.max_participants ?? 0) - registeredCount;
      
      // Resolve image URL (speed dating images use the events bucket)
      const imageUrl = await resolveStorageUrl(supabase, session.image_url, { bucket: "events" });

      return {
        // Primary identifiers - use both for backwards compatibility
        ID: session.id,
        SessionID: session.id,
        Title: session.title,
        Description: session.description,
        // Image fields - use both for backwards compatibility
        Image: imageUrl,
        ImageURL: imageUrl,
        ScheduledDateTime: session.scheduled_datetime,
        DurationMinutes: session.duration_minutes,
        RoundDurationSeconds: session.round_duration_seconds,
        MinParticipants: session.min_participants,
        MaxParticipants: session.max_participants,
        CurrentParticipants: registeredCount,
        SpotsAvailable: spotsAvailable,
        GenderPreference: session.gender_preference,
        AgeMin: session.age_min,
        AgeMax: session.age_max,
        Status: session.status,
        IsUserRegistered: isUserRegistered,
        CreatedAt: session.created_at,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formattedSessions,
    msg: "Speed dating sessions fetched successfully",
  });
}
