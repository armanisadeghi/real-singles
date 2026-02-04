"use client";

import { useState } from "react";
import { Search, Filter, X, ChevronDown, Calendar } from "lucide-react";

export interface UserFilterState {
  search: string;
  status: string;
  role: string;
  verified: string;
  can_start_matching: string;
  profile_hidden: string;
  gender: string;
  city: string;
  state: string;
  min_age: string;
  max_age: string;
  min_points: string;
  max_points: string;
  date_from: string;
  date_to: string;
  last_active_from: string;
  last_active_to: string;
}

interface UserFiltersProps {
  filters: UserFilterState;
  onFilterChange: (filters: UserFilterState) => void;
  onReset: () => void;
  activeFilterCount: number;
}

export function UserFilters({
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
}: UserFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateFilter = (key: keyof UserFilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="w-full sm:w-[160px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        {/* Role Filter */}
        <select
          value={filters.role}
          onChange={(e) => updateFilter("role", e.target.value)}
          className="w-full sm:w-[160px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Reset ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <div>
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isAdvancedOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isAdvancedOpen && (
          <div className="mt-4 bg-slate-50 rounded-lg p-4 space-y-4">
            {/* Verification & Profile Status */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Verification & Profile Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={filters.verified}
                  onChange={(e) => updateFilter("verified", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Not Verified</option>
                </select>

                <select
                  value={filters.can_start_matching}
                  onChange={(e) => updateFilter("can_start_matching", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="true">Can Match</option>
                  <option value="false">Cannot Match</option>
                </select>

                <select
                  value={filters.profile_hidden}
                  onChange={(e) => updateFilter("profile_hidden", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Profiles</option>
                  <option value="false">Visible</option>
                  <option value="true">Hidden</option>
                </select>
              </div>
            </div>

            {/* Demographics */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Demographics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={filters.gender}
                  onChange={(e) => updateFilter("gender", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Age"
                  min="18"
                  max="100"
                  value={filters.min_age}
                  onChange={(e) => updateFilter("min_age", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Max Age"
                  min="18"
                  max="100"
                  value={filters.max_age}
                  onChange={(e) => updateFilter("max_age", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="State (e.g., CA, NY)"
                  value={filters.state}
                  onChange={(e) => updateFilter("state", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Points Balance */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Points Balance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min Points"
                  min="0"
                  value={filters.min_points}
                  onChange={(e) => updateFilter("min_points", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max Points"
                  min="0"
                  value={filters.max_points}
                  onChange={(e) => updateFilter("max_points", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Ranges */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date Joined
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => updateFilter("date_from", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => updateFilter("date_to", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Last Active */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Last Active
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={filters.last_active_from}
                  onChange={(e) => updateFilter("last_active_from", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.last_active_to}
                  onChange={(e) => updateFilter("last_active_to", e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
