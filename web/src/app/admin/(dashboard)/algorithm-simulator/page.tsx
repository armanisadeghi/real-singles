"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Play, RefreshCw, Settings2, FlaskConical } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserSelector } from "./components/UserSelector";
import { AlgorithmPicker, type Algorithm } from "./components/AlgorithmPicker";
import { FilterConfig, type Filters } from "./components/FilterConfig";
import { DebugPanel } from "./components/DebugPanel";
import { ResultsGrid } from "./components/ResultsGrid";
import { cn } from "@/lib/utils";

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
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user_id");
  
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

  const showFilters = !["mutual-matches", "likes-received"].includes(selectedAlgorithm);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Algorithm Simulator"
        subtitle="Test discovery and matching algorithms for any user"
        variant="hero"
        iconName="zap"
        iconGradient="from-purple-500 to-pink-500"
      />

      {/* Configuration Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Configuration - Takes 3 columns */}
        <div className="xl:col-span-3 space-y-5">
          {/* Step 1: User Selection */}
          <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Select Test User</h3>
                  <p className="text-xs text-slate-500">Choose a user to simulate the algorithm for</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <UserSelector
                selectedUser={selectedUser}
                onSelectUser={setSelectedUser}
                initialUserId={initialUserId}
              />
            </div>
          </section>

          {/* Step 2: Algorithm Selection */}
          <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600 text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Choose Algorithm</h3>
                  <p className="text-xs text-slate-500">Select which matching algorithm to test</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <AlgorithmPicker
                selected={selectedAlgorithm}
                onSelect={setSelectedAlgorithm}
              />
            </div>
          </section>

          {/* Step 3: Filters (conditional) */}
          {showFilters && (
            <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Configure Filters</h3>
                    <p className="text-xs text-slate-500">Optional - narrow down results with specific criteria</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Settings2 className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <FilterConfig
                  filters={filters}
                  onChange={setFilters}
                />
              </div>
            </section>
          )}

          {/* Run Button Section */}
          <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl">
            <button
              onClick={runSimulation}
              disabled={!selectedUser || loading}
              className={cn(
                "group relative flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-base",
                "transition-all duration-300",
                "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                selectedUser && !loading ? [
                  "bg-gradient-to-r from-green-500 to-emerald-500",
                  "text-white shadow-lg shadow-green-500/30",
                  "hover:shadow-xl hover:shadow-green-500/40",
                  "hover:scale-[1.02]",
                  "focus-visible:ring-green-400",
                ] : [
                  "bg-slate-700 text-slate-400",
                  "cursor-not-allowed",
                ]
              )}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Running Simulation...</span>
                </>
              ) : (
                <>
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    selectedUser ? "bg-white/20" : "bg-slate-600"
                  )}>
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <span>Run Simulation</span>
                  <Play className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    selectedUser && !loading && "group-hover:translate-x-1"
                  )} />
                </>
              )}
            </button>
            
            <div className="flex-1 flex items-center gap-3">
              {error && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
              
              {!selectedUser && !error && (
                <p className="text-sm text-slate-400">
                  Select a user above to enable simulation
                </p>
              )}
              
              {selectedUser && !loading && !error && (
                <p className="text-sm text-slate-400">
                  Ready to test <span className="text-white font-medium">{selectedAlgorithm}</span> algorithm
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Debug Panel - Takes 1 column */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
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
