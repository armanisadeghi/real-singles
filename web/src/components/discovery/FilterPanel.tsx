"use client";

import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/utils";

// Filter options matching mobile app and database
const GENDER_OPTIONS = ["male", "female", "non_binary", "other"];
const BODY_TYPE_OPTIONS = ["athletic", "average", "slim", "curvy", "muscular", "full_figured"];
const EDUCATION_OPTIONS = [
  "high_school",
  "some_college",
  "associates",
  "bachelors",
  "masters",
  "doctorate",
  "trade_school",
];
const RELIGION_OPTIONS = [
  "christian",
  "catholic",
  "jewish",
  "muslim",
  "hindu",
  "buddhist",
  "spiritual",
  "agnostic",
  "atheist",
  "other",
];
const SMOKING_OPTIONS = ["never", "sometimes", "regularly", "trying_to_quit"];
const DRINKING_OPTIONS = ["never", "socially", "regularly"];
const ZODIAC_OPTIONS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

export interface FilterValues {
  minAge: number;
  maxAge: number;
  minHeight: number;
  maxHeight: number;
  maxDistance: number;
  gender: string[];
  bodyType: string[];
  education: string[];
  religion: string[];
  smoking: string[];
  drinking: string[];
  zodiac: string[];
}

const defaultFilters: FilterValues = {
  minAge: 18,
  maxAge: 50,
  minHeight: 48, // 4'0"
  maxHeight: 84, // 7'0"
  maxDistance: 50,
  gender: [],
  bodyType: [],
  education: [],
  religion: [],
  smoking: [],
  drinking: [],
  zodiac: [],
};

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: Partial<FilterValues>;
  onApply: (filters: FilterValues) => void;
}

export function FilterPanel({
  isOpen,
  onClose,
  initialValues = {},
  onApply,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({
    ...defaultFilters,
    ...initialValues,
  });

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const toggleArrayValue = (
    key: keyof FilterValues,
    value: string
  ) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: updated });
  };

  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  const formatLabel = (value: string) => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      fullHeight
    >
      <div className="px-4 py-4 space-y-6 pb-24">
        {/* Age Range */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Age Range</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Min</label>
              <input
                type="number"
                min={18}
                max={100}
                value={filters.minAge}
                onChange={(e) =>
                  setFilters({ ...filters, minAge: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg text-center"
              />
            </div>
            <span className="text-gray-400 mt-5">to</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Max</label>
              <input
                type="number"
                min={18}
                max={100}
                value={filters.maxAge}
                onChange={(e) =>
                  setFilters({ ...filters, maxAge: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg text-center"
              />
            </div>
          </div>
        </section>

        {/* Distance */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">
            Maximum Distance: {filters.maxDistance} miles
          </h3>
          <input
            type="range"
            min={1}
            max={100}
            value={filters.maxDistance}
            onChange={(e) =>
              setFilters({ ...filters, maxDistance: Number(e.target.value) })
            }
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 mi</span>
            <span>100 mi</span>
          </div>
        </section>

        {/* Height Range */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">
            Height: {formatHeight(filters.minHeight)} - {formatHeight(filters.maxHeight)}
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Min</label>
              <input
                type="range"
                min={48}
                max={84}
                value={filters.minHeight}
                onChange={(e) =>
                  setFilters({ ...filters, minHeight: Number(e.target.value) })
                }
                className="w-full accent-pink-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Max</label>
              <input
                type="range"
                min={48}
                max={84}
                value={filters.maxHeight}
                onChange={(e) =>
                  setFilters({ ...filters, maxHeight: Number(e.target.value) })
                }
                className="w-full accent-pink-500"
              />
            </div>
          </div>
        </section>

        {/* Gender */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Gender</h3>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleArrayValue("gender", option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.gender.includes(option)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </section>

        {/* Body Type */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Body Type</h3>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleArrayValue("bodyType", option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.bodyType.includes(option)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Education</h3>
          <div className="flex flex-wrap gap-2">
            {EDUCATION_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleArrayValue("education", option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.education.includes(option)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </section>

        {/* Religion */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Religion</h3>
          <div className="flex flex-wrap gap-2">
            {RELIGION_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleArrayValue("religion", option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.religion.includes(option)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </section>

        {/* Smoking */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Smoking</h3>
          <div className="flex flex-wrap gap-2">
            {SMOKING_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleArrayValue("smoking", option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.smoking.includes(option)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </section>

        {/* Drinking */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Drinking</h3>
          <div className="flex flex-wrap gap-2">
            {DRINKING_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleArrayValue("drinking", option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.drinking.includes(option)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </section>

        {/* Zodiac */}
        <section>
          <h3 className="font-medium text-gray-900 mb-3">Zodiac Sign</h3>
          <div className="flex flex-wrap gap-2">
            {ZODIAC_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleArrayValue("zodiac", option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.zodiac.includes(option)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Action buttons - sticky at bottom */}
      <BottomSheetActions>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-colors"
        >
          Apply Filters
        </button>
      </BottomSheetActions>
    </BottomSheet>
  );
}
