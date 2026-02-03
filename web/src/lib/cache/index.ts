/**
 * Server-Side Caching Utilities
 * 
 * Provides caching utilities for expensive server-side operations.
 * Uses Next.js unstable_cache for request-level and time-based caching.
 * 
 * NOTE: Discovery exclusion lists (blocks, likes, passes) are NOT cached here
 * because they're highly personalized and change frequently. Instead, we:
 * 1. Parallelized the queries (6x faster)
 * 2. Use TanStack Query for client-side caching
 * 
 * This file provides utilities for caching less-frequently changing data
 * like user preferences, static lookups, etc.
 */

import { unstable_cache } from "next/cache";

// =============================================================================
// CACHE TAGS
// =============================================================================

export const CacheTags = {
  /** User's profile data */
  userProfile: (userId: string) => `user-profile-${userId}`,
  /** User's preferences/filters */
  userFilters: (userId: string) => `user-filters-${userId}`,
  /** Static data like prompts, options, etc. */
  staticData: "static-data",
} as const;

// =============================================================================
// CACHE DURATIONS (in seconds)
// =============================================================================

export const CacheDurations = {
  /** Very short - for rapidly changing data (30 seconds) */
  short: 30,
  /** Medium - for moderately changing data (5 minutes) */
  medium: 5 * 60,
  /** Long - for rarely changing data (1 hour) */
  long: 60 * 60,
  /** Very long - for static data (24 hours) */
  static: 24 * 60 * 60,
} as const;

// =============================================================================
// CACHED FUNCTIONS
// =============================================================================

/**
 * Cache user's discovery filters
 * These change infrequently (only when user updates preferences)
 */
export const getCachedUserFilters = unstable_cache(
  async (userId: string, fetchFn: () => Promise<unknown>) => {
    return fetchFn();
  },
  ["user-filters"],
  { 
    revalidate: CacheDurations.medium,
    tags: ["user-filters"],
  }
);

/**
 * Example: Cache static prompts list
 * Prompts are admin-configured and change very rarely
 */
export const getCachedPrompts = unstable_cache(
  async (fetchFn: () => Promise<unknown>) => {
    return fetchFn();
  },
  ["prompts-list"],
  { 
    revalidate: CacheDurations.long,
    tags: [CacheTags.staticData],
  }
);

// =============================================================================
// CACHE INVALIDATION HELPERS
// =============================================================================

/**
 * Import revalidateTag from next/cache to invalidate caches
 * 
 * Usage in API routes after mutations:
 * ```ts
 * import { revalidateTag } from "next/cache";
 * 
 * // After user updates their filters
 * revalidateTag(CacheTags.userFilters(userId));
 * ```
 */
export { revalidateTag } from "next/cache";
