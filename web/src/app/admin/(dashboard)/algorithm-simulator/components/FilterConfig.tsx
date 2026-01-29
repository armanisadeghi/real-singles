"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

export interface Filters {
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  maxDistanceMiles?: number;
  bodyTypes?: string[];
  ethnicities?: string[];
  religions?: string[];
  educationLevels?: string[];
  zodiacSigns?: string[];
  smoking?: string;
  drinking?: string;
  marijuana?: string;
  hasKids?: string;
  wantsKids?: string;
}

interface FilterConfigProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const BODY_TYPES = ["slim", "athletic", "average", "curvy", "heavyset"];
const ETHNICITIES = ["asian", "black", "hispanic", "middle eastern", "mixed", "native american", "pacific islander", "white", "other"];
const RELIGIONS = ["agnostic", "atheist", "buddhist", "catholic", "christian", "hindu", "jewish", "muslim", "spiritual", "other"];
const EDUCATION_LEVELS = ["high school", "some college", "associate", "bachelor", "master", "doctorate", "professional"];
const ZODIAC_SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const LIFESTYLE_OPTIONS = ["yes", "no", "sometimes", "socially"];
const KIDS_OPTIONS = ["Yes", "No"];
const WANTS_KIDS_OPTIONS = ["definitely", "maybe", "no", "have and want more"];

export function FilterConfig({ filters, onChange }: FilterConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => 
    v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Filters (Optional)</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Expand
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick filters always visible */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Age Range</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="18"
              value={filters.minAge || ""}
              onChange={(e) => updateFilter("minAge", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="99"
              value={filters.maxAge || ""}
              onChange={(e) => updateFilter("maxAge", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Height (inches)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="48"
              value={filters.minHeight || ""}
              onChange={(e) => updateFilter("minHeight", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="84"
              value={filters.maxHeight || ""}
              onChange={(e) => updateFilter("maxHeight", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Max Distance (mi)</label>
          <input
            type="number"
            placeholder="Any"
            value={filters.maxDistanceMiles || ""}
            onChange={(e) => updateFilter("maxDistanceMiles", e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
          />
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-slate-100">
          {/* Multi-select filters */}
          <div className="grid grid-cols-2 gap-4">
            <MultiSelect
              label="Body Type"
              options={BODY_TYPES}
              selected={filters.bodyTypes || []}
              onChange={(v) => updateFilter("bodyTypes", v.length > 0 ? v : undefined)}
            />
            <MultiSelect
              label="Ethnicity"
              options={ETHNICITIES}
              selected={filters.ethnicities || []}
              onChange={(v) => updateFilter("ethnicities", v.length > 0 ? v : undefined)}
            />
            <MultiSelect
              label="Religion"
              options={RELIGIONS}
              selected={filters.religions || []}
              onChange={(v) => updateFilter("religions", v.length > 0 ? v : undefined)}
            />
            <MultiSelect
              label="Education"
              options={EDUCATION_LEVELS}
              selected={filters.educationLevels || []}
              onChange={(v) => updateFilter("educationLevels", v.length > 0 ? v : undefined)}
            />
            <MultiSelect
              label="Zodiac"
              options={ZODIAC_SIGNS}
              selected={filters.zodiacSigns || []}
              onChange={(v) => updateFilter("zodiacSigns", v.length > 0 ? v : undefined)}
            />
          </div>

          {/* Single select filters */}
          <div className="grid grid-cols-3 gap-4">
            <SingleSelect
              label="Smoking"
              options={LIFESTYLE_OPTIONS}
              value={filters.smoking}
              onChange={(v) => updateFilter("smoking", v || undefined)}
            />
            <SingleSelect
              label="Drinking"
              options={LIFESTYLE_OPTIONS}
              value={filters.drinking}
              onChange={(v) => updateFilter("drinking", v || undefined)}
            />
            <SingleSelect
              label="Marijuana"
              options={LIFESTYLE_OPTIONS}
              value={filters.marijuana}
              onChange={(v) => updateFilter("marijuana", v || undefined)}
            />
            <SingleSelect
              label="Has Kids"
              options={KIDS_OPTIONS}
              value={filters.hasKids}
              onChange={(v) => updateFilter("hasKids", v || undefined)}
            />
            <SingleSelect
              label="Wants Kids"
              options={WANTS_KIDS_OPTIONS}
              value={filters.wantsKids}
              onChange={(v) => updateFilter("wantsKids", v || undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-left flex items-center justify-between bg-white"
      >
        <span className={selected.length > 0 ? "text-slate-900" : "text-slate-400"}>
          {selected.length > 0 ? `${selected.length} selected` : "Any"}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm capitalize">{option}</span>
            </label>
          ))}
        </div>
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
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
