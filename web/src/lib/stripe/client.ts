/**
 * Client-side Stripe utilities
 * 
 * This module provides the Stripe.js client for:
 * - Redirecting to Checkout
 * - Loading Stripe Elements
 * - Client-side payment handling
 */

"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe.js client
 * Lazy-loads Stripe.js only when needed
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.warn("[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found");
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
}

/**
 * Redirect to Stripe Checkout
 * 
 * Modern Stripe.js no longer has redirectToCheckout().
 * Pass the checkout session URL from your API response.
 */
export function redirectToCheckout(checkoutUrl: string): void {
  if (!checkoutUrl) {
    throw new Error("Checkout URL is required");
  }
  
  window.location.href = checkoutUrl;
}

/**
 * Check if Stripe is configured on the client
 */
export function isStripeConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
