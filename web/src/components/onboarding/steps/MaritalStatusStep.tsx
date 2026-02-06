"use client";

/**
 * MaritalStatusStep
 *
 * Step 11: Marital Status (split from old RelationshipGoalsStep)
 * Uses option cards for a clean, list-based selection.
 * "Prefer not to say" is a UI-only card — it calls markFieldAsPreferNot()
 * which tracks the preference separately. The field value stays "" (unset),
 * which saveAndContinue strips before sending to the API.
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DbMaritalStatus value.
 * The DB constraint only allows: never_married | separated | divorced | widowed
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { MARITAL_STATUS_OPTIONS } from "@/types";
import type { DbMaritalStatus } from "@/types/db-constraints";

interface MaritalStatusStepProps {
  maritalStatus: DbMaritalStatus | "";
  onMaritalStatusChange: (value: DbMaritalStatus | "") => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

/**
 * Display options include "Prefer not to say" as a UI-only option.
 * This value never reaches the API — it's intercepted by handleChange.
 */
const DISPLAY_OPTIONS = [
  ...MARITAL_STATUS_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

export function MaritalStatusStep({
  maritalStatus,
  onMaritalStatusChange,
  isPreferNot,
  onPreferNotChange,
}: MaritalStatusStepProps) {
  const handleChange = (value: string) => {
    if (value === "prefer_not_to_say") {
      // UI-only: mark as prefer not, clear the DB field value
      onPreferNotChange(true);
      onMaritalStatusChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      // Safe cast — value comes from MARITAL_STATUS_OPTIONS which is typed
      onMaritalStatusChange(value as DbMaritalStatus);
    }
  };

  return (
    <OnboardingStepWrapper title="What's your marital status?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={isPreferNot ? "prefer_not_to_say" : maritalStatus || null}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
