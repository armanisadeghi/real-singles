import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { DbVirtualSpeedDating, DbProfile } from "@/types/db";

// Type for registration from JOIN query
interface SpeedDatingRegistration {
  user_id: string | null;
  status: string | null;
  registered_at: string | null;
}

// Type for session with registrations JOIN
interface SessionWithRegistrations extends DbVirtualSpeedDating {
  speed_dating_registrations: SpeedDatingRegistration[];
}

// Type for participant profile
interface ParticipantProfile extends Pick<DbProfile, "user_id" | "first_name" | "gender" | "profile_image_url" | "is_verified"> {}

/**
 * Map database status values to display-friendly status values
 * Database: scheduled, in_progress, completed, cancelled
 * Display: upcoming, ongoing, completed, cancelled
 */
function mapStatusForDisplay(dbStatus: string | null): "upcoming" | "ongoing" | "completed" | "cancelled" {
  switch (dbStatus) {
    case "scheduled":
      return "upcoming";
    case "in_progress":
      return "ongoing";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "upcoming";
  }
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
 * GET /api/speed-dating/[id]
 * Get details of a specific speed dating session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const supabase = await createApiClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session, error } = await supabase
    .from("virtual_speed_dating")
    .select(`
      *,
      speed_dating_registrations(
        user_id,
        status,
        registered_at
      )
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
  const registrations = typedSession.speed_dating_registrations || [];
  const isUserRegistered = user 
    ? registrations.some((r) => r.user_id === user.id)
    : false;
  const userRegistration = user
    ? registrations.find((r) => r.user_id === user.id)
    : null;

  // Get participant profiles (limited info for privacy)
  const participantIds = registrations.map((r) => r.user_id).filter((id): id is string => id !== null);
  let participants: Array<{
    user_id: string | null;
    first_name: string | null;
    gender: string | null;
    profile_image_url: string | null;
    is_verified: boolean | null;
  }> = [];

  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, gender, profile_image_url, is_verified")
      .in("user_id", participantIds);

    const typedProfiles = (profiles || []) as ParticipantProfile[];
    participants = await Promise.all(
      typedProfiles.map(async (p) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        gender: p.gender,
        profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
        is_verified: p.is_verified,
      }))
    );
  }

  // Resolve image URL (speed dating images use the events bucket)
  const imageUrl = await resolveStorageUrl(supabase, session.image_url, { bucket: "events" });

  // Convert round_duration_seconds to minutes for display
  const roundDurationMinutes = session.round_duration_seconds 
    ? Math.round(session.round_duration_seconds / 60) 
    : 3;

  // Format response to match what the detail page expects
  return NextResponse.json({
    success: true,
    // Primary format for web detail page
    session: {
      id: session.id,
      name: session.title,
      description: session.description,
      session_date: session.scheduled_datetime?.split("T")[0] || "",
      start_time: formatTimeFromDatetime(session.scheduled_datetime),
      end_time: calculateEndTime(session.scheduled_datetime, session.duration_minutes),
      duration_minutes: session.duration_minutes || 45,
      round_duration_minutes: roundDurationMinutes,
      max_participants: session.max_participants || 20,
      status: mapStatusForDisplay(session.status),
      event_type: "virtual" as const,
      city: null,
      venue_name: null,
      venue_address: null,
      image_url: imageUrl,
      min_age: session.age_min,
      max_age: session.age_max,
      gender_preference: session.gender_preference,
      price: session.price,
    },
    registration_count: registrations.length,
    is_registered: isUserRegistered,
    // Additional data for compatibility and extended info
    data: {
      SessionID: session.id,
      Title: session.title,
      Description: session.description,
      ImageURL: imageUrl,
      ScheduledDateTime: session.scheduled_datetime,
      DurationMinutes: session.duration_minutes,
      RoundDurationSeconds: session.round_duration_seconds,
      MinParticipants: session.min_participants,
      MaxParticipants: session.max_participants,
      CurrentParticipants: registrations.length,
      SpotsAvailable: session.max_participants !== null ? session.max_participants - registrations.length : null,
      GenderPreference: session.gender_preference,
      AgeMin: session.age_min,
      AgeMax: session.age_max,
      Status: session.status,
      IsUserRegistered: isUserRegistered,
      UserRegistrationStatus: userRegistration?.status || null,
      Participants: participants,
      CreatedAt: session.created_at,
    },
    msg: "Session details fetched successfully",
  });
}
