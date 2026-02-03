"use client";

/**
 * Discover State Components
 * 
 * Provides UI states for the discover page:
 * - DiscoverSkeleton: Loading shimmer while first profile loads
 * - DiscoverError: Error state with retry button
 * - NoMoreProfiles: Empty state when user has seen all available profiles
 * - IncompleteProfile: Prompts user to complete profile setup
 * - ProfileNotFound: Profile setup required
 * - UserInactive: Account restricted
 */

import { Loader2, RefreshCw, Settings, UserX, Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useDiscoverProfiles } from "@/contexts/DiscoverProfilesContext";

// =============================================================================
// LOADING SKELETON
// =============================================================================

/**
 * Loading skeleton matching SearchProfileView layout
 */
export function DiscoverSkeleton() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900 flex flex-col animate-pulse">
      {/* Centered container for desktop */}
      <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-center md:py-8 md:px-4 md:gap-6 max-w-6xl mx-auto w-full">
        {/* Left Column - Photo placeholder */}
        <div className="relative md:sticky md:top-8 md:w-[400px] md:flex-shrink-0">
          {/* Photo placeholder */}
          <div className="md:rounded-2xl md:overflow-hidden md:shadow-lg dark:shadow-black/30">
            <div className="bg-gray-200 dark:bg-neutral-700 h-[55vh] md:h-[450px]" />
          </div>
          
          {/* Action buttons placeholder - Desktop */}
          <div className="hidden md:flex items-center justify-center gap-3 py-4">
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
          </div>
          
          {/* Info card placeholder - Desktop */}
          <div className="hidden md:block bg-white dark:bg-neutral-950 rounded-2xl shadow-lg dark:shadow-black/30 mt-4 p-5">
            <div className="h-7 bg-gray-200 dark:bg-neutral-700 rounded w-48 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-40" />
          </div>
        </div>
        
        {/* Right Column - Profile details placeholder */}
        <div className="flex-1 bg-white dark:bg-neutral-950 md:rounded-2xl md:shadow-lg dark:md:shadow-black/30 md:max-w-xl">
          <div className="p-5 md:p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-32" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4" />
            <div className="h-20 bg-gray-200 dark:bg-neutral-700 rounded w-full mt-4" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/2 mt-4" />
          </div>
        </div>
      </div>
      
      {/* Mobile Action Bar placeholder */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="flex items-center justify-center gap-4 py-4 px-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ERROR STATE
// =============================================================================

interface DiscoverErrorProps {
  error: string;
}

export function DiscoverError({ error }: DiscoverErrorProps) {
  const { resetState, fetchMoreProfiles } = useDiscoverProfiles();
  
  const handleRetry = async () => {
    resetState();
    await fetchMoreProfiles();
  };
  
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || "We couldn't load profiles. Please try again."}
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 dark:hover:bg-pink-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// NO MORE PROFILES
// =============================================================================

export function NoMoreProfiles() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-950 dark:via-neutral-950 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          You&apos;ve seen everyone!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You&apos;ve viewed all available profiles in your area. Check back later for new people, or try adjusting your filters.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 dark:hover:bg-pink-400 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Explore More
          </Link>
          <Link
            href="/profile/preferences"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-300 rounded-full font-medium border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Adjust Filters
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// INCOMPLETE PROFILE
// =============================================================================

export function IncompleteProfile() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Complete Your Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          To start discovering matches, please set your gender and who you&apos;re looking for in your profile settings.
        </p>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 dark:hover:bg-pink-400 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Edit Profile
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// PROFILE NOT FOUND
// =============================================================================

export function ProfileNotFound() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Profile Setup Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We couldn&apos;t find your profile. Please complete your profile setup to start discovering matches.
        </p>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 dark:hover:bg-pink-400 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Set Up Profile
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// USER INACTIVE
// =============================================================================

interface UserInactiveProps {
  message?: string;
}

export function UserInactive({ message }: UserInactiveProps) {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserX className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Account Restricted
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || "Your account has been restricted. Please contact support for assistance."}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// INITIAL LOADING (with spinner)
// =============================================================================

export function DiscoverLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Finding your next match...</p>
      </div>
    </div>
  );
}

export default DiscoverSkeleton;
