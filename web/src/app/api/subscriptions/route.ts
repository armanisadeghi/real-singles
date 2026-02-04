/**
 * GET /api/subscriptions
 * Get user's current subscription status and available plans
 * 
 * POST /api/subscriptions
 * Create a Stripe Checkout session for subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  stripe,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/stripe";

/**
 * GET /api/subscriptions
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 401 }
    );
  }

  // Get user's subscription status
  const { data: userData } = await supabase
    .from("users")
    .select("subscription_tier, subscription_plan_id, subscription_expires_at, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Get active subscription details
  const { data: activeSubscription } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      subscription_plans:plan_id(*)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  // Get all available plans
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return NextResponse.json({
    success: true,
    data: {
      currentTier: userData?.subscription_tier || "free",
      expiresAt: userData?.subscription_expires_at,
      subscription: activeSubscription,
      plans: plans || [],
    },
  });
}

/**
 * POST /api/subscriptions
 * Create subscription checkout
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { success: false, msg: "Payment processing not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { planId, billingInterval = "month" } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, msg: "Plan ID required" },
        { status: 400 }
      );
    }

    // Get plan details
    const adminSupabase = createAdminClient();
    const { data: plan, error: planError } = await adminSupabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, msg: "Plan not found" },
        { status: 404 }
      );
    }

    // Get Stripe price ID based on billing interval
    const stripePriceId =
      billingInterval === "year"
        ? plan.stripe_price_id_yearly
        : plan.stripe_price_id_monthly;

    if (!stripePriceId) {
      return NextResponse.json(
        { success: false, msg: "Stripe not configured for this plan" },
        { status: 400 }
      );
    }

    // Get user data
    const { data: userData } = await supabase
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

    // Update user with Stripe customer ID if new
    if (!userData.stripe_customer_id) {
      await adminSupabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session
    const session = await createCheckoutSession({
      customerId,
      lineItems: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      successUrl: `${appUrl}/settings/subscription?success=true`,
      cancelUrl: `${appUrl}/settings/subscription?canceled=true`,
      clientReferenceId: user.id,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_interval: billingInterval,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
