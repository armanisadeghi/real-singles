/**
 * GET /api/checkout/success
 * 
 * Verifies a completed checkout session and returns order details.
 * Called after successful Stripe checkout redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { getCheckoutSession, isStripeConfigured } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, msg: "Session ID required" },
        { status: 400 }
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { success: false, msg: "Payment processing not available" },
        { status: 503 }
      );
    }

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

    // Get checkout session from Stripe
    const session = await getCheckoutSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, msg: "Session not found" },
        { status: 404 }
      );
    }

    // Verify the session belongs to this user
    if (session.client_reference_id !== user.id && session.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { success: false, msg: "Session does not belong to user" },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, msg: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get order details from our database
    const { data: payment } = await supabase
      .from("payments")
      .select("id, status, amount_cents, metadata")
      .eq("stripe_checkout_session_id", sessionId)
      .single();

    // Get associated order
    const { data: order } = await supabase
      .from("orders")
      .select(`
        id, 
        status,
        product_id,
        purchasable_item_id,
        products:product_id (name),
        purchasable_items:purchasable_item_id (name)
      `)
      .eq("payment_id", payment?.id)
      .single();

    // Type assertion for the joined data
    interface OrderWithJoins {
      id: string;
      status: string;
      product_id: string | null;
      purchasable_item_id: string | null;
      products: { name: string } | null;
      purchasable_items: { name: string } | null;
    }

    const orderData = order as OrderWithJoins | null;

    const productName =
      orderData?.products?.name ||
      orderData?.purchasable_items?.name ||
      (session.line_items?.data[0]?.description ?? "Your purchase");

    return NextResponse.json({
      success: true,
      msg: "Order verified",
      data: {
        orderId: orderData?.id || session.id,
        productName,
        amount: session.amount_total || 0,
        status: orderData?.status || "processing",
        paymentStatus: session.payment_status,
      },
    });
  } catch (error) {
    console.error("Checkout success error:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to verify checkout" },
      { status: 500 }
    );
  }
}
