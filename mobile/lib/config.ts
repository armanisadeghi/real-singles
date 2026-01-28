/**
 * Centralized URL Configuration for Mobile
 * 
 * All URLs should be derived from environment variables.
 * This ensures consistency across the application and makes
 * it easy to switch between environments.
 */

// API URL from environment (includes /api suffix)
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Base application URL (derived from API URL by removing /api)
export const APP_URL = API_URL.replace(/\/api$/, '');

// Extract domain from APP_URL for display purposes
export const APP_DOMAIN = (() => {
  try {
    return new URL(APP_URL).hostname;
  } catch {
    return 'localhost';
  }
})();

// App name for display
export const APP_NAME = 'RealSingles';

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
 * @returns Full URL for the profile (uses web profile view with Favorite/Message)
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

// AsyncStorage key for storing referral code from deep links
export const REFERRAL_CODE_STORAGE_KEY = 'pending_referral_code';
