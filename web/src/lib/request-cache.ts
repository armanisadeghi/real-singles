/**
 * Request Deduplication Utility
 *
 * PERFORMANCE STANDARDS IMPLEMENTATION
 * See /PERFORMANCE-STANDARDS.md for full requirements
 *
 * This module prevents duplicate concurrent requests by:
 * - Tracking in-flight requests by key
 * - Returning the same Promise for duplicate requests
 * - Automatically cleaning up after request completion
 *
 * Use Cases:
 * - Multiple components fetching the same data simultaneously
 * - Rapid user interactions triggering redundant API calls
 * - SSR/hydration scenarios with overlapping requests
 */

// =============================================================================
// TYPES
// =============================================================================

type PendingRequest<T> = Promise<T>;

// =============================================================================
// REQUEST STORE
// =============================================================================

const pendingRequests = new Map<string, PendingRequest<unknown>>();

// =============================================================================
// DEDUPLICATION FUNCTIONS
// =============================================================================

/**
 * Execute a request with automatic deduplication
 *
 * If a request with the same key is already in-flight, returns the existing Promise.
 * Otherwise, starts a new request and tracks it until completion.
 *
 * @param key - Unique request identifier
 * @param fn - Function that performs the actual request
 * @returns Promise that resolves to the request result
 *
 * @example
 * ```ts
 * // Multiple calls with same key will share one request
 * const [user1, user2] = await Promise.all([
 *   dedupedRequest(`user-${userId}`, () => fetchUser(userId)),
 *   dedupedRequest(`user-${userId}`, () => fetchUser(userId)),
 * ]);
 * // Only ONE API call is made!
 * ```
 */
export async function dedupedRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check for existing in-flight request
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  // Start new request and track it
  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Execute a request with deduplication and timeout
 *
 * Same as dedupedRequest but with configurable timeout
 *
 * @param key - Unique request identifier
 * @param fn - Function that performs the actual request
 * @param timeoutMs - Request timeout in milliseconds (default: 30000)
 * @returns Promise that resolves to the request result
 */
export async function dedupedRequestWithTimeout<T>(
  key: string,
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      pendingRequests.delete(key);
      reject(new Error(`Request timeout: ${key}`));
    }, timeoutMs);
  });

  return Promise.race([
    dedupedRequest(key, fn),
    timeoutPromise,
  ]);
}

/**
 * Check if a request is currently in-flight
 *
 * @param key - Unique request identifier
 * @returns True if request is pending
 */
export function isRequestPending(key: string): boolean {
  return pendingRequests.has(key);
}

/**
 * Cancel a pending request (removes from tracking)
 *
 * Note: This doesn't actually cancel the underlying fetch,
 * it just removes it from the deduplication map so new requests
 * won't share the pending Promise.
 *
 * @param key - Unique request identifier
 */
export function cancelPendingRequest(key: string): void {
  pendingRequests.delete(key);
}

/**
 * Clear all pending request tracking
 *
 * Use with caution - typically only needed for cleanup in tests
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Get count of pending requests (for debugging)
 *
 * @returns Number of in-flight requests
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}

/**
 * Get list of pending request keys (for debugging)
 *
 * @returns Array of pending request keys
 */
export function getPendingRequestKeys(): string[] {
  return Array.from(pendingRequests.keys());
}

// =============================================================================
// REQUEST KEY GENERATORS
// =============================================================================

/**
 * Standardized request key generators
 *
 * Use these to ensure consistent deduplication keys across the application
 */
export const RequestKeys = {
  /** User profile fetch */
  userProfile: (userId: string) => `req:user-profile:${userId}`,
  /** Current user fetch */
  currentUser: () => "req:current-user",
  /** Conversations list fetch */
  conversations: (userId: string) => `req:conversations:${userId}`,
  /** Matches list fetch */
  matches: (userId: string) => `req:matches:${userId}`,
  /** Notifications fetch */
  notifications: (userId: string) => `req:notifications:${userId}`,
  /** Events list fetch */
  events: () => "req:events",
  /** Discovery profiles fetch */
  discovery: (userId: string, page?: number) =>
    `req:discovery:${userId}${page ? `:${page}` : ""}`,
  /** Generic API endpoint */
  api: (endpoint: string, params?: string) =>
    `req:api:${endpoint}${params ? `:${params}` : ""}`,
} as const;

// =============================================================================
// BATCH REQUEST HELPER
// =============================================================================

/**
 * Batch multiple related requests into a single execution
 *
 * Useful for combining requests that should be made together
 *
 * @param requests - Array of request configs with keys and fetch functions
 * @returns Object with results keyed by request key
 *
 * @example
 * ```ts
 * const results = await batchRequests([
 *   { key: 'user', fn: () => fetchUser() },
 *   { key: 'notifications', fn: () => fetchNotifications() },
 *   { key: 'matches', fn: () => fetchMatches() },
 * ]);
 * // results.user, results.notifications, results.matches
 * ```
 */
export async function batchRequests<T extends Record<string, unknown>>(
  requests: Array<{ key: keyof T; fn: () => Promise<T[keyof T]> }>
): Promise<T> {
  const results = await Promise.all(
    requests.map(({ key, fn }) =>
      dedupedRequest(String(key), fn).then(data => ({ key, data }))
    )
  );

  return results.reduce((acc, { key, data }) => {
    acc[key] = data;
    return acc;
  }, {} as T);
}
