"use client";

/**
 * Discover Page
 * 
 * Single-profile discovery experience for finding matches.
 * Shows one profile at a time with like/pass/super-like actions.
 * 
 * Key behavior:
 * - Like/Pass/SuperLike → API call → auto-advance to next profile
 * - Block/Report → API call → auto-advance to next profile
 * - Share → stay on current profile
 * - Undo → API call → go back to previous profile
 * - Back → navigate to /explore
 * 
 * URL stays as /discover - internal state manages which profile is shown.
 */

import { useDiscoverProfiles } from "@/contexts/DiscoverProfilesContext";
import {
  DiscoverProfileView,
  DiscoverSkeleton,
  DiscoverError,
  NoMoreProfiles,
  IncompleteProfile,
  ProfileNotFound,
  UserInactive,
} from "@/components/discover";

export default function DiscoverPage() {
  const {
    currentProfile,
    isLoading,
    error,
    emptyReason,
    hasMore,
    profiles,
    currentIndex,
  } = useDiscoverProfiles();
  
  // Show loading skeleton while first profile is being fetched
  if (isLoading) {
    return <DiscoverSkeleton />;
  }
  
  // Handle error state
  if (error) {
    return <DiscoverError error={error} />;
  }
  
  // Handle empty states based on reason
  if (emptyReason === "incomplete_profile") {
    return <IncompleteProfile />;
  }
  
  if (emptyReason === "profile_not_found") {
    return <ProfileNotFound />;
  }
  
  if (emptyReason === "user_inactive") {
    return <UserInactive />;
  }
  
  // Check if we've run out of profiles
  if (!currentProfile && !hasMore && profiles.length === 0) {
    return <NoMoreProfiles />;
  }
  
  // Check if we're at the end of the queue with no more to fetch
  if (!currentProfile && currentIndex >= profiles.length && !hasMore) {
    return <NoMoreProfiles />;
  }
  
  // Show skeleton if profile not yet available (edge case during fetch)
  if (!currentProfile) {
    return <DiscoverSkeleton />;
  }
  
  // Render the main discover profile view
  return <DiscoverProfileView />;
}
