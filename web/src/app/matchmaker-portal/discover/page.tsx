"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Heart,
  UserPlus,
  Loader2,
  Users,
  MapPin,
  User,
  Check,
  RefreshCw,
} from "lucide-react";
import { useMatchmaker } from "@/contexts/MatchmakerContext";
import { IntroductionModal } from "@/components/matchmaker/IntroductionModal";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  gender: string | null;
  date_of_birth: string | null;
  city: string | null;
  state: string | null;
  is_verified?: boolean | null;
  distance_km?: number;
}

interface Filters {
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  maxDistanceMiles?: number;
  gender?: string[];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MatchmakerDiscoverPage() {
  const { matchmakerId } = useMatchmaker();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const BATCH_SIZE = 30;

  // Fetch profiles from API
  const fetchProfiles = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const currentOffset = reset ? 0 : offset;
        const params = new URLSearchParams();
        params.set("limit", String(BATCH_SIZE));
        params.set("offset", String(currentOffset));

        // Add filters to params
        if (filters.minAge) params.set("min_age", String(filters.minAge));
        if (filters.maxAge) params.set("max_age", String(filters.maxAge));
        if (filters.minHeight)
          params.set("min_height", String(filters.minHeight));
        if (filters.maxHeight)
          params.set("max_height", String(filters.maxHeight));
        if (filters.maxDistanceMiles)
          params.set("max_distance", String(filters.maxDistanceMiles));
        if (filters.gender && filters.gender.length > 0) {
          filters.gender.forEach((g) => params.append("gender", g));
        }

        const response = await fetch(
          `/api/matchmakers/${matchmakerId}/discover?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profiles");
        }

        const data = await response.json();

        if (data.success) {
          const newProfiles = data.profiles || data.data || [];
          if (reset) {
            setProfiles(newProfiles);
            setOffset(newProfiles.length);
          } else {
            setProfiles((prev) => [...prev, ...newProfiles]);
            setOffset(currentOffset + newProfiles.length);
          }
          setHasMore(newProfiles.length === BATCH_SIZE);
        } else {
          throw new Error(data.msg || "Failed to fetch profiles");
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load profiles"
        );
      } finally {
        setLoading(false);
      }
    },
    [matchmakerId, filters, offset, loading]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchProfiles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchmakerId]);

  // Refetch when filters change
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setProfiles([]);
    setOffset(0);
    setHasMore(true);
  };

  // Apply filters (trigger refetch)
  const applyFilters = () => {
    fetchProfiles(true);
  };

  const handleSelectProfile = (profile: Profile) => {
    if (selectedUsers.find((u) => u.user_id === profile.user_id)) {
      // Deselect
      setSelectedUsers(
        selectedUsers.filter((u) => u.user_id !== profile.user_id)
      );
    } else if (selectedUsers.length < 2) {
      // Select (max 2)
      setSelectedUsers([...selectedUsers, profile]);
    }
  };

  const handleCreateIntro = () => {
    if (selectedUsers.length === 2) {
      setShowIntroModal(true);
    }
  };

  const handleIntroSuccess = () => {
    setShowIntroModal(false);
    setSelectedUsers([]);
    // Refresh the list to show updated state
    fetchProfiles(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProfiles(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Discover Profiles
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse profiles and create introductions
            </p>
          </div>
        </div>

        {/* Create Introduction Button */}
        {selectedUsers.length === 2 && (
          <button
            onClick={handleCreateIntro}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg shadow-purple-500/25"
          >
            <Heart className="w-5 h-5" />
            Create Introduction
          </button>
        )}
      </div>

      {/* Selection Indicator */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
              {selectedUsers.length === 1
                ? `Selected: ${selectedUsers[0].first_name || "User"}. Select one more to create an introduction.`
                : `Selected: ${selectedUsers[0].first_name || "User"} & ${selectedUsers[1].first_name || "User"}. Click "Create Introduction" above.`}
            </p>
          </div>
          <button
            onClick={() => setSelectedUsers([])}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Quick Filters */}
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Quick Filters
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Age Range */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Age Range
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="18"
                value={filters.minAge || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    minAge: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <input
                type="number"
                placeholder="99"
                value={filters.maxAge || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    maxAge: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Gender
            </label>
            <select
              value={filters.gender?.[0] || ""}
              onChange={(e) =>
                handleFilterChange({
                  ...filters,
                  gender: e.target.value ? [e.target.value] : undefined,
                })
              }
              className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
            </select>
          </div>

          {/* Max Distance */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Max Distance
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Any"
                value={filters.maxDistanceMiles || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    maxDistanceMiles: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                mi
              </span>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Profiles Grid */}
      {loading && profiles.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Profiles Found
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Try adjusting your filters or click Search to load profiles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.user_id}
              profile={profile}
              isSelected={selectedUsers.some(
                (u) => u.user_id === profile.user_id
              )}
              onSelect={() => handleSelectProfile(profile)}
              selectionDisabled={
                selectedUsers.length >= 2 &&
                !selectedUsers.some((u) => u.user_id === profile.user_id)
              }
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {profiles.length > 0 && hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-muted/50 text-foreground font-medium rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* Introduction Modal */}
      {selectedUsers.length === 2 && (
        <IntroductionModal
          isOpen={showIntroModal}
          onClose={() => setShowIntroModal(false)}
          userA={selectedUsers[0]}
          userB={selectedUsers[1]}
          matchmakerId={matchmakerId}
          onSuccess={handleIntroSuccess}
        />
      )}
    </div>
  );
}

// =============================================================================
// PROFILE CARD
// =============================================================================

function ProfileCard({
  profile,
  isSelected,
  onSelect,
  selectionDisabled,
}: {
  profile: Profile;
  isSelected: boolean;
  onSelect: () => void;
  selectionDisabled: boolean;
}) {
  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.date_of_birth);

  return (
    <div
      onClick={() => !selectionDisabled && onSelect()}
      className={cn(
        "group relative cursor-pointer rounded-xl overflow-hidden transition-all",
        isSelected && "ring-2 ring-purple-500 ring-offset-2",
        selectionDisabled && !isSelected && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/50">
        {profile.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
            <Check className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Verified badge */}
        {profile.is_verified && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500 text-white text-xs font-medium">
              <Check className="w-3 h-3 mr-0.5" />
              Verified
            </span>
          </div>
        )}

        {/* Distance badge */}
        {profile.distance_km !== undefined && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-black/60 text-white text-xs">
              <MapPin className="w-3 h-3 mr-0.5" />
              {(profile.distance_km * 0.621371).toFixed(0)} mi
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
            isSelected && "opacity-100"
          )}
        />
      </div>

      {/* Info */}
      <div className="p-3 bg-card">
        <p className="text-sm font-medium text-foreground truncate">
          {profile.first_name || "Unknown"}{" "}
          {age && <span className="text-muted-foreground">{age}</span>}
        </p>

        {profile.city && (
          <p className="text-xs text-muted-foreground truncate">
            {profile.city}
            {profile.state && `, ${profile.state}`}
          </p>
        )}
      </div>
    </div>
  );
}
