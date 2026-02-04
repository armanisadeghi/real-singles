"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
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
  is_photo_verified?: boolean | null;
  bio?: string | null;
  occupation?: string | null;
  height_inches?: number | null;
  body_type?: string | null;
  looking_for?: string[] | null;
  distance_km?: number;
}

interface Filters {
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  maxDistanceMiles?: number;
  gender?: string[];
  bodyTypes?: string[];
  ethnicities?: string[];
  religions?: string[];
  educationLevels?: string[];
  smoking?: string;
  drinking?: string;
  hasKids?: string;
  wantsKids?: string;
}

// Filter options
const BODY_TYPES = ["slim", "athletic", "average", "muscular", "curvy", "plus_size"];
const ETHNICITIES = ["white", "latino", "black", "asian", "native_american", "east_indian", "pacific_islander", "middle_eastern", "armenian", "mixed", "other"];
const RELIGIONS = ["adventist", "agnostic", "atheist", "buddhist", "christian_catholic", "christian_lds", "christian_protestant", "christian_orthodox", "hindu", "jewish", "muslim", "spiritual", "other", "prefer_not_to_say"];
const EDUCATION_LEVELS = ["high_school", "trade_school", "some_college", "associate", "bachelor", "graduate", "phd"];
const SMOKING_OPTIONS = ["never", "occasionally", "daily", "trying_to_quit"];
const DRINKING_OPTIONS = ["never", "social", "moderate", "regular"];
const HAS_KIDS_OPTIONS = ["no", "yes_live_at_home", "yes_live_away", "yes_shared"];
const WANTS_KIDS_OPTIONS = ["no", "no_ok_if_partner_has", "yes", "not_sure"];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MatchmakerDiscoverPage() {
  const { matchmakerId } = useMatchmaker();
  const searchParams = useSearchParams();
  const simulateFor = searchParams.get("simulate_for");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const BATCH_SIZE = 30;

  // If simulating for a client, load their filters
  useEffect(() => {
    if (simulateFor) {
      // TODO: Load client's filters from API
      console.log("Simulating for client:", simulateFor);
    }
  }, [simulateFor]);

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
        if (filters.minHeight) params.set("min_height", String(filters.minHeight));
        if (filters.maxHeight) params.set("max_height", String(filters.maxHeight));
        if (filters.maxDistanceMiles) params.set("max_distance", String(filters.maxDistanceMiles));
        if (filters.gender && filters.gender.length > 0) {
          filters.gender.forEach((g) => params.append("gender", g));
        }
        if (filters.bodyTypes && filters.bodyTypes.length > 0) {
          filters.bodyTypes.forEach((b) => params.append("body_type", b));
        }
        if (filters.ethnicities && filters.ethnicities.length > 0) {
          filters.ethnicities.forEach((e) => params.append("ethnicity", e));
        }
        if (filters.religions && filters.religions.length > 0) {
          filters.religions.forEach((r) => params.append("religion", r));
        }
        if (filters.educationLevels && filters.educationLevels.length > 0) {
          filters.educationLevels.forEach((e) => params.append("education", e));
        }
        if (filters.smoking) params.set("smoking", filters.smoking);
        if (filters.drinking) params.set("drinking", filters.drinking);
        if (filters.hasKids) params.set("has_kids", filters.hasKids);
        if (filters.wantsKids) params.set("wants_kids", filters.wantsKids);

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
  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters (trigger refetch)
  const applyFilters = () => {
    setProfiles([]);
    setOffset(0);
    setHasMore(true);
    fetchProfiles(true);
  };

  const resetFilters = () => {
    setFilters({});
    setProfiles([]);
    setOffset(0);
    setHasMore(true);
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

  const activeFilterCount = Object.entries(filters).filter(([_, v]) =>
    v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

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
              {simulateFor && " (Simulating client view)"}
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

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border/40 p-6 space-y-4">
        {/* Quick Filters - Always Visible */}
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
                  handleFilterChange("minAge", e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <input
                type="number"
                placeholder="99"
                value={filters.maxAge || ""}
                onChange={(e) =>
                  handleFilterChange("maxAge", e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Height Range */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Height (inches)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="48"
                value={filters.minHeight || ""}
                onChange={(e) =>
                  handleFilterChange("minHeight", e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <input
                type="number"
                placeholder="84"
                value={filters.maxHeight || ""}
                onChange={(e) =>
                  handleFilterChange("maxHeight", e.target.value ? parseInt(e.target.value) : undefined)
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
                handleFilterChange("gender", e.target.value ? [e.target.value] : undefined)
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
                  handleFilterChange("maxDistanceMiles", e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                mi
              </span>
            </div>
          </div>

          {/* Search Button */}
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

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              showAdvancedFilters
                ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filters
            {activeFilterCount > 0 && !showAdvancedFilters && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-xs">
                {activeFilterCount}
              </span>
            )}
            {showAdvancedFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-6 pt-4">
            {/* Profile Attributes */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Profile Attributes
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MultiSelect
                  label="Body Type"
                  options={BODY_TYPES}
                  selected={filters.bodyTypes || []}
                  onChange={(v) => handleFilterChange("bodyTypes", v.length > 0 ? v : undefined)}
                />
                <MultiSelect
                  label="Ethnicity"
                  options={ETHNICITIES}
                  selected={filters.ethnicities || []}
                  onChange={(v) => handleFilterChange("ethnicities", v.length > 0 ? v : undefined)}
                />
                <MultiSelect
                  label="Religion"
                  options={RELIGIONS}
                  selected={filters.religions || []}
                  onChange={(v) => handleFilterChange("religions", v.length > 0 ? v : undefined)}
                />
                <MultiSelect
                  label="Education"
                  options={EDUCATION_LEVELS}
                  selected={filters.educationLevels || []}
                  onChange={(v) => handleFilterChange("educationLevels", v.length > 0 ? v : undefined)}
                />
              </div>
            </div>

            {/* Lifestyle */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Lifestyle & Family
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SingleSelect
                  label="Smoking"
                  options={SMOKING_OPTIONS}
                  value={filters.smoking}
                  onChange={(v) => handleFilterChange("smoking", v || undefined)}
                />
                <SingleSelect
                  label="Drinking"
                  options={DRINKING_OPTIONS}
                  value={filters.drinking}
                  onChange={(v) => handleFilterChange("drinking", v || undefined)}
                />
                <SingleSelect
                  label="Has Children"
                  options={HAS_KIDS_OPTIONS}
                  value={filters.hasKids}
                  onChange={(v) => handleFilterChange("hasKids", v || undefined)}
                />
                <SingleSelect
                  label="Wants Children"
                  options={WANTS_KIDS_OPTIONS}
                  value={filters.wantsKids}
                  onChange={(v) => handleFilterChange("wantsKids", v || undefined)}
                />
              </div>
            </div>
          </div>
        )}
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

// =============================================================================
// FILTER COMPONENTS
// =============================================================================

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 rounded-lg text-sm text-left",
          "flex items-center justify-between",
          "bg-background border transition-all",
          isOpen
            ? "border-purple-500 ring-2 ring-purple-500/10"
            : selected.length > 0
            ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30"
            : "border-border/40 hover:border-border"
        )}
      >
        <span className={selected.length > 0 ? "text-purple-700 dark:text-purple-300 font-medium" : "text-muted-foreground"}>
          {selected.length > 0 ? `${selected.length} selected` : "Any"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180",
            selected.length > 0 ? "text-purple-500" : "text-muted-foreground"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-card border border-border/40 rounded-xl shadow-xl max-h-56 overflow-y-auto">
            <div className="p-1">
              {options.map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    selected.includes(option)
                      ? "bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                      selected.includes(option)
                        ? "bg-purple-500 border-purple-500"
                        : "border-border"
                    )}
                  >
                    {selected.includes(option) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="sr-only"
                  />
                  <span className="text-sm capitalize">
                    {option.replace(/_/g, " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SingleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cn(
          "w-full px-3 py-2 rounded-lg text-sm appearance-none cursor-pointer",
          "bg-background border transition-all",
          value
            ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium"
            : "border-border/40 text-foreground hover:border-border",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.5rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.5em 1.5em",
          paddingRight: "2.5rem",
        }}
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
