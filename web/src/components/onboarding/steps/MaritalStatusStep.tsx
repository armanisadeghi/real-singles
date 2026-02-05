"use client";

/**
 * MaritalStatusStep
 *
 * Step 11: Marital Status (split from old RelationshipGoalsStep)
 * Uses option cards for a clean, list-based selection.
 * Includes "Prefer not to say" as a selectable option card.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { MARITAL_STATUS_OPTIONS } from "@/types";

interface MaritalStatusStepProps {
  maritalStatus: string;
  onMaritalStatusChange: (value: string) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

// Extend options with "Prefer not to say" as a selectable card
const MARITAL_STATUS_WITH_PREFER_NOT = [
  ...MARITAL_STATUS_OPTIONS,
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export function MaritalStatusStep({
  maritalStatus,
  onMaritalStatusChange,
  isPreferNot,
  onPreferNotChange,
}: MaritalStatusStepProps) {
  const handleChange = (value: string) => {
    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onMaritalStatusChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onMaritalStatusChange(value);
    }
  };

  return (
    <OnboardingStepWrapper title="What's your marital status?">
      <OnboardingOptionCards
        options={MARITAL_STATUS_WITH_PREFER_NOT}
        selected={isPreferNot ? "prefer_not_to_say" : maritalStatus || null}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
