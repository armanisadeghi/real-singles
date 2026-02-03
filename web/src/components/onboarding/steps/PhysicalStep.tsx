"use client";

/**
 * PhysicalStep
 *
 * Step 7: Height and Body Type
 */

import { OnboardingStepWrapper, OnboardingSelect } from "../OnboardingStepWrapper";
import { BODY_TYPE_OPTIONS } from "@/types";
import { cn } from "@/lib/utils";

interface PhysicalStepProps {
  heightFeet: string;
  heightInches: string;
  bodyType: string;
  onHeightFeetChange: (value: string) => void;
  onHeightInchesChange: (value: string) => void;
  onBodyTypeChange: (value: string) => void;
}

// Height options
const FEET_OPTIONS = [
  { value: "4", label: "4 ft" },
  { value: "5", label: "5 ft" },
  { value: "6", label: "6 ft" },
  { value: "7", label: "7 ft" },
];

const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: `${i} in`,
}));

export function PhysicalStep({
  heightFeet,
  heightInches,
  bodyType,
  onHeightFeetChange,
  onHeightInchesChange,
  onBodyTypeChange,
}: PhysicalStepProps) {
  return (
    <OnboardingStepWrapper title="Physical attributes">
      {/* Height */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Height
        </label>
        <div className="flex gap-2">
          <select
            value={heightFeet}
            onChange={(e) => onHeightFeetChange(e.target.value)}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl appearance-none",
              "text-base",
              heightFeet ? "text-gray-900 dark:text-gray-100" : "text-gray-400",
              "bg-white/80 dark:bg-neutral-800/80",
              "border border-gray-200 dark:border-neutral-700",
              "focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
            )}
          >
            <option value="">Feet</option>
            {FEET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={heightInches}
            onChange={(e) => onHeightInchesChange(e.target.value)}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl appearance-none",
              "text-base",
              heightInches ? "text-gray-900 dark:text-gray-100" : "text-gray-400",
              "bg-white/80 dark:bg-neutral-800/80",
              "border border-gray-200 dark:border-neutral-700",
              "focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
            )}
          >
            <option value="">Inches</option>
            {INCHES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body Type */}
      <OnboardingSelect
        label="Body Type"
        options={BODY_TYPE_OPTIONS}
        value={bodyType}
        onChange={(e) => onBodyTypeChange(e.target.value)}
        placeholder="Select body type"
      />
    </OnboardingStepWrapper>
  );
}
