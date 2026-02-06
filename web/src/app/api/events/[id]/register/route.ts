import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/stripe";

/**
 * POST /api/events/[id]/register
 * Register for an event
 * 
 * Free events: registers immediately
 * Paid events: creates Stripe checkout session, registers after payment
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

  // Get event with price info
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, status, max_attendees, current_attendees, start_datetime, price, image_url")
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

  // Check if event has already started
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

  if (existing && existing.status === "registered") {
    return NextResponse.json({
      success: true,
      status: "registered",
      msg: "You are already registered for this event",
    });
  }

  // Determine if this is a paid event
  const eventPrice = event.price ? Number(event.price) : 0;
  const isPaidEvent = eventPrice > 0;

  // ===========================
  // PAID EVENT → Stripe Checkout
  // ===========================
  if (isPaidEvent) {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { success: false, msg: "Payment processing is not available. Please try again later." },
        { status: 503 }
      );
    }

    try {
      const adminSupabase = createAdminClient();

      // Get user info for Stripe
      const { data: userData } = await adminSupabase
        .from("users")
        .select("email, display_name, stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (!userData) {
        return NextResponse.json(
          { success: false, msg: "User not found" },
          { status: 404 }
        );
      }

      // Get or create Stripe customer
      const customerId = await getOrCreateStripeCustomer({
        userId: user.id,
        email: userData.email,
        name: userData.display_name || undefined,
        existingCustomerId: userData.stripe_customer_id,
      });

      // Save customer ID if new
      if (!userData.stripe_customer_id) {
        await adminSupabase
          .from("users")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      // Create Stripe checkout session
      const session = await createCheckoutSession({
        customerId,
        lineItems: [
          {
            price_data: {
              currency: "usd",
              unit_amount: Math.round(eventPrice * 100), // cents
              product_data: {
                name: `Event: ${event.title}`,
                description: `RSVP for "${event.title}"`,
                ...(event.image_url && { images: [event.image_url] }),
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        successUrl: `${appUrl}/events/${eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/events/${eventId}?payment=canceled`,
        clientReferenceId: user.id,
        metadata: {
          type: "event_registration",
          event_id: eventId,
          user_id: user.id,
        },
      });

      // Create pending payment record
      await adminSupabase.from("payments").insert({
        user_id: user.id,
        stripe_checkout_session_id: session.id,
        amount_cents: Math.round(eventPrice * 100),
        currency: "usd",
        status: "pending",
        payment_type: "one_time",
        description: `Event RSVP: ${event.title}`,
        metadata: {
          type: "event_registration",
          event_id: eventId,
        },
      });

      // Create or update attendee record as pending_payment
      if (existing) {
        await adminSupabase
          .from("event_attendees")
          .update({
            status: "pending_payment",
            stripe_checkout_session_id: session.id,
          })
          .eq("id", existing.id);
      } else {
        await adminSupabase.from("event_attendees").insert({
          event_id: eventId,
          user_id: user.id,
          status: "pending_payment",
          stripe_checkout_session_id: session.id,
        });
      }

      return NextResponse.json({
        success: true,
        status: "requires_payment",
        msg: "Payment required to complete RSVP",
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
          amount: eventPrice,
        },
      });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      return NextResponse.json(
        { success: false, msg: "Unable to create checkout session. Please try again." },
        { status: 500 }
      );
    }
  }

  // ===========================
  // FREE EVENT → Register immediately
  // ===========================
  if (existing) {
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
  } else {
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
  }

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
