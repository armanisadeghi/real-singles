"use client";

/**
 * DiscoverProfilesContext
 * 
 * Global state management for the single-profile discovery view.
 * 
 * Key features:
 * - SSR-initialized with first profile for instant display
 * - Smart background fetching when queue runs low
 * - No redundant API calls (tracks seen/fetched profiles)
 * - Survives navigation within the app
 * - Supports undo (go back to previous profile)
 * 
 * Usage:
 * 1. Wrap app with DiscoverProfilesProvider (in Providers.tsx)
 * 2. Pass initialProfile from SSR layout
 * 3. Use useDiscoverProfiles() hook in components
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface DiscoverProfile {
  id: string;
  user_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  is_verified?: boolean | null;
  height_inches?: number | null;
  body_type?: string | null;
  zodiac_sign?: string | null;
  interests?: string[] | null;
  education?: string | null;
  religion?: string | null;
  ethnicity?: string[] | null;
  languages?: string[] | null;
  has_kids?: string | null;
  wants_kids?: string | null;
  pets?: string[] | null;
  smoking?: string | null;
  drinking?: string | null;
  marijuana?: string | null;
  distance_km?: number | null;
  ideal_first_date?: string | null;
  non_negotiables?: string | null;
  way_to_heart?: string | null;
  craziest_travel_story?: string | null;
  worst_job?: string | null;
  dream_job?: string | null;
  after_work?: string | null;
  weirdest_gift?: string | null;
  pet_peeves?: string | null;
  nightclub_or_home?: string | null;
  past_event?: string | null;
  voice_prompt_url?: string | null;
  voice_prompt_duration_seconds?: number | null;
  video_intro_url?: string | null;
  video_intro_duration_seconds?: number | null;
  user?: {
    display_name?: string | null;
    status?: string | null;
  } | null;
}

interface DiscoverProfilesState {
  /** Queue of profiles to show */
  profiles: DiscoverProfile[];
  /** Current position in the queue (0-indexed) */
  currentIndex: number;
  /** IDs of profiles we've fetched (to avoid duplicates) */
  fetchedIds: Set<string>;
  /** Current offset for pagination */
  offset: number;
  /** True during initial load (before first profile is available) */
  isLoading: boolean;
  /** True when fetching more profiles in background */
  isFetching: boolean;
  /** True if server has more profiles */
  hasMore: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Reason for empty state (for appropriate UI) */
  emptyReason: "incomplete_profile" | "no_matches" | "profile_not_found" | "user_inactive" | null;
  /** Whether initialization has happened */
  isInitialized: boolean;
}

interface DiscoverProfilesContextValue extends DiscoverProfilesState {
  /** The current profile to display */
  currentProfile: DiscoverProfile | null;
  /** Advance to the next profile in the queue */
  advanceToNext: () => void;
  /** Go back to the previous profile (for undo) */
  goToPrevious: () => void;
  /** Remove a profile from the queue (after action) */
  removeCurrentProfile: () => void;
  /** Manually trigger fetch for more profiles */
  fetchMoreProfiles: () => Promise<void>;
  /** Initialize with SSR-fetched profile */
  initializeWithProfile: (profile: DiscoverProfile | null) => void;
  /** Reset the entire state (for refresh) */
  resetState: () => void;
}

// =============================================================================
// REDUCER
// =============================================================================

type DiscoverAction =
  | { type: "INITIALIZE"; profile: DiscoverProfile | null; emptyReason?: DiscoverProfilesState["emptyReason"] }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_FETCHING"; isFetching: boolean }
  | { type: "ADD_PROFILES"; profiles: DiscoverProfile[]; hasMore: boolean; offset: number }
  | { type: "ADVANCE_NEXT" }
  | { type: "GO_PREVIOUS" }
  | { type: "REMOVE_CURRENT" }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_EMPTY_REASON"; emptyReason: DiscoverProfilesState["emptyReason"] }
  | { type: "RESET" };

const initialState: DiscoverProfilesState = {
  profiles: [],
  currentIndex: 0,
  fetchedIds: new Set(),
  offset: 0,
  isLoading: true,
  isFetching: false,
  hasMore: true,
  error: null,
  emptyReason: null,
  isInitialized: false,
};

function discoverReducer(state: DiscoverProfilesState, action: DiscoverAction): DiscoverProfilesState {
  switch (action.type) {
    case "INITIALIZE": {
      if (action.profile) {
        const newFetchedIds = new Set(state.fetchedIds);
        if (action.profile.user_id) {
          newFetchedIds.add(action.profile.user_id);
        }
        return {
          ...state,
          profiles: [action.profile],
          currentIndex: 0,
          fetchedIds: newFetchedIds,
          offset: 1,
          isLoading: false,
          isInitialized: true,
          emptyReason: null,
        };
      }
      // No profile - set appropriate empty state
      return {
        ...state,
        profiles: [],
        currentIndex: 0,
        isLoading: false,
        isInitialized: true,
        hasMore: false,
        emptyReason: action.emptyReason || "no_matches",
      };
    }

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    case "SET_FETCHING":
      return { ...state, isFetching: action.isFetching };

    case "ADD_PROFILES": {
      // Filter out any profiles we've already fetched
      const newProfiles = action.profiles.filter(
        (p) => p.user_id && !state.fetchedIds.has(p.user_id)
      );
      
      // Add new IDs to fetchedIds
      const newFetchedIds = new Set(state.fetchedIds);
      newProfiles.forEach((p) => {
        if (p.user_id) newFetchedIds.add(p.user_id);
      });

      return {
        ...state,
        profiles: [...state.profiles, ...newProfiles],
        fetchedIds: newFetchedIds,
        offset: action.offset,
        hasMore: action.hasMore,
        isFetching: false,
      };
    }

    case "ADVANCE_NEXT": {
      const nextIndex = state.currentIndex + 1;
      // Don't advance past the end
      if (nextIndex >= state.profiles.length) {
        return state;
      }
      return {
        ...state,
        currentIndex: nextIndex,
      };
    }

    case "GO_PREVIOUS": {
      const prevIndex = state.currentIndex - 1;
      // Don't go before the start
      if (prevIndex < 0) {
        return state;
      }
      return {
        ...state,
        currentIndex: prevIndex,
      };
    }

    case "REMOVE_CURRENT": {
      // Remove the current profile and stay at same index
      // (which will now show the next profile)
      const newProfiles = [...state.profiles];
      newProfiles.splice(state.currentIndex, 1);
      
      // Adjust index if we removed the last profile
      const newIndex = Math.min(state.currentIndex, newProfiles.length - 1);
      
      return {
        ...state,
        profiles: newProfiles,
        currentIndex: Math.max(0, newIndex),
      };
    }

    case "SET_ERROR":
      return {
        ...state,
        error: action.error,
        isLoading: false,
        isFetching: false,
      };

    case "SET_EMPTY_REASON":
      return {
        ...state,
        emptyReason: action.emptyReason,
      };

    case "RESET":
      return {
        ...initialState,
        isInitialized: false,
      };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const DiscoverProfilesContext = createContext<DiscoverProfilesContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

const BATCH_SIZE = 5;
const LOW_QUEUE_THRESHOLD = 2;

interface DiscoverProfilesProviderProps {
  children: ReactNode;
  /** Profile fetched via SSR for instant first display */
  initialProfile?: DiscoverProfile | null;
  /** Empty reason if no initial profile */
  initialEmptyReason?: DiscoverProfilesState["emptyReason"];
}

export function DiscoverProfilesProvider({
  children,
  initialProfile,
  initialEmptyReason,
}: DiscoverProfilesProviderProps) {
  const [state, dispatch] = useReducer(discoverReducer, initialState);
  
  // Track if we've already initialized to prevent double-init
  const hasInitialized = useRef(false);
  // Track if a fetch is in progress to prevent concurrent fetches
  const fetchInProgress = useRef(false);

  // Initialize with SSR profile on first mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dispatch({ 
        type: "INITIALIZE", 
        profile: initialProfile || null,
        emptyReason: initialEmptyReason,
      });
    }
  }, [initialProfile, initialEmptyReason]);

  // Fetch more profiles from API
  const fetchMoreProfiles = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchInProgress.current || state.isFetching || !state.hasMore) {
      return;
    }

    fetchInProgress.current = true;
    dispatch({ type: "SET_FETCHING", isFetching: true });

    try {
      const response = await fetch(
        `/api/discover/profiles?limit=${BATCH_SIZE}&offset=${state.offset}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch profiles");
      }

      const data = await response.json();

      if (data.emptyReason && data.profiles?.length === 0) {
        dispatch({ type: "SET_EMPTY_REASON", emptyReason: data.emptyReason });
        dispatch({ 
          type: "ADD_PROFILES", 
          profiles: [], 
          hasMore: false, 
          offset: state.offset 
        });
      } else {
        dispatch({
          type: "ADD_PROFILES",
          profiles: data.profiles || [],
          hasMore: (data.profiles?.length || 0) === BATCH_SIZE,
          offset: state.offset + (data.profiles?.length || 0),
        });
      }
    } catch (error) {
      console.error("Failed to fetch discover profiles:", error);
      dispatch({ 
        type: "SET_ERROR", 
        error: error instanceof Error ? error.message : "Failed to load profiles" 
      });
    } finally {
      fetchInProgress.current = false;
    }
  }, [state.offset, state.isFetching, state.hasMore]);

  // Auto-fetch when queue is low
  useEffect(() => {
    if (!state.isInitialized || state.isLoading) {
      return;
    }

    const remainingProfiles = state.profiles.length - state.currentIndex;
    
    // Fetch more if we're running low and haven't exhausted the server
    if (remainingProfiles <= LOW_QUEUE_THRESHOLD && state.hasMore && !state.isFetching) {
      fetchMoreProfiles();
    }
  }, [
    state.currentIndex,
    state.profiles.length,
    state.hasMore,
    state.isFetching,
    state.isInitialized,
    state.isLoading,
    fetchMoreProfiles,
  ]);

  // Advance to next profile
  const advanceToNext = useCallback(() => {
    dispatch({ type: "ADVANCE_NEXT" });
  }, []);

  // Go back to previous profile (for undo)
  const goToPrevious = useCallback(() => {
    dispatch({ type: "GO_PREVIOUS" });
  }, []);

  // Remove current profile from queue
  const removeCurrentProfile = useCallback(() => {
    dispatch({ type: "REMOVE_CURRENT" });
  }, []);

  // Initialize with profile (for SSR hydration)
  const initializeWithProfile = useCallback((profile: DiscoverProfile | null) => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dispatch({ type: "INITIALIZE", profile });
    }
  }, []);

  // Reset entire state
  const resetState = useCallback(() => {
    hasInitialized.current = false;
    fetchInProgress.current = false;
    dispatch({ type: "RESET" });
  }, []);

  // Compute current profile
  const currentProfile = useMemo(() => {
    if (state.profiles.length === 0) return null;
    if (state.currentIndex >= state.profiles.length) return null;
    return state.profiles[state.currentIndex];
  }, [state.profiles, state.currentIndex]);

  const contextValue: DiscoverProfilesContextValue = useMemo(
    () => ({
      ...state,
      currentProfile,
      advanceToNext,
      goToPrevious,
      removeCurrentProfile,
      fetchMoreProfiles,
      initializeWithProfile,
      resetState,
    }),
    [
      state,
      currentProfile,
      advanceToNext,
      goToPrevious,
      removeCurrentProfile,
      fetchMoreProfiles,
      initializeWithProfile,
      resetState,
    ]
  );

  return (
    <DiscoverProfilesContext.Provider value={contextValue}>
      {children}
    </DiscoverProfilesContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useDiscoverProfiles(): DiscoverProfilesContextValue {
  const context = useContext(DiscoverProfilesContext);
  
  if (!context) {
    throw new Error(
      "useDiscoverProfiles must be used within a DiscoverProfilesProvider"
    );
  }
  
  return context;
}

export default DiscoverProfilesContext;
