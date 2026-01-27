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
    UserID: string | null;
    FirstName: string | null;
    Gender: string | null;
    ProfileImage: string | null;
    IsVerified: boolean | null;
  }> = [];

  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, gender, profile_image_url, is_verified")
      .in("user_id", participantIds);

    const typedProfiles = (profiles || []) as ParticipantProfile[];
    participants = await Promise.all(
      typedProfiles.map(async (p) => ({
        UserID: p.user_id,
        FirstName: p.first_name,
        Gender: p.gender,
        ProfileImage: await resolveStorageUrl(supabase, p.profile_image_url),
        IsVerified: p.is_verified,
      }))
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      SessionID: session.id,
      Title: session.title,
      Description: session.description,
      ImageURL: session.image_url,
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
      AgoraChannelPrefix: session.agora_channel_prefix,
      IsUserRegistered: isUserRegistered,
      UserRegistrationStatus: userRegistration?.status || null,
      Participants: participants,
      CreatedAt: session.created_at,
    },
    msg: "Session details fetched successfully",
  });
}
