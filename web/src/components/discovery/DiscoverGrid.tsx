"use client";

import { useState, useCallback } from "react";
import { SlidersHorizontal, Heart, Sparkles, MapPin, Loader2, X } from "lucide-react";
import { ProfileCard } from "./ProfileCard";
import { FilterPanel, FilterValues } from "./FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfileCardSkeleton } from "@/components/ui/LoadingSkeleton";
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

interface DiscoverGridProps {
  initialProfiles: Profile[];
}

type ViewMode = "all" | "top-matches" | "nearby";

export function DiscoverGrid({ initialProfiles }: DiscoverGridProps) {
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
      const saveRes = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_age: filters.minAge,
          max_age: filters.maxAge,
          min_height: filters.minHeight,
          max_height: filters.maxHeight,
          max_distance: filters.maxDistance,
          gender: filters.gender,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
          <p className="text-sm text-gray-500 mt-1">
            Find your perfect match
          </p>
        </div>

        {/* View Mode Tabs & Filter Button */}
        <div className="flex items-center gap-3">
          {/* View mode tabs - scrollable on mobile */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 overflow-x-auto">
            <button
              onClick={() => setViewMode("all")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                viewMode === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Sparkles className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setViewMode("top-matches")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                viewMode === "top-matches"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Heart className="w-4 h-4" />
              Top Matches
            </button>
            <button
              onClick={() => setViewMode("nearby")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                viewMode === "nearby"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <MapPin className="w-4 h-4" />
              Nearby
            </button>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            disabled={isFiltering}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-colors shrink-0",
              filtersApplied
                ? "bg-pink-500 text-white hover:bg-pink-600"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50",
              isFiltering && "opacity-50 cursor-not-allowed"
            )}
          >
            {isFiltering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SlidersHorizontal className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {filtersApplied ? "Filters Active" : "Filters"}
            </span>
          </button>

          {/* Clear Filters button */}
          {filtersApplied && (
            <button
              onClick={handleClearFilters}
              disabled={isFiltering}
              className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Grid */}
      {visibleProfiles.length === 0 ? (
        <EmptyState
          type="matches"
          title="No more profiles"
          description="Check back later for new matches or adjust your filters"
          actionLabel="Adjust Filters"
          onAction={() => setIsFilterOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              showActions={true}
              onLike={handleLike}
              onPass={handlePass}
              onSuperLike={handleSuperLike}
              actionLoading={!!profile.user_id && actionLoading === profile.user_id}
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

export function DiscoverGridSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProfileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
