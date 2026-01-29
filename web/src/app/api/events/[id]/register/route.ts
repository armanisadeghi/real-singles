import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/events/[id]/register
 * Register interest in or for an event
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
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

  // Check if event exists and is still accepting registrations
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, status, max_attendees, current_attendees, start_datetime")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { success: false, msg: "Event not found" },
      { status: 404 }
    );
  }

  // Check if event is cancelled
  if (event.status === "cancelled") {
    return NextResponse.json(
      { success: false, msg: "This event has been cancelled" },
      { status: 400 }
    );
  }

  // Check if event has already started (use date as source of truth)
  const eventStartDate = new Date(event.start_datetime);
  const now = new Date();
  if (eventStartDate < now) {
    return NextResponse.json(
      { success: false, msg: "This event has already started and is no longer accepting registrations" },
      { status: 400 }
    );
  }

  // Check capacity
  if (event.max_attendees && event.current_attendees !== null && event.current_attendees >= event.max_attendees) {
    return NextResponse.json(
      { success: false, msg: "This event has reached maximum capacity" },
      { status: 400 }
    );
  }

  // Check existing registration
  const { data: existing } = await supabase
    .from("event_attendees")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // User is already registered - return current status
    if (existing.status === "registered") {
      return NextResponse.json({
        success: true,
        status: "registered",
        msg: "You are already registered for this event",
      });
    }
    
    // Update to registered status
    const { error: updateError } = await supabase
      .from("event_attendees")
      .update({ status: "registered" })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Error updating registration:", updateError);
      return NextResponse.json(
        { success: false, msg: "Error updating registration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "registered",
      msg: "You are now registered for this event",
    });
  }

  // Create new registration with 'registered' status directly
  const { error: insertError } = await supabase
    .from("event_attendees")
    .insert({
      event_id: eventId,
      user_id: user.id,
      status: "registered",
    });

  if (insertError) {
    console.error("Error registering for event:", insertError);
    return NextResponse.json(
      { success: false, msg: "Error registering for event" },
      { status: 500 }
    );
  }

  // Update attendee count
  await supabase
    .from("events")
    .update({ current_attendees: (event.current_attendees || 0) + 1 })
    .eq("id", eventId);

  return NextResponse.json({
    success: true,
    status: "registered",
    msg: "You are now registered for this event",
  });
}

/**
 * DELETE /api/events/[id]/register
 * Cancel event registration
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
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

  const { data: existing } = await supabase
    .from("event_attendees")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({
      success: true,
      msg: "You are not registered for this event",
    });
  }

  const { error } = await supabase
    .from("event_attendees")
    .delete()
    .eq("id", existing.id);

  if (error) {
    console.error("Error canceling registration:", error);
    return NextResponse.json(
      { success: false, msg: "Error canceling registration" },
      { status: 500 }
    );
  }

  // Update attendee count
  const { data: event } = await supabase
    .from("events")
    .select("current_attendees")
    .eq("id", eventId)
    .single();

  if (event && event.current_attendees !== null && event.current_attendees > 0) {
    await supabase
      .from("events")
      .update({ current_attendees: event.current_attendees - 1 })
      .eq("id", eventId);
  }

  return NextResponse.json({
    success: true,
    msg: "Registration cancelled successfully",
  });
}
