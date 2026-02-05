"use client";

/**
 * HasKidsStep
 *
 * Step 21: Do you have children? (split from old KidsStep)
 * Uses option cards for a clean, list-based selection.
 * Includes "Prefer not to say" as a selectable option card.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { HAS_KIDS_OPTIONS } from "@/types";

interface HasKidsStepProps {
  hasKids: string;
  onHasKidsChange: (value: string) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

// Extend options with "Prefer not to say" as a selectable card
const HAS_KIDS_WITH_PREFER_NOT = [
  ...HAS_KIDS_OPTIONS,
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export function HasKidsStep({
  hasKids,
  onHasKidsChange,
  isPreferNot,
  onPreferNotChange,
}: HasKidsStepProps) {
  const handleChange = (value: string) => {
    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onHasKidsChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onHasKidsChange(value);
    }
  };

  return (
    <OnboardingStepWrapper title="Do you have children?">
      <OnboardingOptionCards
        options={HAS_KIDS_WITH_PREFER_NOT}
        selected={isPreferNot ? "prefer_not_to_say" : hasKids || null}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
