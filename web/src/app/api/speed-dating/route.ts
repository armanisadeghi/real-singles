import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
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

/**
 * GET /api/speed-dating
 * Get list of virtual speed dating sessions
 * 
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 * - status: filter by status (scheduled, in_progress, completed)
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
    `)
    .order("scheduled_datetime", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filter by status
  if (status) {
    query = query.eq("status", status);
  } else {
    // Default: show upcoming and in-progress sessions
    query = query.in("status", ["scheduled", "in_progress"]);
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.error("Error fetching speed dating sessions:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching sessions" },
      { status: 500 }
    );
  }

  // Format sessions
  const typedSessions = (sessions || []) as SessionWithRegistrations[];
  const formattedSessions = typedSessions.map((session) => {
    const registrations = session.speed_dating_registrations || [];
    const isUserRegistered = user 
      ? registrations.some((r) => r.user_id === user.id)
      : false;
    const registeredCount = registrations.length;
    const spotsAvailable = (session.max_participants ?? 0) - registeredCount;

    return {
      SessionID: session.id,
      Title: session.title,
      Description: session.description,
      ImageURL: session.image_url,
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
      AgoraChannelPrefix: session.agora_channel_prefix,
      IsUserRegistered: isUserRegistered,
      CreatedAt: session.created_at,
    };
  });

  return NextResponse.json({
    success: true,
    data: formattedSessions,
    msg: "Speed dating sessions fetched successfully",
  });
}
