/**
 * POST /api/checkout/session
 * 
 * Creates a Stripe Checkout session for purchasing products or items.
 * Supports:
 * - Physical products (from products table)
 * - Digital items (from purchasable_items table)
 * - Points-only, Stripe-only, or dual payment methods
 * - Gift purchases with recipient selection
 */

import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import {
  stripe,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

interface CheckoutItem {
  type: "product" | "purchasable_item";
  id: string;
  quantity?: number;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  paymentMethod: "points" | "stripe" | "both";
  // For gift purchases
  isGift?: boolean;
  recipientUserId?: string;
  giftMessage?: string;
  // Shipping for physical products
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export async function POST(request: Request) {
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

    const body: CheckoutRequest = await request.json();
    const { items, paymentMethod, isGift, recipientUserId, giftMessage, shippingAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, msg: "No items provided" },
        { status: 400 }
      );
    }

    // Get user data including points balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, display_name, points_balance, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, msg: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all items and calculate totals
    let totalPointsCost = 0;
    let totalDollarCost = 0;
    const lineItems: Array<{
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
      quantity: number;
    }> = [];
    const orderItems: Array<{
      type: "product" | "purchasable_item";
      id: string;
      name: string;
      pointsCost: number;
      dollarCost: number;
      quantity: number;
      requiresShipping: boolean;
    }> = [];

    const adminSupabase = createAdminClient();

    for (const item of items) {
      const qty = item.quantity || 1;

      if (item.type === "product") {
        const { data: product, error } = await adminSupabase
          .from("products")
          .select("*")
          .eq("id", item.id)
          .eq("is_active", true)
          .single();

        if (error || !product) {
          return NextResponse.json(
            { success: false, msg: `Product not found: ${item.id}` },
            { status: 404 }
          );
        }

        // Check stock
        if (product.stock_quantity !== null && product.stock_quantity < qty) {
          return NextResponse.json(
            { success: false, msg: `Insufficient stock for: ${product.name}` },
            { status: 400 }
          );
        }

        const pointsCost = product.points_cost || 0;
        const dollarCost = product.dollar_price ? Number(product.dollar_price) : 0;

        totalPointsCost += pointsCost * qty;
        totalDollarCost += dollarCost * qty;

        orderItems.push({
          type: "product",
          id: product.id,
          name: product.name,
          pointsCost,
          dollarCost,
          quantity: qty,
          requiresShipping: product.requires_shipping ?? true,
        });

        if (paymentMethod !== "points" && dollarCost > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              unit_amount: Math.round(dollarCost * 100),
              product_data: {
                name: product.name,
                description: product.description || undefined,
              },
            },
            quantity: qty,
          });
        }
      } else if (item.type === "purchasable_item") {
        const { data: purchasableItem, error } = await adminSupabase
          .from("purchasable_items")
          .select("*")
          .eq("id", item.id)
          .eq("is_active", true)
          .single();

        if (error || !purchasableItem) {
          return NextResponse.json(
            { success: false, msg: `Item not found: ${item.id}` },
            { status: 404 }
          );
        }

        const pointsCost = purchasableItem.points_cost || 0;
        const dollarCost = purchasableItem.dollar_price ? Number(purchasableItem.dollar_price) : 0;

        totalPointsCost += pointsCost * qty;
        totalDollarCost += dollarCost * qty;

        orderItems.push({
          type: "purchasable_item",
          id: purchasableItem.id,
          name: purchasableItem.name,
          pointsCost,
          dollarCost,
          quantity: qty,
          requiresShipping: false,
        });

        if (paymentMethod !== "points" && dollarCost > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              unit_amount: Math.round(dollarCost * 100),
              product_data: {
                name: purchasableItem.name,
                description: purchasableItem.description || undefined,
              },
            },
            quantity: qty,
          });
        }
      }
    }

    // Check if any items require shipping
    const requiresShipping = orderItems.some((item) => item.requiresShipping);
    if (requiresShipping && !shippingAddress && !isGift) {
      return NextResponse.json(
        { success: false, msg: "Shipping address required for physical products" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (paymentMethod === "points") {
      // Points-only purchase
      if (totalPointsCost === 0) {
        return NextResponse.json(
          { success: false, msg: "Items do not have points pricing" },
          { status: 400 }
        );
      }

      if (userData.points_balance < totalPointsCost) {
        return NextResponse.json(
          {
            success: false,
            msg: "Insufficient points",
            data: {
              required: totalPointsCost,
              available: userData.points_balance,
            },
          },
          { status: 400 }
        );
      }

      // Process points-only order immediately
      const newBalance = userData.points_balance - totalPointsCost;

      // Create order record
      const { data: order, error: orderError } = await adminSupabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: orderItems[0].type === "product" ? orderItems[0].id : null,
          purchasable_item_id: orderItems[0].type === "purchasable_item" ? orderItems[0].id : null,
          points_spent: totalPointsCost,
          payment_method: "points",
          status: requiresShipping ? "pending" : "processing",
          is_gift: isGift || false,
          recipient_user_id: recipientUserId || null,
          gift_message: giftMessage || null,
          ...(shippingAddress && {
            shipping_name: shippingAddress.name,
            shipping_address: shippingAddress.address,
            shipping_city: shippingAddress.city,
            shipping_state: shippingAddress.state,
            shipping_zip: shippingAddress.zip,
            shipping_country: shippingAddress.country,
          }),
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", orderError);
        return NextResponse.json(
          { success: false, msg: "Failed to create order" },
          { status: 500 }
        );
      }

      // Deduct points
      await adminSupabase
        .from("users")
        .update({ points_balance: newBalance })
        .eq("id", user.id);

      // Create point transaction
      await adminSupabase.from("point_transactions").insert({
        user_id: user.id,
        amount: -totalPointsCost,
        balance_after: newBalance,
        transaction_type: "redemption",
        description: `Purchased: ${orderItems.map((i) => i.name).join(", ")}`,
        reference_id: order.id,
        reference_type: "order",
      });

      // Handle digital items - add to inventory
      for (const item of orderItems) {
        if (item.type === "purchasable_item") {
          await grantPurchasableItem(adminSupabase, user.id, item.id, item.quantity, order.id);
        }
      }

      return NextResponse.json({
        success: true,
        msg: "Order completed successfully",
        data: {
          orderId: order.id,
          pointsSpent: totalPointsCost,
          newBalance,
        },
      });
    } else if (paymentMethod === "stripe" || paymentMethod === "both") {
      // Stripe payment required
      if (!isStripeConfigured()) {
        return NextResponse.json(
          { success: false, msg: "Payment processing not available" },
          { status: 503 }
        );
      }

      if (lineItems.length === 0) {
        return NextResponse.json(
          { success: false, msg: "Items do not have dollar pricing" },
          { status: 400 }
        );
      }

      // For "both" payment method, check points balance
      if (paymentMethod === "both" && userData.points_balance < totalPointsCost) {
        return NextResponse.json(
          {
            success: false,
            msg: "Insufficient points for combined payment",
            data: {
              requiredPoints: totalPointsCost,
              availablePoints: userData.points_balance,
            },
          },
          { status: 400 }
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
        lineItems,
        mode: "payment",
        successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/rewards?canceled=true`,
        clientReferenceId: user.id,
        metadata: {
          user_id: user.id,
          payment_method: paymentMethod,
          points_to_deduct: totalPointsCost.toString(),
          items: JSON.stringify(orderItems.map((i) => ({ type: i.type, id: i.id, qty: i.quantity }))),
          is_gift: isGift ? "true" : "false",
          recipient_user_id: recipientUserId || "",
          gift_message: giftMessage || "",
          shipping: shippingAddress ? JSON.stringify(shippingAddress) : "",
        },
      });

      // Create pending payment record
      await adminSupabase.from("payments").insert({
        user_id: user.id,
        stripe_checkout_session_id: session.id,
        amount_cents: Math.round(totalDollarCost * 100),
        currency: "usd",
        status: "pending",
        payment_type: "one_time",
        description: `Purchase: ${orderItems.map((i) => i.name).join(", ")}`,
        metadata: {
          items: orderItems,
          payment_method: paymentMethod,
          points_to_deduct: totalPointsCost,
        },
      });

      return NextResponse.json({
        success: true,
        msg: "Checkout session created",
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    }

    return NextResponse.json(
      { success: false, msg: "Invalid payment method" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to create checkout session" },
      { status: 500 }
    );
  }
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
        quantity: existing.quantity + itemQuantity,
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
    // Add to user's superlike balance
    await supabase.rpc("increment_user_superlikes", {
      p_user_id: userId,
      p_amount: itemQuantity,
    }).catch(() => {
      // RPC may not exist yet, update directly
      supabase
        .from("users")
        .update({ superlike_balance: supabase.rpc("coalesce", { a: "superlike_balance", b: 0 }) })
        .eq("id", userId);
    });
  } else if (item.item_type === "boost" && item.duration_hours) {
    // Set boost expiration
    const boostExpiry = new Date();
    boostExpiry.setHours(boostExpiry.getHours() + item.duration_hours);
    await supabase
      .from("users")
      .update({ boost_expires_at: boostExpiry.toISOString() })
      .eq("id", userId);
  } else if (item.item_type === "points_pack") {
    // Add points to balance
    const { data: userData } = await supabase
      .from("users")
      .select("points_balance")
      .eq("id", userId)
      .single();

    const currentBalance = userData?.points_balance || 0;
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
