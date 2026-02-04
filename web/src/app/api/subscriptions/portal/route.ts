/**
 * POST /api/subscriptions/portal
 * Create a Stripe Customer Portal session for subscription management
 */

import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createCustomerPortalSession, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
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

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { success: false, msg: "Payment processing not available" },
        { status: 503 }
      );
    }

    // Get user's Stripe customer ID
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!userData?.stripe_customer_id) {
      return NextResponse.json(
        { success: false, msg: "No subscription found" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createCustomerPortalSession({
      customerId: userData.stripe_customer_id,
      returnUrl: `${appUrl}/settings/subscription`,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
