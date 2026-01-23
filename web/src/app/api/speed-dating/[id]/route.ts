import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

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

  const registrations = session.speed_dating_registrations || [];
  const isUserRegistered = user 
    ? registrations.some((r: any) => r.user_id === user.id)
    : false;
  const userRegistration = user
    ? registrations.find((r: any) => r.user_id === user.id)
    : null;

  // Get participant profiles (limited info for privacy)
  const participantIds = registrations.map((r: any) => r.user_id);
  let participants: any[] = [];

  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, gender, profile_image_url, is_verified")
      .in("user_id", participantIds);

    participants = (profiles || []).map((p) => ({
      UserID: p.user_id,
      FirstName: p.first_name,
      Gender: p.gender,
      ProfileImage: p.profile_image_url,
      IsVerified: p.is_verified,
    }));
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
      SpotsAvailable: session.max_participants - registrations.length,
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
