"use client";

/**
 * AppProviders - Client-side providers for authenticated app section
 * 
 * This component wraps the authenticated (app) routes and provides:
 * - TanStack Query for client-side caching and request deduplication
 * - DiscoverProfilesProvider with lazy-loaded first profile
 * - User context for current user data
 * 
 * Separated from root Providers because it requires authenticated user context
 * that's only available in the (app) layout.
 */

import { createContext, useContext, type ReactNode } from "react";
import { 
  DiscoverProfilesProvider,
  type DiscoverProfile,
} from "@/contexts/DiscoverProfilesContext";
import { QueryProvider } from "./QueryProvider";

// =============================================================================
// CURRENT USER CONTEXT
// =============================================================================

export interface CurrentUser {
  id: string;
  displayName: string;
  profileImage: string;
  points: number;
}

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function useCurrentUser(): CurrentUser | null {
  return useContext(CurrentUserContext);
}

// =============================================================================
// APP PROVIDERS
// =============================================================================

type DiscoverEmptyReason = "incomplete_profile" | "no_matches" | "profile_not_found" | "user_inactive" | null;

interface AppProvidersProps {
  children: ReactNode;
  /** Current authenticated user */
  currentUser: CurrentUser;
  /** First discover profile fetched via SSR for instant display */
  initialDiscoverProfile?: DiscoverProfile | null;
  /** Reason for empty state if no initial profile */
  initialDiscoverEmptyReason?: DiscoverEmptyReason;
  /** If true, will fetch discover profiles on demand instead of requiring SSR profile */
  lazyLoadDiscover?: boolean;
}

export function AppProviders({
  children,
  currentUser,
  initialDiscoverProfile,
  initialDiscoverEmptyReason,
  lazyLoadDiscover = false,
}: AppProvidersProps) {
  return (
    <QueryProvider>
      <CurrentUserContext.Provider value={currentUser}>
        <DiscoverProfilesProvider
          initialProfile={initialDiscoverProfile}
          initialEmptyReason={initialDiscoverEmptyReason}
          lazyLoad={lazyLoadDiscover}
        >
          {children}
        </DiscoverProfilesProvider>
      </CurrentUserContext.Provider>
    </QueryProvider>
  );
}
