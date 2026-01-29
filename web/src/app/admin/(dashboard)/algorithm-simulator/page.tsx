"use client";

import { useState, useCallback } from "react";
import { Play, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserSelector } from "./components/UserSelector";
import { AlgorithmPicker, type Algorithm } from "./components/AlgorithmPicker";
import { FilterConfig, type Filters } from "./components/FilterConfig";
import { DebugPanel } from "./components/DebugPanel";
import { ResultsGrid } from "./components/ResultsGrid";

interface UserOption {
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  looking_for: string[] | null;
  city: string | null;
  state: string | null;
  can_start_matching: boolean | null;
  status: string | null;
  profile_image_url: string | null;
}

interface SimulationResult {
  success: boolean;
  algorithm: string;
  userProfile: {
    userId: string;
    gender: string | null;
    lookingFor: string[] | null;
    city?: string | null;
    state?: string | null;
    canStartMatching?: boolean;
  };
  profiles?: Array<{
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    looking_for: string[] | null;
    date_of_birth: string | null;
    city: string | null;
    state: string | null;
    profile_image_url: string | null;
    is_verified: boolean | null;
    can_start_matching?: boolean | null;
    profile_hidden?: boolean | null;
    distance_km?: number;
    is_favorite?: boolean;
    has_liked_me?: boolean;
    _debug?: {
      gender_match: boolean;
      bidirectional_match: boolean;
    };
  }>;
  matches?: Array<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    looking_for: string[] | null;
    city: string | null;
    state: string | null;
    profile_image_url: string | null;
    is_verified: boolean | null;
    matched_at: string;
    conversation_id?: string;
  }>;
  likes?: Array<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    looking_for: string[] | null;
    city: string | null;
    state: string | null;
    profile_image_url: string | null;
    is_verified: boolean | null;
    action: string;
    liked_at: string;
  }>;
  total: number;
  debug?: {
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
  };
}

export default function AlgorithmSimulatorPage() {
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>("discover-profiles");
  const [filters, setFilters] = useState<Filters>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = useCallback(async () => {
    if (!selectedUser) {
      setError("Please select a user first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/algorithm-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUser.user_id,
          algorithm: selectedAlgorithm,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: { limit: 100, offset: 0 },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run simulation");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, selectedAlgorithm, filters]);

  // Determine result type based on algorithm
  const getResultType = (): "discovery" | "matches" | "likes" => {
    if (selectedAlgorithm === "mutual-matches") return "matches";
    if (selectedAlgorithm === "likes-received") return "likes";
    return "discovery";
  };

  // Get profiles based on result type
  const getProfiles = () => {
    if (!result) return [];
    if (result.profiles) return result.profiles;
    if (result.matches) return result.matches.map(m => ({ ...m, matched_at: m.matched_at }));
    if (result.likes) return result.likes.map(l => ({ ...l, liked_at: l.liked_at, action: l.action }));
    return [];
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Algorithm Simulator"
        subtitle="Test discovery and matching algorithms for any user"
        variant="hero"
        iconName="zap"
        iconGradient="from-purple-500 to-pink-500"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UserSelector
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
            />
            <AlgorithmPicker
              selected={selectedAlgorithm}
              onSelect={setSelectedAlgorithm}
            />
          </div>

          {/* Only show filters for discovery algorithms */}
          {!["mutual-matches", "likes-received"].includes(selectedAlgorithm) && (
            <FilterConfig
              filters={filters}
              onChange={setFilters}
            />
          )}

          {/* Run Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={runSimulation}
              disabled={!selectedUser || loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Simulation
                </>
              )}
            </button>
            
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        {/* Right Column - Debug Panel */}
        <div>
          <DebugPanel
            userProfile={result?.userProfile ? {
              userId: result.userProfile.userId,
              gender: result.userProfile.gender,
              lookingFor: result.userProfile.lookingFor,
              city: result.userProfile.city,
              state: result.userProfile.state,
              canStartMatching: result.userProfile.canStartMatching,
            } : null}
            debug={result?.debug || null}
            total={result?.total || 0}
            loading={loading}
          />
        </div>
      </div>

      {/* Results Grid */}
      {(result || loading) && (
        <ResultsGrid
          profiles={getProfiles()}
          loading={loading}
          resultType={getResultType()}
        />
      )}
    </div>
  );
}
