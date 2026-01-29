"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="space-y-4">
      {/* Quick filters - always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <RangeInput
          label="Age"
          minPlaceholder="18"
          maxPlaceholder="99"
          minValue={filters.minAge}
          maxValue={filters.maxAge}
          onMinChange={(v) => updateFilter("minAge", v)}
          onMaxChange={(v) => updateFilter("maxAge", v)}
        />
        <RangeInput
          label="Height (in)"
          minPlaceholder="48"
          maxPlaceholder="84"
          minValue={filters.minHeight}
          maxValue={filters.maxHeight}
          onMinChange={(v) => updateFilter("minHeight", v)}
          onMaxChange={(v) => updateFilter("maxHeight", v)}
        />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Max Distance</label>
          <div className="relative">
            <input
              type="number"
              placeholder="Any"
              value={filters.maxDistanceMiles || ""}
              onChange={(e) => updateFilter("maxDistanceMiles", e.target.value ? parseInt(e.target.value) : undefined)}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-slate-50 border border-slate-200",
                "focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10",
                "outline-none transition-all"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">mi</span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            isExpanded 
              ? "bg-amber-100 text-amber-700" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Advanced Filters
          {hasActiveFilters && !isExpanded && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-6 pt-4">
          {/* Multi-select filters */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Profile Attributes
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
          </div>

          {/* Lifestyle filters */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Lifestyle & Family
            </h4>
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
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
        </div>
      )}
    </div>
  );
}

function RangeInput({
  label,
  minPlaceholder,
  maxPlaceholder,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  minValue: number | undefined;
  maxValue: number | undefined;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder={minPlaceholder}
          value={minValue || ""}
          onChange={(e) => onMinChange(e.target.value ? parseInt(e.target.value) : undefined)}
          className={cn(
            "w-full px-3 py-2 rounded-lg text-sm",
            "bg-slate-50 border border-slate-200",
            "focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10",
            "outline-none transition-all"
          )}
        />
        <span className="text-slate-300 text-sm">–</span>
        <input
          type="number"
          placeholder={maxPlaceholder}
          value={maxValue || ""}
          onChange={(e) => onMaxChange(e.target.value ? parseInt(e.target.value) : undefined)}
          className={cn(
            "w-full px-3 py-2 rounded-lg text-sm",
            "bg-slate-50 border border-slate-200",
            "focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10",
            "outline-none transition-all"
          )}
        />
      </div>
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 rounded-lg text-sm text-left",
          "flex items-center justify-between",
          "bg-slate-50 border transition-all",
          isOpen 
            ? "border-amber-500 ring-2 ring-amber-500/10 bg-white" 
            : selected.length > 0
            ? "border-amber-300 bg-amber-50"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <span className={selected.length > 0 ? "text-amber-700 font-medium" : "text-slate-400"}>
          {selected.length > 0 ? `${selected.length} selected` : "Any"}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180",
          selected.length > 0 ? "text-amber-500" : "text-slate-400"
        )} />
      </button>
      
      {isOpen && (
        <div className={cn(
          "absolute z-20 mt-1 w-full",
          "bg-white border border-slate-200 rounded-xl",
          "shadow-xl shadow-slate-200/50",
          "max-h-56 overflow-y-auto",
          "animate-in fade-in slide-in-from-top-2 duration-150"
        )}>
          <div className="p-1">
            {options.map((option) => (
              <label
                key={option}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  selected.includes(option) 
                    ? "bg-amber-50 text-amber-900" 
                    : "hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                  selected.includes(option)
                    ? "bg-amber-500 border-amber-500"
                    : "border-slate-300"
                )}>
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
                <span className="text-sm capitalize">{option}</span>
              </label>
            ))}
          </div>
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
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cn(
          "w-full px-3 py-2 rounded-lg text-sm appearance-none",
          "bg-slate-50 border transition-all cursor-pointer",
          value 
            ? "border-amber-300 bg-amber-50 text-amber-700 font-medium" 
            : "border-slate-200 text-slate-700 hover:border-slate-300",
          "focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
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
