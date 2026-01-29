"use client";

import { BarChart3, User, Users, Filter, Ban, Heart, Check } from "lucide-react";

interface DebugInfo {
  totalProfilesInDb?: number;
  excludedBySelf?: number;
  excludedByGender?: number;
  excludedByBidirectional?: number;
  excludedByEligibility?: number;
  excludedByUserActions?: number;
  excludedByTargetActions?: number;
  excludedByMutualMatch?: number;
  excludedByFilters?: number;
  finalCount?: number;
}

interface UserProfile {
  userId: string;
  gender: string | null;
  lookingFor: string[] | null;
  city?: string | null;
  state?: string | null;
  canStartMatching?: boolean;
}

interface DebugPanelProps {
  userProfile: UserProfile | null;
  debug: DebugInfo | null;
  total: number;
  loading?: boolean;
}

export function DebugPanel({ userProfile, debug, total, loading }: DebugPanelProps) {
  const formatGender = (gender: string | null) => {
    if (!gender) return "Not set";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatLookingFor = (lookingFor: string[] | null) => {
    if (!lookingFor || lookingFor.length === 0) return "Not set";
    return lookingFor.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(", ");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Debug Info</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Debug Info</h3>
        </div>
        <p className="text-sm text-slate-500">Select a user to see debug information</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
          <BarChart3 className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Debug Info</h3>
      </div>

      {/* User Profile Context */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">User Context</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-500">Gender:</span>{" "}
            <span className={`font-medium ${
              userProfile.gender === "male" ? "text-blue-600" :
              userProfile.gender === "female" ? "text-pink-600" :
              "text-slate-600"
            }`}>
              {formatGender(userProfile.gender)}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Looking for:</span>{" "}
            <span className="font-medium text-slate-900">
              {formatLookingFor(userProfile.lookingFor)}
            </span>
          </div>
          {userProfile.city && (
            <div>
              <span className="text-slate-500">Location:</span>{" "}
              <span className="font-medium text-slate-900">
                {userProfile.city}, {userProfile.state}
              </span>
            </div>
          )}
          <div>
            <span className="text-slate-500">Can Match:</span>{" "}
            <span className={`font-medium ${
              userProfile.canStartMatching ? "text-green-600" : "text-amber-600"
            }`}>
              {userProfile.canStartMatching ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Final Results</span>
          </div>
          <span className="text-2xl font-bold text-green-700">{total}</span>
        </div>
      </div>

      {/* Filtering Stats */}
      {debug && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Filtering Breakdown
          </p>
          
          <FilterStat
            icon={<Users className="w-3.5 h-3.5" />}
            label="Total profiles in DB"
            value={debug.totalProfilesInDb}
            color="slate"
          />
          <FilterStat
            icon={<Filter className="w-3.5 h-3.5" />}
            label="Excluded by user actions"
            value={debug.excludedByUserActions}
            color="orange"
            isExclusion
          />
          <FilterStat
            icon={<Ban className="w-3.5 h-3.5" />}
            label="Excluded by target actions"
            value={debug.excludedByTargetActions}
            color="red"
            isExclusion
          />
          <FilterStat
            icon={<Heart className="w-3.5 h-3.5" />}
            label="Excluded (mutual matches)"
            value={debug.excludedByMutualMatch}
            color="pink"
            isExclusion
          />
        </div>
      )}
    </div>
  );
}

function FilterStat({
  icon,
  label,
  value,
  color,
  isExclusion,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  color: "slate" | "orange" | "red" | "pink" | "blue" | "green";
  isExclusion?: boolean;
}) {
  if (value === undefined) return null;

  const colorClasses = {
    slate: "bg-slate-100 text-slate-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    pink: "bg-pink-100 text-pink-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-sm font-medium ${
        isExclusion && value > 0 ? "text-slate-900" : "text-slate-500"
      }`}>
        {isExclusion && value > 0 ? `-${value}` : value}
      </span>
    </div>
  );
}
