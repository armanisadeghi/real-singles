import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { DbVirtualSpeedDating } from "@/types/db";

// Type for registration from JOIN query
interface SpeedDatingRegistration {
  user_id: string | null;
}

// Type for session with registrations JOIN
interface SessionWithRegistrations extends DbVirtualSpeedDating {
  speed_dating_registrations: SpeedDatingRegistration[];
}

/**
 * Helper to format datetime for display
 */
function formatTimeFromDatetime(datetime: string | null): string {
  if (!datetime) return "";
  const date = new Date(datetime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Helper to calculate end time
 */
function calculateEndTime(datetime: string | null, durationMinutes: number | null): string | null {
  if (!datetime || !durationMinutes) return null;
  const start = new Date(datetime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const hours = end.getHours().toString().padStart(2, "0");
  const minutes = end.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * GET /api/public/speed-dating/[id]
 * Get public speed dating session details - NO AUTH REQUIRED
 * Returns sanitized data without participant details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const supabase = await createApiClient();

  const { data: session, error } = await supabase
    .from("virtual_speed_dating")
    .select(`
      *,
      speed_dating_registrations(user_id)
    `)
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json(
      { success: false, msg: "Session not found" },
      { status: 404 }
    );
  }

  const typedSession = session as SessionWithRegistrations;

  // Only show scheduled or in-progress sessions publicly
  if (typedSession.status !== "scheduled" && typedSession.status !== "in_progress") {
    return NextResponse.json(
      { success: false, msg: "Session not found" },
      { status: 404 }
    );
  }

  const registrations = typedSession.speed_dating_registrations || [];
  const registrationCount = registrations.length;
  const spotsAvailable = typedSession.max_participants !== null
    ? Math.max(0, typedSession.max_participants - registrationCount)
    : null;
  const isFull = typedSession.max_participants !== null && registrationCount >= typedSession.max_participants;

  // Resolve image URL (speed dating images use the events bucket)
  const imageUrl = await resolveStorageUrl(supabase, typedSession.image_url, { bucket: "events" });

  // Convert round_duration_seconds to minutes for display
  const roundDurationMinutes = typedSession.round_duration_seconds 
    ? Math.round(typedSession.round_duration_seconds / 60) 
    : 3;

  const formattedSession = {
    id: typedSession.id,
    title: typedSession.title,
    description: typedSession.description,
    image_url: imageUrl,
    scheduled_datetime: typedSession.scheduled_datetime,
    date: typedSession.scheduled_datetime?.split("T")[0] || "",
    start_time: formatTimeFromDatetime(typedSession.scheduled_datetime),
    end_time: calculateEndTime(typedSession.scheduled_datetime, typedSession.duration_minutes),
    duration_minutes: typedSession.duration_minutes || 45,
    round_duration_minutes: roundDurationMinutes,
    min_participants: typedSession.min_participants,
    max_participants: typedSession.max_participants,
    participant_count: registrationCount,
    spots_available: spotsAvailable,
    is_full: isFull,
    status: typedSession.status,
    // Show eligibility criteria so users know their eligibility
    gender_preference: typedSession.gender_preference,
    age_min: typedSession.age_min,
    age_max: typedSession.age_max,
    // Explicitly NOT including: participant list, participant photos, user registration status
  };

  return NextResponse.json({
    success: true,
    data: formattedSession,
    msg: "Session details fetched successfully",
  });
}
