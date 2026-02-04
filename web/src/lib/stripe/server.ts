/**
 * Server-side Stripe utilities
 * 
 * This module provides server-side Stripe client and utilities for:
 * - Creating checkout sessions
 * - Managing subscriptions
 * - Processing webhooks
 * - Handling customer management
 */

import Stripe from "stripe";

// Validate environment variables at module load time
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn(
    "[Stripe] STRIPE_SECRET_KEY not found. Stripe functionality will not work."
  );
}

/**
 * Server-side Stripe client
 * Use this for all server-side Stripe operations
 */
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    })
  : null;

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string;
  existingCustomerId?: string | null;
}): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const { userId, email, name, existingCustomerId } = params;

  // Return existing customer if valid
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return existingCustomerId;
      }
    } catch {
      // Customer doesn't exist, create new one
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for one-time purchase
 */
export async function createCheckoutSession(params: {
  customerId: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  clientReferenceId?: string;
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const {
    customerId,
    lineItems,
    mode,
    successUrl,
    cancelUrl,
    metadata,
    clientReferenceId,
  } = params;

  return stripe.checkout.sessions.create({
    customer: customerId,
    line_items: lineItems,
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    client_reference_id: clientReferenceId,
    // Enable promotion codes
    allow_promotion_codes: true,
    // For subscriptions, allow customer to update payment method
    ...(mode === "subscription" && {
      subscription_data: {
        metadata,
      },
    }),
  });
}

/**
 * Create a Stripe Customer Portal session for subscription management
 */
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a subscription that was set to cancel
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Create a Price object in Stripe for a product
 */
export async function createStripePrice(params: {
  productName: string;
  unitAmountCents: number;
  currency?: string;
  recurring?: {
    interval: "month" | "year";
  };
  metadata?: Record<string, string>;
}): Promise<Stripe.Price> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const { productName, unitAmountCents, currency = "usd", recurring, metadata } = params;

  // Create or reuse product
  const products = await stripe.products.list({ limit: 100 });
  let product = products.data.find((p) => p.name === productName);

  if (!product) {
    product = await stripe.products.create({
      name: productName,
      metadata,
    });
  }

  return stripe.prices.create({
    product: product.id,
    unit_amount: unitAmountCents,
    currency,
    recurring,
    metadata,
  });
}

/**
 * Get a checkout session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer", "subscription"],
    });
  } catch {
    return null;
  }
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return !!stripe;
}
