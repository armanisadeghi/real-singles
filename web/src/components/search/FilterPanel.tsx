"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import { DualRangeSlider } from "@/components/ui/DualRangeSlider";
import { cn } from "@/lib/utils";
import {
  BODY_TYPE_OPTIONS,
  EDUCATION_OPTIONS,
  RELIGION_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  MARIJUANA_OPTIONS,
  ZODIAC_OPTIONS,
  ETHNICITY_OPTIONS,
  HAS_KIDS_OPTIONS,
  WANTS_KIDS_OPTIONS,
  PETS_OPTIONS,
  POLITICAL_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  EXERCISE_OPTIONS,
} from "@/types";

export interface FilterValues {
  minAge: number;
  maxAge: number;
  minHeight: number;
  maxHeight: number;
  maxDistance: number;
  // Note: Gender preference is NOT a filter - it comes from user's profile "looking_for" field
  bodyType: string[];
  education: string[];
  religion: string[];
  smoking: string[];
  drinking: string[];
  zodiac: string[];
  marijuana: string[];
  ethnicity: string[];
  hasKids: string[];
  wantsKids: string[];
  pets: string[];
  politicalViews: string[];
  maritalStatus: string[];
  exercise: string[];
}

const defaultFilters: FilterValues = {
  minAge: 18,
  maxAge: 99, // Fully inclusive by default
  minHeight: 48, // 4'0"
  maxHeight: 84, // 7'0"
  maxDistance: 500, // 500 miles - essentially nationwide by default
  // Note: Gender preference is NOT a filter - it comes from user's profile "looking_for" field
  bodyType: [],
  education: [],
  religion: [],
  smoking: [],
  drinking: [],
  zodiac: [],
  marijuana: [],
  ethnicity: [],
  hasKids: [],
  wantsKids: [],
  pets: [],
  politicalViews: [],
  maritalStatus: [],
  exercise: [],
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
    return `${feet} ft ${remainingInches} in`;
  };

  // No longer needed since we're using option.label directly
  // const formatLabel = (value: string) => {
  //   return value
  //     .split("_")
  //     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //     .join(" ");
  // };

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
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Age Range</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Min</label>
              <input
                type="number"
                min={18}
                max={100}
                value={filters.minAge}
                onChange={(e) =>
                  setFilters({ ...filters, minAge: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-lg text-center"
              />
            </div>
            <span className="text-gray-400 dark:text-gray-500 mt-5">to</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Max</label>
              <input
                type="number"
                min={18}
                max={100}
                value={filters.maxAge}
                onChange={(e) =>
                  setFilters({ ...filters, maxAge: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-lg text-center"
              />
            </div>
          </div>
        </section>

        {/* Distance */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Maximum Distance: {filters.maxDistance >= 500 ? "Nationwide" : `${filters.maxDistance} miles`}
          </h3>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={filters.maxDistance}
            onChange={(e) =>
              setFilters({ ...filters, maxDistance: Number(e.target.value) })
            }
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>10 mi</span>
            <span>50 mi</span>
            <span>100 mi</span>
            <span>250 mi</span>
            <span>Nationwide</span>
          </div>
        </section>

        {/* Height Range */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Height</h3>
          <DualRangeSlider
            min={48}
            max={84}
            minValue={filters.minHeight}
            maxValue={filters.maxHeight}
            onMinChange={(value) => setFilters({ ...filters, minHeight: value })}
            onMaxChange={(value) => setFilters({ ...filters, maxHeight: value })}
            formatLabel={formatHeight}
          />
        </section>

        {/* Note: Gender preference is not shown here - it's set in profile settings */}

        {/* Body Type */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Body Type</h3>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("bodyType", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.bodyType.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Ethnicity */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Ethnicity</h3>
          <div className="flex flex-wrap gap-2">
            {ETHNICITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("ethnicity", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.ethnicity.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Education</h3>
          <div className="flex flex-wrap gap-2">
            {EDUCATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("education", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.education.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Religion */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Religion</h3>
          <div className="flex flex-wrap gap-2">
            {RELIGION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("religion", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.religion.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Political Views */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Political Views</h3>
          <div className="flex flex-wrap gap-2">
            {POLITICAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("politicalViews", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.politicalViews.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Marital Status */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Marital Status</h3>
          <div className="flex flex-wrap gap-2">
            {MARITAL_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("maritalStatus", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.maritalStatus.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Has Kids */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Has Kids</h3>
          <div className="flex flex-wrap gap-2">
            {HAS_KIDS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("hasKids", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.hasKids.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Wants Kids */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Wants Kids</h3>
          <div className="flex flex-wrap gap-2">
            {WANTS_KIDS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("wantsKids", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.wantsKids.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Pets */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Pets</h3>
          <div className="flex flex-wrap gap-2">
            {PETS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("pets", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.pets.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Smoking */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Smoking</h3>
          <div className="flex flex-wrap gap-2">
            {SMOKING_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("smoking", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.smoking.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Drinking */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Drinking</h3>
          <div className="flex flex-wrap gap-2">
            {DRINKING_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("drinking", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.drinking.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Marijuana */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Marijuana</h3>
          <div className="flex flex-wrap gap-2">
            {MARIJUANA_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("marijuana", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.marijuana.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Exercise */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Exercise</h3>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("exercise", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.exercise.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Zodiac */}
        <section>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Zodiac Sign</h3>
          <div className="flex flex-wrap gap-2">
            {ZODIAC_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleArrayValue("zodiac", option.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.zodiac.includes(option.value)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Action buttons - sticky at bottom */}
      <BottomSheetActions>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 flex-1 px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
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
