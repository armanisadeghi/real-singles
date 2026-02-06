/**
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed: Process completed payments
 * - customer.subscription.created: New subscription
 * - customer.subscription.updated: Subscription changes
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.paid: Successful subscription payment
 * - invoice.payment_failed: Failed subscription payment
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { constructWebhookEvent, getCheckoutSession, stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Disable body parsing - we need raw body for signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createAdminClient();

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent) {
      console.log(`Duplicate event: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Record the event
    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: JSON.parse(JSON.stringify(event.data.object)),
    });

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(
          supabase,
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          supabase,
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  console.log("Processing checkout session:", session.id);

  // Get full session with line items
  const fullSession = await getCheckoutSession(session.id);
  if (!fullSession) {
    console.error("Could not retrieve session:", session.id);
    return;
  }

  const metadata = fullSession.metadata || {};
  const userId = metadata.user_id || fullSession.client_reference_id;

  if (!userId) {
    console.error("No user ID in session:", session.id);
    return;
  }

  // Update payment record
  await supabase
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id: fullSession.payment_intent as string,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_checkout_session_id", session.id);

  // ============================
  // EVENT REGISTRATION PAYMENT
  // ============================
  if (metadata.type === "event_registration") {
    await handleEventRegistrationPayment(supabase, session.id, metadata);
    return; // Don't process as a regular order
  }

  // Parse metadata
  const paymentMethod = metadata.payment_method || "stripe";
  const pointsToDeduct = parseInt(metadata.points_to_deduct || "0", 10);
  const items = metadata.items ? JSON.parse(metadata.items) : [];
  const isGift = metadata.is_gift === "true";
  const recipientUserId = metadata.recipient_user_id || null;
  const giftMessage = metadata.gift_message || null;
  const shipping = metadata.shipping ? JSON.parse(metadata.shipping) : null;

  // Get payment record
  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  // Deduct points if "both" payment method
  if (paymentMethod === "both" && pointsToDeduct > 0) {
    const { data: userData } = await supabase
      .from("users")
      .select("points_balance")
      .eq("id", userId)
      .single();

    if (userData) {
      const newBalance = Math.max(0, (userData.points_balance ?? 0) - pointsToDeduct);
      await supabase
        .from("users")
        .update({ points_balance: newBalance })
        .eq("id", userId);

      await supabase.from("point_transactions").insert({
        user_id: userId,
        amount: -pointsToDeduct,
        balance_after: newBalance,
        transaction_type: "redemption",
        description: "Points used in combined purchase",
        reference_id: payment?.id || null,
        reference_type: "payment",
      });
    }
  }

  // Create order records for each item
  for (const item of items) {
    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: item.type === "product" ? item.id : null,
        purchasable_item_id: item.type === "purchasable_item" ? item.id : null,
        points_spent: paymentMethod === "both" ? pointsToDeduct : 0,
        dollar_amount: (fullSession.amount_total || 0) / 100,
        payment_id: payment?.id || null,
        payment_method: paymentMethod as "stripe" | "both",
        status: "processing",
        is_gift: isGift,
        recipient_user_id: recipientUserId,
        gift_message: giftMessage,
        ...(shipping && {
          shipping_name: shipping.name,
          shipping_address: shipping.address,
          shipping_city: shipping.city,
          shipping_state: shipping.state,
          shipping_zip: shipping.zip,
          shipping_country: shipping.country,
        }),
      })
      .select()
      .single();

    // Grant digital items
    if (item.type === "purchasable_item" && order) {
      await grantPurchasableItem(supabase, userId, item.id, item.qty || 1, order.id);
    }

    // Decrement stock for physical products
    if (item.type === "product") {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.id)
        .single();

      if (product && product.stock_quantity !== null) {
        await supabase
          .from("products")
          .update({ stock_quantity: Math.max(0, product.stock_quantity - (item.qty || 1)) })
          .eq("id", item.id);
      }
    }
  }

  console.log("Checkout completed for user:", userId);
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionChange(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  console.log("Processing subscription change:", subscription.id);

  // Get user by Stripe customer ID
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", subscription.customer as string)
    .single();

  if (!user) {
    console.error("User not found for customer:", subscription.customer);
    return;
  }

  // Get subscription plan by Stripe price ID
  const priceId = subscription.items.data[0]?.price.id;
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("*")
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .single();

  // Get subscription period timestamps
  const subscriptionData = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
  };

  // Upsert subscription record - plan_id is required, skip if no plan found
  if (!plan?.id) {
    console.error("No plan found for price:", priceId);
    return;
  }

  await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan_id: plan.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        billing_interval: subscription.items.data[0]?.price.recurring?.interval || "month",
        current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        ended_at: subscription.ended_at
          ? new Date(subscription.ended_at * 1000).toISOString()
          : null,
        trial_start: subscription.trial_start
          ? new Date(subscription.trial_start * 1000).toISOString()
          : null,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );

  // Update user subscription tier
  await supabase
    .from("users")
    .update({
      subscription_tier: plan.name.toLowerCase(),
      subscription_plan_id: plan.id,
      subscription_expires_at: new Date(subscriptionData.current_period_end * 1000).toISOString(),
    })
    .eq("id", user.id);

  // Grant subscription benefits
  if (plan?.features && subscription.status === "active") {
    const features = plan.features as Record<string, number | boolean>;

    // Reset daily superlikes
    if (typeof features.superlikes_per_day === "number" && features.superlikes_per_day > 0) {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      await supabase
        .from("users")
        .update({
          daily_superlikes_remaining: features.superlikes_per_day,
          daily_superlikes_reset_at: tomorrow.toISOString(),
        })
        .eq("id", user.id);
    }
  }

  console.log("Subscription updated for user:", user.id);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  console.log("Processing subscription deletion:", subscription.id);

  // Update subscription record
  await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Get user
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", subscription.customer as string)
    .single();

  if (user) {
    // Downgrade to free tier
    await supabase
      .from("users")
      .update({
        subscription_tier: "free",
        subscription_plan_id: null,
        subscription_expires_at: null,
        daily_superlikes_remaining: 1, // Free tier default
      })
      .eq("id", user.id);

    console.log("User downgraded to free tier:", user.id);
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  console.log("Processing paid invoice:", invoice.id);

  // Cast to access properties that may vary across API versions
  const invoiceData = invoice as unknown as {
    subscription?: string | null;
    payment_intent?: string | null;
    period_start?: number;
    period_end?: number;
  };

  if (!invoiceData.subscription) return;

  // Create payment record
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (user) {
    await supabase.from("payments").insert({
      user_id: user.id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoiceData.payment_intent || null,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
      payment_type: "subscription",
      description: `Subscription payment: ${invoice.lines.data[0]?.description || ""}`,
      metadata: JSON.parse(JSON.stringify({
        subscription_id: invoiceData.subscription,
        period_start: invoiceData.period_start,
        period_end: invoiceData.period_end,
      })),
    });
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  console.log("Processing failed invoice:", invoice.id);

  // Cast to access properties that may vary across API versions
  const invoiceData = invoice as unknown as {
    subscription?: string | null;
    attempt_count?: number;
  };

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (user) {
    // Create failed payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_due,
      currency: invoice.currency,
      status: "failed",
      payment_type: "subscription",
      description: `Failed subscription payment: ${invoice.lines.data[0]?.description || ""}`,
      error_message: "Payment failed",
      metadata: JSON.parse(JSON.stringify({
        subscription_id: invoiceData.subscription,
        attempt_count: invoiceData.attempt_count,
      })),
    });

    // Update subscription status
    if (invoiceData.subscription) {
      await supabase
        .from("user_subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", invoiceData.subscription);
    }
  }
}

/**
 * Handle event registration payment completion
 */
async function handleEventRegistrationPayment(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  metadata: Record<string, string>
) {
  const eventId = metadata.event_id;
  const userId = metadata.user_id;

  if (!eventId || !userId) {
    console.error("Missing event_id or user_id in event registration metadata");
    return;
  }

  console.log(`Completing event registration: event=${eventId}, user=${userId}`);

  // Get payment record
  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .single();

  // Update attendee record from pending_payment → registered
  const { data: attendee, error: attendeeError } = await supabase
    .from("event_attendees")
    .update({
      status: "registered",
      payment_id: payment?.id || null,
    })
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "pending_payment")
    .select()
    .single();

  if (attendeeError) {
    console.error("Error updating event attendee:", attendeeError);
    // Try inserting if update failed (edge case)
    await supabase.from("event_attendees").upsert({
      event_id: eventId,
      user_id: userId,
      status: "registered",
      payment_id: payment?.id || null,
      stripe_checkout_session_id: sessionId,
    }, { onConflict: "event_id,user_id" });
  }

  // Increment attendee count
  const { data: event } = await supabase
    .from("events")
    .select("current_attendees")
    .eq("id", eventId)
    .single();

  if (event) {
    await supabase
      .from("events")
      .update({ current_attendees: (event.current_attendees || 0) + 1 })
      .eq("id", eventId);
  }

  console.log(`Event registration completed: event=${eventId}, user=${userId}`);
}

/**
 * Grant a purchasable item to a user's inventory
 */
async function grantPurchasableItem(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  itemId: string,
  quantity: number,
  orderId: string
) {
  // Get item details
  const { data: item } = await supabase
    .from("purchasable_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) return;

  const itemQuantity = (item.quantity || 1) * quantity;

  // Upsert inventory
  const { data: existing } = await supabase
    .from("user_item_inventory")
    .select("*")
    .eq("user_id", userId)
    .eq("item_type", item.item_type)
    .single();

  if (existing) {
    await supabase
      .from("user_item_inventory")
      .update({
        quantity: (existing.quantity ?? 0) + itemQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_item_inventory").insert({
      user_id: userId,
      item_type: item.item_type,
      quantity: itemQuantity,
      source: "purchase",
      source_reference_id: orderId,
    });
  }

  // Special handling for specific item types
  if (item.item_type === "superlike_pack") {
    const { data: userData } = await supabase
      .from("users")
      .select("superlike_balance")
      .eq("id", userId)
      .single();

    await supabase
      .from("users")
      .update({ superlike_balance: (userData?.superlike_balance ?? 0) + itemQuantity })
      .eq("id", userId);
  } else if (item.item_type === "boost" && item.duration_hours) {
    const boostExpiry = new Date();
    boostExpiry.setHours(boostExpiry.getHours() + item.duration_hours);
    await supabase
      .from("users")
      .update({ boost_expires_at: boostExpiry.toISOString() })
      .eq("id", userId);
  } else if (item.item_type === "points_pack") {
    const { data: userData } = await supabase
      .from("users")
      .select("points_balance")
      .eq("id", userId)
      .single();

    const currentBalance = userData?.points_balance ?? 0;
    const newBalance = currentBalance + itemQuantity;

    await supabase
      .from("users")
      .update({ points_balance: newBalance })
      .eq("id", userId);

    await supabase.from("point_transactions").insert({
      user_id: userId,
      amount: itemQuantity,
      balance_after: newBalance,
      transaction_type: "purchase",
      description: `Purchased ${item.name}`,
      reference_id: orderId,
      reference_type: "order",
    });
  }
}
