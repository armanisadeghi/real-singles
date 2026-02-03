"use client";

import { useState, useCallback } from "react";
import { SlidersHorizontal, Heart, Sparkles, MapPin, Loader2, X, PauseCircle } from "lucide-react";
import Link from "next/link";
import { ProfileListItem } from "./ProfileListItem";
import { FilterPanel, FilterValues } from "./FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  user_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  is_verified?: boolean | null;
  height_inches?: number | null;
  interests?: string[] | null;
  user?: {
    display_name?: string | null;
  } | null;
}

interface SearchGridProps {
  initialProfiles: Profile[];
  isProfilePaused?: boolean;
}

type ViewMode = "all" | "top-matches" | "nearby";

export function SearchGrid({ initialProfiles, isProfilePaused = false }: SearchGridProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const [passedProfiles, setPassedProfiles] = useState<Set<string>>(new Set());

  const handleLike = useCallback(async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId, action: "like" }),
      });

      if (res.ok) {
        setLikedProfiles((prev) => new Set([...prev, userId]));
        // Optionally remove from list after action
        setProfiles((prev) => prev.filter((p) => p.user_id && p.user_id !== userId));
      }
    } catch (error) {
      console.error("Error liking profile:", error);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handlePass = useCallback(async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId, action: "pass" }),
      });

      if (res.ok) {
        setPassedProfiles((prev) => new Set([...prev, userId]));
        setProfiles((prev) => prev.filter((p) => p.user_id && p.user_id !== userId));
      }
    } catch (error) {
      console.error("Error passing profile:", error);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleSuperLike = useCallback(async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId, action: "super_like" }),
      });

      if (res.ok) {
        setLikedProfiles((prev) => new Set([...prev, userId]));
        setProfiles((prev) => prev.filter((p) => p.user_id && p.user_id !== userId));
      }
    } catch (error) {
      console.error("Error super liking profile:", error);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleApplyFilters = useCallback(async (filters: FilterValues) => {
    setIsFiltering(true);
    
    try {
      // Save filters to server
      // Note: Gender is NOT included - it comes from user's profile "looking_for" field
      const saveRes = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_age: filters.minAge,
          max_age: filters.maxAge,
          min_height: filters.minHeight,
          max_height: filters.maxHeight,
          max_distance: filters.maxDistance,
          // gender is intentionally excluded - it comes from profile.looking_for
          body_types: filters.bodyType,
          ethnicities: filters.ethnicity,
          religions: filters.religion,
          education_levels: filters.education,
          smoking: filters.smoking,
          drinking: filters.drinking,
          marijuana: filters.marijuana,
          has_kids: filters.hasKids,
          wants_kids: filters.wantsKids,
          zodiac_signs: filters.zodiac,
          marital_status: filters.maritalStatus,
          exercise: filters.exercise,
          political_views: filters.politicalViews,
        }),
      });

      if (!saveRes.ok) {
        console.error("Failed to save filters");
      }

      // Fetch filtered profiles from the discover API
      const discoverRes = await fetch("/api/discover");
      const data = await discoverRes.json();

      if (data.success) {
        // Transform the API response to match our Profile interface
        const transformedProfiles: Profile[] = (data.TopMatch || []).map((p: any) => ({
          id: p.ID || p.id,
          user_id: p.ID || p.id,
          first_name: p.FirstName || p.DisplayName?.split(' ')[0] || '',
          last_name: p.LastName || '',
          date_of_birth: p.DOB || null,
          city: p.City || null,
          state: p.State || null,
          occupation: null,
          bio: p.About || null,
          profile_image_url: p.Image || p.livePicture || null,
          is_verified: p.is_verified || false,
          height_inches: p.Height ? parseInt(p.Height) : null,
          interests: p.Interest ? p.Interest.split(', ') : null,
          user: {
            display_name: p.DisplayName || null,
          },
        }));
        
        setProfiles(transformedProfiles);
        setFiltersApplied(true);
      }
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsFiltering(false);
    }
  }, []);

  const handleClearFilters = useCallback(async () => {
    setIsFiltering(true);
    
    try {
      // Clear filters on server
      await fetch("/api/filters", { method: "DELETE" });
      
      // Reset to initial profiles
      setProfiles(initialProfiles);
      setFiltersApplied(false);
    } catch (error) {
      console.error("Error clearing filters:", error);
    } finally {
      setIsFiltering(false);
    }
  }, [initialProfiles]);

  const visibleProfiles = profiles.filter(
    (p) => p.user_id && !likedProfiles.has(p.user_id) && !passedProfiles.has(p.user_id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Profile Paused Banner */}
      {isProfilePaused && (
        <div className="bg-orange-500 text-white px-4 py-3 rounded-xl mb-6 flex items-center justify-center gap-2">
          <PauseCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            Your profile is paused — you won't appear to others
          </span>
          <Link
            href="/settings"
            className="ml-2 text-sm underline underline-offset-2 hover:no-underline"
          >
            Unpause
          </Link>
        </div>
      )}
      
      {/* Header - View Controls */}
      <div className="flex items-center justify-between gap-3 mb-8">
        {/* View mode tabs */}
        <div className="flex items-center gap-0.5 bg-gray-100/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full p-1 shadow-sm dark:shadow-black/20">
          <button
            onClick={() => setViewMode("all")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
              "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              viewMode === "all"
                ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-black/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Sparkles className="w-4 h-4" />
            All
          </button>
          <button
            onClick={() => setViewMode("top-matches")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
              "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              viewMode === "top-matches"
                ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-black/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Heart className="w-4 h-4" />
            Top
          </button>
          <button
            onClick={() => setViewMode("nearby")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
              "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              viewMode === "nearby"
                ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-black/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <MapPin className="w-4 h-4" />
            Nearby
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            disabled={isFiltering}
            className={cn(
              "flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-full",
              "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              "active:scale-[0.97]",
              filtersApplied
                ? "bg-pink-500 text-white shadow-md shadow-pink-500/25 hover:bg-pink-600"
                : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-400 shadow-sm dark:shadow-black/20 border border-gray-200/80 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-900 dark:hover:text-gray-100",
              isFiltering && "opacity-50 cursor-not-allowed"
            )}
          >
            {isFiltering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SlidersHorizontal className="w-4 h-4" />
            )}
            <span className="hidden sm:inline text-sm font-medium">
              {filtersApplied ? "Filtered" : "Filters"}
            </span>
          </button>

          {filtersApplied && (
            <button
              onClick={handleClearFilters}
              disabled={isFiltering}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full",
                "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-700 dark:hover:text-gray-300",
                "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                "active:scale-[0.95]"
              )}
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Profile List */}
      {visibleProfiles.length === 0 ? (
        <EmptyState
          type="matches"
          title="No more profiles"
          description="Check back later for new matches or adjust your filters"
          actionLabel="Adjust Filters"
          onAction={() => setIsFilterOpen(true)}
        />
      ) : (
        <div className="max-w-2xl mx-auto space-y-3">
          {visibleProfiles.map((profile) => (
            <ProfileListItem
              key={profile.id}
              profile={profile}
              navigateToFocus={true}
            />
          ))}
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
}

export function SearchGridSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="h-11 w-[200px] bg-gray-100 dark:bg-neutral-800 rounded-full animate-pulse" />
        <div className="h-10 w-24 bg-gray-100 dark:bg-neutral-800 rounded-full animate-pulse" />
      </div>
      
      {/* Profile list skeleton */}
      <div className="max-w-2xl mx-auto space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20">
            <div className="w-[72px] h-[72px] bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-100 dark:bg-neutral-800 rounded-full animate-pulse" />
                <div className="h-5 w-12 bg-gray-100 dark:bg-neutral-800 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
