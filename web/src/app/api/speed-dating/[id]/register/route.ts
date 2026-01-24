import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/speed-dating/[id]/register
 * Register for a speed dating session
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
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

  // Get session details
  const { data: session, error: sessionError } = await supabase
    .from("virtual_speed_dating")
    .select(`
      *,
      speed_dating_registrations(user_id)
    `)
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { success: false, msg: "Session not found" },
      { status: 404 }
    );
  }

  // Check if session is still open for registration
  if (session.status !== "scheduled") {
    return NextResponse.json(
      { success: false, msg: "This session is no longer open for registration" },
      { status: 400 }
    );
  }

  // Check if session is in the future
  if (new Date(session.scheduled_datetime) < new Date()) {
    return NextResponse.json(
      { success: false, msg: "This session has already started" },
      { status: 400 }
    );
  }

  // Check if user is already registered
  const registrations = session.speed_dating_registrations || [];
  if (registrations.some((r: any) => r.user_id === user.id)) {
    return NextResponse.json({
      success: true,
      msg: "You are already registered for this session",
    });
  }

  // Check if session is full
  if (session.max_participants !== null && registrations.length >= session.max_participants) {
    return NextResponse.json(
      { success: false, msg: "This session is full" },
      { status: 400 }
    );
  }

  // Get user profile to check eligibility
  const { data: profile } = await supabase
    .from("profiles")
    .select("gender, date_of_birth")
    .eq("user_id", user.id)
    .single();

  // Check gender preference
  if (session.gender_preference && session.gender_preference !== "mixed") {
    const requiredGender = session.gender_preference === "men_only" ? "male" : "female";
    if (profile?.gender !== requiredGender) {
      return NextResponse.json(
        { success: false, msg: `This session is for ${session.gender_preference.replace("_", " ")}` },
        { status: 400 }
      );
    }
  }

  // Check age range
  if (profile?.date_of_birth && (session.age_min || session.age_max)) {
    const dob = new Date(profile.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (session.age_min && age < session.age_min) {
      return NextResponse.json(
        { success: false, msg: `You must be at least ${session.age_min} years old for this session` },
        { status: 400 }
      );
    }
    if (session.age_max && age > session.age_max) {
      return NextResponse.json(
        { success: false, msg: `You must be ${session.age_max} years old or younger for this session` },
        { status: 400 }
      );
    }
  }

  // Register user
  const { error: registerError } = await supabase
    .from("speed_dating_registrations")
    .insert({
      session_id: sessionId,
      user_id: user.id,
      status: "registered",
    });

  if (registerError) {
    console.error("Error registering for speed dating:", registerError);
    return NextResponse.json(
      { success: false, msg: "Error registering for session" },
      { status: 500 }
    );
  }

  // Create notification
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "event",
    title: "Speed Dating Registration",
    body: `You're registered for "${session.title}"!`,
    data: {
      session_id: sessionId,
      scheduled_datetime: session.scheduled_datetime,
    },
  });

  return NextResponse.json({
    success: true,
    msg: "Successfully registered for speed dating session",
  });
}

/**
 * DELETE /api/speed-dating/[id]/register
 * Cancel registration for a speed dating session
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
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

  // Check if session exists and hasn't started
  const { data: session } = await supabase
    .from("virtual_speed_dating")
    .select("status, scheduled_datetime")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json(
      { success: false, msg: "Session not found" },
      { status: 404 }
    );
  }

  if (session.status !== "scheduled") {
    return NextResponse.json(
      { success: false, msg: "Cannot cancel registration for a session that has started" },
      { status: 400 }
    );
  }

  // Delete registration
  const { error } = await supabase
    .from("speed_dating_registrations")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error canceling registration:", error);
    return NextResponse.json(
      { success: false, msg: "Error canceling registration" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Registration cancelled successfully",
  });
}
