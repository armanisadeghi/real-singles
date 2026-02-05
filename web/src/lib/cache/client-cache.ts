/**
 * Client-Side Cache Utility
 *
 * PERFORMANCE STANDARDS IMPLEMENTATION
 * See /PERFORMANCE-STANDARDS.md for full requirements
 *
 * This module provides a cache-first data fetching pattern that:
 * - Returns cached data immediately for instant UI rendering
 * - Refreshes data in the background when TTL allows
 * - Reduces network requests and improves perceived performance
 *
 * TTL Guidelines:
 * - User data: 5 minutes (300000ms) - changes occasionally
 * - Static content: 1 hour (3600000ms) - rarely changes
 * - Real-time data: 30 seconds (30000ms) - changes frequently
 */

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type CacheStore = Map<string, CacheEntry<unknown>>;

// =============================================================================
// CACHE STORAGE
// =============================================================================

const cache: CacheStore = new Map();

// =============================================================================
// TTL CONSTANTS (in milliseconds)
// =============================================================================

export const CacheTTL = {
  /** Very short - for real-time data (30 seconds) */
  realtime: 30 * 1000,
  /** Short - for frequently changing data (2 minutes) */
  short: 2 * 60 * 1000,
  /** Medium - for user data (5 minutes) */
  user: 5 * 60 * 1000,
  /** Long - for moderately changing data (15 minutes) */
  long: 15 * 60 * 1000,
  /** Very long - for static content (1 hour) */
  static: 60 * 60 * 1000,
} as const;

// =============================================================================
// CACHE FUNCTIONS
// =============================================================================

/**
 * Get data with cache-first strategy
 *
 * ALWAYS serves cached data first for instant UI, then refreshes in background
 *
 * @param key - Unique cache key
 * @param fetchFn - Function that fetches fresh data
 * @param ttl - Time-to-live in milliseconds (default: 5 minutes)
 * @returns Cached or fresh data
 *
 * @example
 * ```ts
 * const userData = await getCachedData(
 *   `user-${userId}`,
 *   () => fetchUser(userId),
 *   CacheTTL.user
 * );
 * ```
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.user
): Promise<T> {
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && Date.now() - cached.timestamp < ttl) {
    // Return cached immediately, refresh in background
    fetchFn()
      .then(data => {
        cache.set(key, { data, timestamp: Date.now() });
      })
      .catch(error => {
        console.warn(`Background refresh failed for ${key}:`, error);
      });
    return cached.data;
  }

  // No cache or expired - fetch fresh
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Get data with stale-while-revalidate strategy
 *
 * Similar to getCachedData but with more control over stale data handling
 *
 * @param key - Unique cache key
 * @param fetchFn - Function that fetches fresh data
 * @param options - Configuration options
 * @returns Object with data, isStale flag, and refresh function
 */
export async function getStaleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    staleTime?: number;
  } = {}
): Promise<{ data: T; isStale: boolean; refresh: () => Promise<T> }> {
  const { ttl = CacheTTL.user, staleTime = ttl * 2 } = options;
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  const refresh = async (): Promise<T> => {
    const data = await fetchFn();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  };

  if (cached) {
    const age = now - cached.timestamp;
    const isStale = age >= ttl;
    const isExpired = age >= staleTime;

    if (isExpired) {
      // Data is too old, must fetch fresh
      const data = await refresh();
      return { data, isStale: false, refresh };
    }

    if (isStale) {
      // Return stale data, refresh in background
      refresh().catch(console.warn);
    }

    return { data: cached.data, isStale, refresh };
  }

  // No cache - fetch fresh
  const data = await refresh();
  return { data, isStale: false, refresh };
}

/**
 * Set data in cache manually
 *
 * @param key - Unique cache key
 * @param data - Data to cache
 */
export function setCacheData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get cached data without fetching
 *
 * @param key - Unique cache key
 * @returns Cached data or undefined
 */
export function getCached<T>(key: string): T | undefined {
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  return cached?.data;
}

/**
 * Check if cache entry exists and is valid
 *
 * @param key - Unique cache key
 * @param ttl - Time-to-live in milliseconds
 * @returns True if cache is valid
 */
export function isCacheValid(key: string, ttl: number = CacheTTL.user): boolean {
  const cached = cache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < ttl;
}

/**
 * Invalidate a specific cache entry
 *
 * @param key - Unique cache key
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a pattern
 *
 * @param pattern - String pattern to match (prefix matching)
 */
export function invalidateCachePattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats for debugging
 *
 * @returns Cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  entries: Array<{ key: string; age: number }>;
} {
  const now = Date.now();
  const entries: Array<{ key: string; age: number }> = [];

  for (const [key, entry] of cache.entries()) {
    entries.push({
      key,
      age: Math.round((now - entry.timestamp) / 1000),
    });
  }

  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    entries,
  };
}

// =============================================================================
// CACHE KEYS FACTORY
// =============================================================================

/**
 * Standardized cache key generators
 *
 * Use these to ensure consistent cache keys across the application
 */
export const CacheKeys = {
  /** Current user profile */
  currentUser: () => "current-user",
  /** User profile by ID */
  userProfile: (userId: string) => `user-profile-${userId}`,
  /** User filters/preferences */
  userFilters: (userId: string) => `user-filters-${userId}`,
  /** Conversations list */
  conversations: (userId: string) => `conversations-${userId}`,
  /** Matches list */
  matches: (userId: string) => `matches-${userId}`,
  /** Notifications */
  notifications: (userId: string) => `notifications-${userId}`,
  /** Events list */
  events: () => "events",
  /** Products list */
  products: () => "products",
  /** Discovery profiles */
  discovery: (userId: string) => `discovery-${userId}`,
} as const;
