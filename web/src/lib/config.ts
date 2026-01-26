/**
 * Centralized URL Configuration
 * 
 * All URLs should be derived from environment variables.
 * This ensures consistency across the application and makes
 * it easy to switch between environments.
 */

// Base application URL (from environment or localhost fallback)
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Extract domain from APP_URL for display purposes
export const APP_DOMAIN = (() => {
  try {
    return new URL(APP_URL).hostname;
  } catch {
    return 'localhost';
  }
})();

// App name for display
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'RealSingles';

// Cookie name for storing referral codes (shared between server and client)
export const REFERRAL_COOKIE_NAME = "referral_code";
// Cookie expiry in seconds (30 days)
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Generate a referral link for sharing
 * @param code - The user's referral code
 * @returns Full URL for the referral link
 */
export function getReferralLink(code: string): string {
  return `${APP_URL}/join?ref=${encodeURIComponent(code)}`;
}

/**
 * Generate a profile link for sharing
 * @param userId - The user's ID
 * @returns Full URL for the profile
 */
export function getProfileLink(userId: string): string {
  return `${APP_URL}/profile/${userId}`;
}

/**
 * Generate an event link for sharing
 * @param eventId - The event ID
 * @returns Full URL for the event
 */
export function getEventLink(eventId: string): string {
  return `${APP_URL}/events/${eventId}`;
}
