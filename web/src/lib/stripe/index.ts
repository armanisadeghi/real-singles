/**
 * Stripe Integration Module
 * 
 * Server-side exports:
 * - stripe: The Stripe client instance
 * - getOrCreateStripeCustomer: Get or create a customer
 * - createCheckoutSession: Create a checkout session
 * - createCustomerPortalSession: Create a customer portal session
 * - constructWebhookEvent: Verify webhook signatures
 * 
 * Client-side exports (from './client'):
 * - getStripe: Get the Stripe.js client
 * - redirectToCheckout: Redirect to Stripe Checkout
 */

// Re-export server utilities
export {
  stripe,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createCustomerPortalSession,
  getSubscription,
  cancelSubscriptionAtPeriodEnd,
  resumeSubscription,
  constructWebhookEvent,
  createStripePrice,
  getCheckoutSession,
  isStripeConfigured,
} from "./server";

// Types
export type { Stripe } from "stripe";
