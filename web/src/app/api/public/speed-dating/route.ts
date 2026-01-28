import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { DbVirtualSpeedDating } from "@/types/db";

// Type for registration count from JOIN query
interface SpeedDatingRegistration {
  user_id: string | null;
}

// Type for session with registrations JOIN
interface SessionWithRegistrations extends DbVirtualSpeedDating {
  speed_dating_registrations: SpeedDatingRegistration[];
}

/**
 * GET /api/public/speed-dating
 * Get list of public speed dating sessions - NO AUTH REQUIRED
 * Returns sanitized data without participant details
 * 
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data: sessions, error } = await supabase
    .from("virtual_speed_dating")
    .select(`
      *,
      speed_dating_registrations(user_id)
    `)
    .in("status", ["scheduled", "in_progress"])
    .order("scheduled_datetime", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching public speed dating sessions:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching sessions" },
      { status: 500 }
    );
  }

  // Format sessions for public display (sanitized, no user-specific data)
  const typedSessions = (sessions || []) as SessionWithRegistrations[];
  const formattedSessions = await Promise.all(
    typedSessions.map(async (session) => {
      const registrations = session.speed_dating_registrations || [];
      const registrationCount = registrations.length;
      const spotsAvailable = session.max_participants !== null
        ? Math.max(0, session.max_participants - registrationCount)
        : null;
      const isFull = session.max_participants !== null && registrationCount >= session.max_participants;

      // Resolve image URL (speed dating images use the events bucket)
      const imageUrl = await resolveStorageUrl(supabase, session.image_url, { bucket: "events" });

      // Convert round_duration_seconds to minutes for display
      const roundDurationMinutes = session.round_duration_seconds 
        ? Math.round(session.round_duration_seconds / 60) 
        : 3;

      return {
        id: session.id,
        title: session.title,
        description: session.description,
        image_url: imageUrl,
        scheduled_datetime: session.scheduled_datetime,
        date: session.scheduled_datetime?.split("T")[0] || "",
        start_time: session.scheduled_datetime
          ? new Date(session.scheduled_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "",
        duration_minutes: session.duration_minutes || 45,
        round_duration_minutes: roundDurationMinutes,
        min_participants: session.min_participants,
        max_participants: session.max_participants,
        participant_count: registrationCount,
        spots_available: spotsAvailable,
        is_full: isFull,
        status: session.status,
        // Show eligibility criteria so users know before clicking
        gender_preference: session.gender_preference,
        age_min: session.age_min,
        age_max: session.age_max,
        // Explicitly NOT including: participant list, user registration status
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formattedSessions,
    msg: "Public speed dating sessions fetched successfully",
  });
}
