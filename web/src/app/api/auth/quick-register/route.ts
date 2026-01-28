import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { DbVirtualSpeedDating } from "@/types/db";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const quickRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Optional: auto-register for event after signup
  event_id: z.string().uuid().optional(),
  speed_dating_id: z.string().uuid().optional(),
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SpeedDatingRegistrationBasic {
  user_id: string | null;
}

interface SessionWithBasicRegistrations extends DbVirtualSpeedDating {
  speed_dating_registrations: SpeedDatingRegistrationBasic[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Register user for a regular event (using admin client to bypass RLS)
 */
async function registerForEvent(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  eventId: string
): Promise<{ success: boolean; msg: string }> {
  // Check if event exists and is upcoming
  const { data: event, error: eventError } = await adminClient
    .from("events")
    .select("id, title, status, max_attendees, current_attendees")
    .eq("id", eventId)
    .eq("is_public", true)
    .single();

  if (eventError || !event) {
    return { success: false, msg: "Event not found" };
  }

  if (event.status !== "upcoming" && event.status !== "ongoing") {
    return { success: false, msg: "This event is no longer accepting registrations" };
  }

  // Check capacity
  if (event.max_attendees && event.current_attendees !== null && event.current_attendees >= event.max_attendees) {
    return { success: false, msg: "This event has reached maximum capacity" };
  }

  // Create registration
  const { error: insertError } = await adminClient
    .from("event_attendees")
    .insert({
      event_id: eventId,
      user_id: userId,
      status: "registered",
    });

  if (insertError) {
    console.error("Error registering for event:", insertError);
    return { success: false, msg: "Error registering for event" };
  }

  // Update attendee count
  await adminClient
    .from("events")
    .update({ current_attendees: (event.current_attendees || 0) + 1 })
    .eq("id", eventId);

  // Create notification
  await adminClient.from("notifications").insert({
    user_id: userId,
    type: "event",
    title: "Event Registration",
    body: `You're registered for "${event.title}"!`,
    data: { event_id: eventId },
  });

  return { success: true, msg: `Registered for "${event.title}"` };
}

/**
 * Register user for a speed dating session (using admin client to bypass RLS)
 * Note: For new users without profiles, we skip gender/age validation
 */
async function registerForSpeedDating(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  sessionId: string
): Promise<{ success: boolean; msg: string }> {
  // Get session details
  const { data: session, error: sessionError } = await adminClient
    .from("virtual_speed_dating")
    .select(`
      *,
      speed_dating_registrations(user_id)
    `)
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return { success: false, msg: "Session not found" };
  }

  const typedSession = session as SessionWithBasicRegistrations;

  // Check if session is still open for registration
  if (typedSession.status !== "scheduled") {
    return { success: false, msg: "This session is no longer open for registration" };
  }

  // Check if session has a valid datetime and is in the future
  if (!typedSession.scheduled_datetime) {
    return { success: false, msg: "This session doesn't have a scheduled date" };
  }

  const sessionDate = new Date(typedSession.scheduled_datetime);
  if (isNaN(sessionDate.getTime()) || sessionDate < new Date()) {
    return { success: false, msg: "This session has already started" };
  }

  // Check if session is full
  const registrations = typedSession.speed_dating_registrations || [];
  if (typedSession.max_participants !== null && registrations.length >= typedSession.max_participants) {
    return { success: false, msg: "This session is full" };
  }

  // Note: We skip gender/age validation for new users without profiles
  // They'll need to complete their profile before the event

  // Register user
  const { error: registerError } = await adminClient
    .from("speed_dating_registrations")
    .insert({
      session_id: sessionId,
      user_id: userId,
      status: "registered",
    });

  if (registerError) {
    console.error("Error registering for speed dating:", registerError);
    return { success: false, msg: "Error registering for session" };
  }

  // Create notification
  await adminClient.from("notifications").insert({
    user_id: userId,
    type: "event",
    title: "Speed Dating Registration",
    body: `You're registered for "${typedSession.title}"! Complete your profile before the event.`,
    data: {
      session_id: sessionId,
      scheduled_datetime: typedSession.scheduled_datetime,
    },
  });

  return { success: true, msg: `Registered for "${typedSession.title}"` };
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * POST /api/auth/quick-register
 * Quick registration with minimal fields + optional auto-RSVP
 * 
 * Body:
 * - email: string (required)
 * - password: string (required, min 8 chars)
 * - event_id?: string (optional, auto-register for this event)
 * - speed_dating_id?: string (optional, auto-register for this session)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = quickRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, event_id, speed_dating_id } = validation.data;
    const supabase = await createApiClient();
    const adminClient = createAdminClient();

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // Handle common error cases
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists. Please log in instead." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    let eventRegistration: { success: boolean; msg: string } | null = null;
    let speedDatingRegistration: { success: boolean; msg: string } | null = null;

    // Auto-register for event if provided
    if (event_id) {
      eventRegistration = await registerForEvent(adminClient, userId, event_id);
    }

    // Auto-register for speed dating if provided
    if (speed_dating_id) {
      speedDatingRegistration = await registerForSpeedDating(adminClient, userId, speed_dating_id);
    }

    // Build response message
    let message = "Account created successfully!";
    if (eventRegistration?.success) {
      message += ` ${eventRegistration.msg}.`;
    } else if (eventRegistration && !eventRegistration.success) {
      message += ` Note: ${eventRegistration.msg}`;
    }
    if (speedDatingRegistration?.success) {
      message += ` ${speedDatingRegistration.msg}.`;
    } else if (speedDatingRegistration && !speedDatingRegistration.success) {
      message += ` Note: ${speedDatingRegistration.msg}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        session: authData.session,
        event_registration: eventRegistration,
        speed_dating_registration: speedDatingRegistration,
      },
      message,
    });
  } catch (err) {
    console.error("Quick registration error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
