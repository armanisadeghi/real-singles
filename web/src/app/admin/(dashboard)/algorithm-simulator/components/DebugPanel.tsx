"use client";

import { BarChart3, User, Users, Filter, Ban, Heart, Check, MapPin, Sparkles, TrendingDown, Database, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md shadow-purple-500/20">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Debug Panel</h3>
            <p className="text-xs text-slate-500">Algorithm execution breakdown</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-slate-100 rounded-xl"></div>
              <div className="h-20 bg-slate-100 rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-8 bg-slate-100 rounded-lg"></div>
                <div className="h-8 bg-slate-100 rounded-lg"></div>
                <div className="h-8 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        ) : !userProfile ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No User Selected</p>
            <p className="text-xs text-slate-500 mt-1">Select a user to see debug info</p>
          </div>
        ) : (
          <>
            {/* User Profile Context */}
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">User Context</span>
              </div>
              <div className="space-y-2">
                <InfoRow 
                  label="Gender" 
                  value={formatGender(userProfile.gender)}
                  valueClass={
                    userProfile.gender === "male" ? "text-blue-600" :
                    userProfile.gender === "female" ? "text-pink-600" :
                    "text-slate-600"
                  }
                />
                <InfoRow 
                  label="Looking for" 
                  value={formatLookingFor(userProfile.lookingFor)}
                />
                {userProfile.city && (
                  <InfoRow 
                    label="Location" 
                    value={`${userProfile.city}, ${userProfile.state}`}
                    icon={<MapPin className="w-3 h-3" />}
                  />
                )}
                <InfoRow 
                  label="Matching Status" 
                  value={userProfile.canStartMatching ? "Eligible" : "Not Ready"}
                  valueClass={userProfile.canStartMatching ? "text-green-600" : "text-amber-600"}
                  icon={userProfile.canStartMatching ? <Check className="w-3 h-3" /> : null}
                />
              </div>
            </div>

            {/* Results Summary - Large Display */}
            <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/20">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-white/80" />
                      <span className="text-sm font-medium text-white/90">Final Results</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{total}</p>
                    <p className="text-xs text-white/70 mt-1">profiles returned</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -left-4 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
            </div>

            {/* Filtering Stats */}
            {debug && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Filtering Pipeline
                  </span>
                </div>
                
                <FilterStat
                  icon={<Database className="w-3.5 h-3.5" />}
                  label="Total in database"
                  value={debug.totalProfilesInDb}
                  color="slate"
                  isSource
                />
                <FilterStat
                  icon={<Filter className="w-3.5 h-3.5" />}
                  label="User actions"
                  value={debug.excludedByUserActions}
                  color="orange"
                  isExclusion
                />
                <FilterStat
                  icon={<Ban className="w-3.5 h-3.5" />}
                  label="Target actions"
                  value={debug.excludedByTargetActions}
                  color="red"
                  isExclusion
                />
                <FilterStat
                  icon={<Heart className="w-3.5 h-3.5" />}
                  label="Already matched"
                  value={debug.excludedByMutualMatch}
                  color="pink"
                  isExclusion
                />
                {debug.excludedByFilters !== undefined && debug.excludedByFilters > 0 && (
                  <FilterStat
                    icon={<Filter className="w-3.5 h-3.5" />}
                    label="Filter criteria"
                    value={debug.excludedByFilters}
                    color="purple"
                    isExclusion
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  valueClass = "text-slate-900",
  icon 
}: { 
  label: string; 
  value: string; 
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={cn("font-medium flex items-center gap-1", valueClass)}>
        {icon}
        {value}
      </span>
    </div>
  );
}

function FilterStat({
  icon,
  label,
  value,
  color,
  isExclusion,
  isSource,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  color: "slate" | "orange" | "red" | "pink" | "blue" | "green" | "purple";
  isExclusion?: boolean;
  isSource?: boolean;
}) {
  if (value === undefined) return null;

  const colorClasses: Record<string, { bg: string; text: string; badge: string }> = {
    slate: { bg: "bg-slate-100", text: "text-slate-600", badge: "bg-slate-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600", badge: "bg-orange-500" },
    red: { bg: "bg-red-100", text: "text-red-600", badge: "bg-red-500" },
    pink: { bg: "bg-pink-100", text: "text-pink-600", badge: "bg-pink-500" },
    blue: { bg: "bg-blue-100", text: "text-blue-600", badge: "bg-blue-500" },
    green: { bg: "bg-green-100", text: "text-green-600", badge: "bg-green-500" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", badge: "bg-purple-500" },
  };

  const colors = colorClasses[color];

  return (
    <div className={cn(
      "flex items-center justify-between py-2 px-3 rounded-lg transition-colors",
      "hover:bg-slate-50 group"
    )}>
      <div className="flex items-center gap-2.5">
        <div className={cn("p-1.5 rounded-lg", colors.bg, colors.text)}>
          {icon}
        </div>
        <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
          {label}
        </span>
      </div>
      <span className={cn(
        "text-sm font-semibold tabular-nums px-2 py-0.5 rounded",
        isSource ? [
          "text-slate-700"
        ] : isExclusion && value > 0 ? [
          "text-white",
          colors.badge
        ] : "text-slate-400"
      )}>
        {isExclusion && value > 0 ? `−${value}` : value.toLocaleString()}
      </span>
    </div>
  );
}
