/**
 * Discovery Service - SSOT for User Discovery/Matching
 * 
 * This service provides the single source of truth for:
 * 1. Getting discoverable candidates (profiles that can be shown in discovery)
 * 2. Getting mutual matches (both users liked each other)
 * 3. Getting likes received (users who liked the current user)
 * 
 * All discovery endpoints MUST use these functions to ensure consistent filtering.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { DbProfile, DbUserFilters } from "@/types/db";

// =============================================================================
// TYPES
// =============================================================================

export interface UserProfileContext {
  userId: string;
  gender: string | null;
  lookingFor: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DiscoveryFilters {
  // Age filters
  minAge?: number;
  maxAge?: number;
  // Height filters (in inches)
  minHeight?: number;
  maxHeight?: number;
  // Distance filter (in miles)
  maxDistanceMiles?: number;
  // Preference filters
  bodyTypes?: string[];
  ethnicities?: string[];
  religions?: string[];
  educationLevels?: string[];
  zodiacSigns?: string[];
  // Lifestyle filters
  smoking?: string;
  drinking?: string;
  marijuana?: string;
  hasKids?: string;
  wantsKids?: string;
}

export interface DiscoveryOptions {
  userProfile: UserProfileContext;
  filters?: DiscoveryFilters;
  pagination?: { limit: number; offset: number };
  /** Include debug statistics (admin only) */
  includeDebugInfo?: boolean;
  /** Sort order - default is 'recent' */
  sortBy?: "recent" | "distance" | "random";
}

export interface DiscoveryDebugInfo {
  totalProfilesInDb: number;
  excludedBySelf: number;
  excludedByGender: number;
  excludedByBidirectional: number;
  excludedByEligibility: number;
  excludedByUserActions: number;
  excludedByTargetActions: number;
  excludedByMutualMatch: number;
  excludedByFilters: number;
  finalCount: number;
}

export interface DiscoverableProfile extends DbProfile {
  user?: {
    id: string;
    display_name: string | null;
    status: string | null;
    email: string;
  } | null;
  distance_km?: number;
  is_favorite?: boolean;
  has_liked_me?: boolean;
}

export type DiscoveryEmptyReason =
  | "incomplete_profile" // User hasn't set gender or looking_for
  | "no_matches" // Normal case - just no profiles match criteria
  | "profile_not_found" // User's profile doesn't exist
  | "user_inactive" // User's status is not 'active'
  | null; // Has profiles (not empty)

export interface DiscoveryResult {
  profiles: DiscoverableProfile[];
  total: number;
  debug?: DiscoveryDebugInfo;
  /** Reason why profiles array is empty (null if not empty) */
  emptyReason?: DiscoveryEmptyReason;
}

export interface MutualMatch {
  userId: string;
  profile: DbProfile;
  user: {
    id: string;
    display_name: string | null;
    status: string | null;
    email: string;
  } | null;
  matchedAt: string;
  conversationId?: string;
  primaryPhoto?: string;
}

export interface LikeReceived {
  userId: string;
  profile: DbProfile;
  user: {
    id: string;
    display_name: string | null;
    status: string | null;
  } | null;
  action: "like" | "super_like";
  likedAt: string;
  primaryPhoto?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert miles to kilometers
 */
function milesToKm(miles: number): number {
  return miles * 1.60934;
}

// =============================================================================
// MAIN DISCOVERY FUNCTION
// =============================================================================

/**
 * Get discoverable candidates - SSOT function for all discovery endpoints
 * 
 * This function applies ALL core filtering rules:
 * 1. Bidirectional gender match
 * 2. Profile eligibility (can_start_matching, not hidden, not suspended)
 * 3. Exclude users current user has acted on (liked, passed, blocked)
 * 4. Exclude users who have passed or blocked current user
 * 5. Exclude mutual matches (both liked each other)
 * 6. Apply optional preference filters
 */
export async function getDiscoverableCandidates(
  supabase: SupabaseClient<Database>,
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const { userProfile, filters, pagination, includeDebugInfo, sortBy = "recent" } = options;
  const limit = pagination?.limit ?? 40;
  const offset = pagination?.offset ?? 0;

  // Validate user has required profile data
  if (!userProfile.gender || !userProfile.lookingFor || userProfile.lookingFor.length === 0) {
    return {
      profiles: [],
      total: 0,
      emptyReason: "incomplete_profile",
      debug: includeDebugInfo ? {
        totalProfilesInDb: 0,
        excludedBySelf: 0,
        excludedByGender: 0,
        excludedByBidirectional: 0,
        excludedByEligibility: 0,
        excludedByUserActions: 0,
        excludedByTargetActions: 0,
        excludedByMutualMatch: 0,
        excludedByFilters: 0,
        finalCount: 0,
      } : undefined,
    };
  }

  // ==========================================================================
  // STEP 1: Get exclusion lists (blocks, passes, likes, mutual matches)
  // All queries are PARALLELIZED for ~6x faster execution
  // ==========================================================================

  const [
    blockedByMeResult,
    blockedMeResult,
    myActionsResult,
    unmatchedUsersResult,
    passedOnMeResult,
    likedMeResult,
    myLikesResult,
    favoritesResult,
  ] = await Promise.all([
    // Get users current user has blocked
    supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userProfile.userId),
    
    // Get users who have blocked current user
    supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocked_id", userProfile.userId),

    // Get all users current user has acted on (like, pass, super_like)
    // Excludes unmatched users to prevent rediscovery
    supabase
      .from("matches")
      .select("target_user_id")
      .eq("user_id", userProfile.userId)
      .eq("is_unmatched", false),

    // Get users who have unmatched with current user (bidirectional unmatch history)
    supabase
      .from("matches")
      .select("target_user_id, user_id")
      .or(
        `and(user_id.eq.${userProfile.userId},is_unmatched.eq.true),and(target_user_id.eq.${userProfile.userId},is_unmatched.eq.true)`
      ),

    // Get users who have PASSED on current user (they rejected us)
    supabase
      .from("matches")
      .select("user_id")
      .eq("target_user_id", userProfile.userId)
      .eq("action", "pass")
      .eq("is_unmatched", false),

    // Get users who have LIKED current user (for "has_liked_me" flag and mutual detection)
    supabase
      .from("matches")
      .select("user_id, action")
      .eq("target_user_id", userProfile.userId)
      .in("action", ["like", "super_like"])
      .eq("is_unmatched", false),

    // Get my likes (for mutual match detection)
    supabase
      .from("matches")
      .select("target_user_id")
      .eq("user_id", userProfile.userId)
      .in("action", ["like", "super_like"])
      .eq("is_unmatched", false),

    // Get favorites for marking
    supabase
      .from("favorites")
      .select("favorite_user_id")
      .eq("user_id", userProfile.userId),
  ]);

  // Extract data from results
  const blockedByMe = blockedByMeResult.data;
  const blockedMe = blockedMeResult.data;
  const myActions = myActionsResult.data;
  const unmatchedUsers = unmatchedUsersResult.data;
  const passedOnMe = passedOnMeResult.data;
  const likedMe = likedMeResult.data;
  const myLikes = myLikesResult.data;
  const favorites = favoritesResult.data;

  // Build exclusion sets
  const blockedIds = new Set<string>([
    ...(blockedByMe?.map(b => b.blocked_id).filter((id): id is string => id !== null) || []),
    ...(blockedMe?.map(b => b.blocker_id).filter((id): id is string => id !== null) || []),
  ]);

  // Build unmatch exclusion set (users with unmatch history in either direction)
  const unmatchedIds = new Set<string>();
  if (unmatchedUsers) {
    for (const record of unmatchedUsers) {
      if (record.user_id === userProfile.userId && record.target_user_id) {
        unmatchedIds.add(record.target_user_id);
      } else if (record.target_user_id === userProfile.userId && record.user_id) {
        unmatchedIds.add(record.user_id);
      }
    }
  }

  const actedOnIds = new Set<string>(
    myActions?.map(m => m.target_user_id).filter((id): id is string => id !== null) || []
  );

  const passedOnMeIds = new Set<string>(
    passedOnMe?.map(m => m.user_id).filter((id): id is string => id !== null) || []
  );

  const likedMeMap = new Map<string, string>(
    likedMe?.map(m => [m.user_id!, m.action]) || []
  );

  const myLikedIds = new Set<string>(
    myLikes?.map(m => m.target_user_id).filter((id): id is string => id !== null) || []
  );

  const mutualMatchIds = new Set<string>();
  for (const [userId] of likedMeMap) {
    if (myLikedIds.has(userId)) {
      mutualMatchIds.add(userId);
    }
  }

  // Combine all exclusions (including unmatched users to prevent rediscovery)
  const allExcludeIds = new Set<string>([
    userProfile.userId, // Exclude self
    ...blockedIds,
    ...actedOnIds,
    ...passedOnMeIds,
    ...unmatchedIds, // Prevent rediscovery of unmatched users
    // Note: mutualMatchIds are already in actedOnIds (since I liked them)
  ]);

  const favoriteIds = new Set<string>(
    favorites?.map(f => f.favorite_user_id).filter((id): id is string => id !== null) || []
  );

  // ==========================================================================
  // STEP 2: Build the main query with all filters
  // ==========================================================================

  let query = supabase
    .from("profiles")
    .select(`
      *,
      users!inner(id, display_name, status, email)
    `, { count: "exact" })
    // Profile eligibility
    .eq("can_start_matching", true)
    .eq("profile_hidden", false)
    // User status filter
    .not("users.status", "in", '("suspended","deleted")');

  // Bidirectional gender match
  // 1. Current user's looking_for includes target's gender
  query = query.in("gender", userProfile.lookingFor);

  // 2. Target's looking_for includes current user's gender
  // This uses the PostgreSQL array contains operator
  query = query.contains("looking_for", [userProfile.gender]);

  // Exclude all the users we've identified
  if (allExcludeIds.size > 0) {
    query = query.not("user_id", "in", `(${Array.from(allExcludeIds).join(",")})`);
  }

  // ==========================================================================
  // STEP 3: Apply optional preference filters
  // ==========================================================================

  if (filters) {
    // Age filters
    if (filters.minAge || filters.maxAge) {
      const today = new Date();
      if (filters.maxAge) {
        const minDate = new Date(today.getFullYear() - filters.maxAge - 1, today.getMonth(), today.getDate());
        query = query.gte("date_of_birth", minDate.toISOString().split("T")[0]);
      }
      if (filters.minAge) {
        const maxDate = new Date(today.getFullYear() - filters.minAge, today.getMonth(), today.getDate());
        query = query.lte("date_of_birth", maxDate.toISOString().split("T")[0]);
      }
    }

    // Height filters
    if (filters.minHeight) {
      query = query.gte("height_inches", filters.minHeight);
    }
    if (filters.maxHeight) {
      query = query.lte("height_inches", filters.maxHeight);
    }

    // Array-based filters
    if (filters.bodyTypes && filters.bodyTypes.length > 0) {
      query = query.in("body_type", filters.bodyTypes);
    }
    if (filters.ethnicities && filters.ethnicities.length > 0) {
      query = query.overlaps("ethnicity", filters.ethnicities);
    }
    if (filters.religions && filters.religions.length > 0) {
      query = query.in("religion", filters.religions);
    }
    if (filters.educationLevels && filters.educationLevels.length > 0) {
      query = query.in("education", filters.educationLevels);
    }
    if (filters.zodiacSigns && filters.zodiacSigns.length > 0) {
      query = query.in("zodiac_sign", filters.zodiacSigns);
    }

    // Lifestyle filters
    if (filters.smoking) {
      query = query.eq("smoking", filters.smoking);
    }
    if (filters.drinking) {
      query = query.eq("drinking", filters.drinking);
    }
    if (filters.marijuana) {
      query = query.eq("marijuana", filters.marijuana);
    }
    if (filters.hasKids && filters.hasKids !== "any") {
      query = query.eq("has_kids", filters.hasKids);
    }
    if (filters.wantsKids && filters.wantsKids !== "any") {
      query = query.eq("wants_kids", filters.wantsKids);
    }
  }

  // ==========================================================================
  // STEP 4: Apply sorting and pagination
  // ==========================================================================

  switch (sortBy) {
    case "distance":
      // For distance sort, we'll handle it post-query since Supabase doesn't have native geo-sort
      query = query.order("updated_at", { ascending: false });
      break;
    case "random":
      // Random is not directly supported, use updated_at for now
      // In production, consider using a random seed column
      query = query.order("updated_at", { ascending: false });
      break;
    case "recent":
    default:
      query = query.order("updated_at", { ascending: false });
      break;
  }

  // Fetch more than needed for distance filtering if we have location constraints
  const fetchLimit = filters?.maxDistanceMiles && userProfile.latitude && userProfile.longitude
    ? Math.min(limit * 3, 300) // Fetch 3x for distance filtering buffer
    : limit;

  query = query.range(offset, offset + fetchLimit - 1);

  // ==========================================================================
  // STEP 5: Execute query and process results
  // ==========================================================================

  const { data: profiles, count, error } = await query;

  if (error) {
    console.error("Discovery query error:", error);
    throw new Error(`Failed to fetch discoverable profiles: ${error.message}`);
  }

  // Process profiles: add distance, favorites, has_liked_me flags
  let processedProfiles: DiscoverableProfile[] = (profiles || []).map(profile => {
    const processed: DiscoverableProfile = {
      ...profile,
      user: Array.isArray(profile.users) ? profile.users[0] : profile.users,
      is_favorite: profile.user_id ? favoriteIds.has(profile.user_id) : false,
      has_liked_me: profile.user_id ? likedMeMap.has(profile.user_id) : false,
    };

    // Calculate distance if we have coordinates
    if (
      userProfile.latitude &&
      userProfile.longitude &&
      profile.latitude &&
      profile.longitude
    ) {
      processed.distance_km = Math.round(
        calculateDistanceKm(
          userProfile.latitude,
          userProfile.longitude,
          profile.latitude,
          profile.longitude
        ) * 10
      ) / 10;
    }

    return processed;
  });

  // Apply distance filter if specified
  if (filters?.maxDistanceMiles && userProfile.latitude && userProfile.longitude) {
    const maxDistanceKm = milesToKm(filters.maxDistanceMiles);
    processedProfiles = processedProfiles.filter(
      p => p.distance_km === undefined || p.distance_km <= maxDistanceKm
    );
  }

  // Sort by distance if requested
  if (sortBy === "distance") {
    processedProfiles.sort((a, b) => {
      if (a.distance_km === undefined) return 1;
      if (b.distance_km === undefined) return -1;
      return a.distance_km - b.distance_km;
    });
  }

  // Apply final pagination (in case we over-fetched for distance filtering)
  const finalProfiles = processedProfiles.slice(0, limit);

  // ==========================================================================
  // STEP 6: Build debug info if requested
  // ==========================================================================

  let debugInfo: DiscoveryDebugInfo | undefined;
  
  if (includeDebugInfo) {
    // Get total profiles count
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    debugInfo = {
      totalProfilesInDb: totalCount || 0,
      excludedBySelf: 1,
      excludedByGender: 0, // Would need additional queries to calculate
      excludedByBidirectional: 0, // Would need additional queries to calculate
      excludedByEligibility: 0, // Would need additional queries to calculate
      excludedByUserActions: actedOnIds.size,
      excludedByTargetActions: passedOnMeIds.size + blockedIds.size,
      excludedByMutualMatch: mutualMatchIds.size,
      excludedByFilters: 0, // Would need additional queries to calculate
      finalCount: finalProfiles.length,
    };
  }

  return {
    profiles: finalProfiles,
    total: count || finalProfiles.length,
    emptyReason: finalProfiles.length === 0 ? "no_matches" : null,
    debug: debugInfo,
  };
}

// =============================================================================
// MUTUAL MATCHES FUNCTION
// =============================================================================

/**
 * Get mutual matches - users where both have liked each other
 */
export async function getMutualMatches(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MutualMatch[]> {
  // Get users I've liked (excluding unmatched)
  const { data: myLikes } = await supabase
    .from("matches")
    .select("target_user_id, created_at")
    .eq("user_id", userId)
    .in("action", ["like", "super_like"])
    .eq("is_unmatched", false);

  if (!myLikes || myLikes.length === 0) {
    return [];
  }

  const myLikedIds = myLikes
    .map(m => m.target_user_id)
    .filter((id): id is string => id !== null);

  if (myLikedIds.length === 0) {
    return [];
  }

  // Get users who have also liked me back (excluding unmatched)
  const { data: theyLikedMe } = await supabase
    .from("matches")
    .select("user_id, created_at")
    .eq("target_user_id", userId)
    .in("user_id", myLikedIds)
    .in("action", ["like", "super_like"])
    .eq("is_unmatched", false);

  if (!theyLikedMe || theyLikedMe.length === 0) {
    return [];
  }

  const mutualUserIds = theyLikedMe
    .map(m => m.user_id)
    .filter((id): id is string => id !== null);

  // Get profiles and user data for mutual matches
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      *,
      users!inner(id, display_name, status, email)
    `)
    .in("user_id", mutualUserIds)
    .eq("profile_hidden", false);

  // Get conversation IDs for these matches
  const { data: conversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("user_id", userId);

  // Build a map of mutual user -> conversation
  const conversationMap = new Map<string, string>();
  if (conversations) {
    for (const conv of conversations) {
      // Check if this conversation involves one of our mutual matches
      const { data: otherParticipants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.conversation_id!)
        .neq("user_id", userId);
      
      for (const other of otherParticipants || []) {
        if (other.user_id && mutualUserIds.includes(other.user_id)) {
          conversationMap.set(other.user_id, conv.conversation_id!);
        }
      }
    }
  }

  // Get primary photos
  const { data: photos } = await supabase
    .from("user_gallery")
    .select("user_id, media_url")
    .in("user_id", mutualUserIds)
    .eq("is_primary", true);

  const photoMap = new Map<string, string>(
    photos?.map(p => [p.user_id!, p.media_url]) || []
  );

  // Build the result
  const mutualMatches: MutualMatch[] = [];
  
  for (const profile of profiles || []) {
    const theirLike = theyLikedMe.find(m => m.user_id === profile.user_id);
    const myLike = myLikes.find(m => m.target_user_id === profile.user_id);
    
    // Match date is the later of the two likes
    const matchDate = new Date(Math.max(
      new Date(theirLike?.created_at || 0).getTime(),
      new Date(myLike?.created_at || 0).getTime()
    )).toISOString();

    mutualMatches.push({
      userId: profile.user_id!,
      profile,
      user: Array.isArray(profile.users) ? profile.users[0] : profile.users,
      matchedAt: matchDate,
      conversationId: profile.user_id ? conversationMap.get(profile.user_id) : undefined,
      primaryPhoto: profile.user_id ? photoMap.get(profile.user_id) : undefined,
    });
  }

  // Sort by match date (most recent first)
  mutualMatches.sort((a, b) => 
    new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
  );

  return mutualMatches;
}

// =============================================================================
// LIKES RECEIVED FUNCTION
// =============================================================================

/**
 * Get likes received - users who have liked the current user but haven't been matched yet
 */
export async function getLikesReceived(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { includeSuperLikes?: boolean; limit?: number; offset?: number }
): Promise<LikeReceived[]> {
  const includeSuperLikes = options?.includeSuperLikes ?? true;
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const actions = includeSuperLikes ? ["like", "super_like"] : ["like"];

  // Get users who have liked me (excluding unmatched)
  const { data: likes } = await supabase
    .from("matches")
    .select("user_id, action, created_at")
    .eq("target_user_id", userId)
    .in("action", actions)
    .eq("is_unmatched", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!likes || likes.length === 0) {
    return [];
  }

  const likerIds = likes
    .map(l => l.user_id)
    .filter((id): id is string => id !== null);

  // Check which of these I've already acted on (to exclude mutual matches and passes)
  const { data: myActions } = await supabase
    .from("matches")
    .select("target_user_id")
    .eq("user_id", userId)
    .in("target_user_id", likerIds)
    .eq("is_unmatched", false);

  const actedOnIds = new Set<string>(
    myActions?.map(m => m.target_user_id).filter((id): id is string => id !== null) || []
  );

  // Filter out users I've already acted on
  const unactedLikes = likes.filter(l => l.user_id && !actedOnIds.has(l.user_id));

  if (unactedLikes.length === 0) {
    return [];
  }

  const unactedLikerIds = unactedLikes
    .map(l => l.user_id)
    .filter((id): id is string => id !== null);

  // Get profiles for these users
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      *,
      users!inner(id, display_name, status)
    `)
    .in("user_id", unactedLikerIds)
    .eq("profile_hidden", false);

  // Get primary photos
  const { data: photos } = await supabase
    .from("user_gallery")
    .select("user_id, media_url")
    .in("user_id", unactedLikerIds)
    .eq("is_primary", true);

  const photoMap = new Map<string, string>(
    photos?.map(p => [p.user_id!, p.media_url]) || []
  );

  // Build the result
  const likesReceived: LikeReceived[] = [];

  for (const like of unactedLikes) {
    const profile = profiles?.find(p => p.user_id === like.user_id);
    if (!profile) continue;

    likesReceived.push({
      userId: profile.user_id!,
      profile,
      user: Array.isArray(profile.users) ? profile.users[0] : profile.users,
      action: like.action as "like" | "super_like",
      likedAt: like.created_at!,
      primaryPhoto: profile.user_id ? photoMap.get(profile.user_id) : undefined,
    });
  }

  // Sort with super_likes first, then by date
  likesReceived.sort((a, b) => {
    if (a.action === "super_like" && b.action !== "super_like") return -1;
    if (a.action !== "super_like" && b.action === "super_like") return 1;
    return new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime();
  });

  return likesReceived;
}

// =============================================================================
// UTILITY FUNCTIONS FOR API ROUTES
// =============================================================================

/**
 * Input type for userFiltersToDiscoveryFilters - only the fields actually used
 * This allows API routes to select only the necessary columns
 */
export type UserFiltersInput = Pick<
  DbUserFilters,
  | "min_age"
  | "max_age"
  | "min_height"
  | "max_height"
  | "max_distance_miles"
  | "body_types"
  | "ethnicities"
  | "religions"
  | "education_levels"
  | "zodiac_signs"
  | "smoking"
  | "drinking"
  | "marijuana"
  | "has_kids"
  | "wants_kids"
>;

/**
 * Convert user filter settings to DiscoveryFilters
 */
export function userFiltersToDiscoveryFilters(userFilters: UserFiltersInput | null): DiscoveryFilters {
  if (!userFilters) return {};

  return {
    minAge: userFilters.min_age ?? undefined,
    maxAge: userFilters.max_age ?? undefined,
    minHeight: userFilters.min_height ?? undefined,
    maxHeight: userFilters.max_height ?? undefined,
    maxDistanceMiles: userFilters.max_distance_miles ?? undefined,
    bodyTypes: userFilters.body_types ?? undefined,
    ethnicities: userFilters.ethnicities ?? undefined,
    religions: userFilters.religions ?? undefined,
    educationLevels: userFilters.education_levels ?? undefined,
    zodiacSigns: userFilters.zodiac_signs ?? undefined,
    smoking: userFilters.smoking ?? undefined,
    drinking: userFilters.drinking ?? undefined,
    marijuana: userFilters.marijuana ?? undefined,
    hasKids: userFilters.has_kids ?? undefined,
    wantsKids: userFilters.wants_kids ?? undefined,
  };
}

export interface ProfileContextResult {
  profile: UserProfileContext | null;
  error?: "profile_not_found" | "user_inactive" | "rls_blocked";
}

/**
 * Get user profile context for discovery
 * Returns profile context and error state for better diagnostics
 */
export async function getUserProfileContext(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserProfileContext | null> {
  const result = await getUserProfileContextWithError(supabase, userId);
  return result.profile;
}

/**
 * Get user profile context with detailed error information
 * Use this when you need to know WHY profile retrieval failed
 */
export async function getUserProfileContextWithError(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfileContextResult> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("gender, looking_for, latitude, longitude")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    // Profile not found could be due to:
    // 1. Profile doesn't exist
    // 2. RLS blocking access (user's status is not 'active')
    // We can't easily distinguish here without admin access, so we return a generic error
    // The API layer should check user status separately if needed
    return {
      profile: null,
      error: "profile_not_found",
    };
  }

  return {
    profile: {
      userId,
      gender: profile.gender,
      lookingFor: profile.looking_for,
      latitude: profile.latitude,
      longitude: profile.longitude,
    },
  };
}
