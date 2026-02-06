"use client";

/**
 * HasKidsStep
 *
 * Step 21: Do you have children? (split from old KidsStep)
 * Uses option cards for a clean, list-based selection.
 * "Prefer not to say" is a UI-only card — tracked via markFieldAsPreferNot().
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DbHasKids value.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { HAS_KIDS_OPTIONS } from "@/types";
import type { DbHasKids } from "@/types/db-constraints";

interface HasKidsStepProps {
  hasKids: DbHasKids | "";
  onHasKidsChange: (value: DbHasKids | "") => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

const DISPLAY_OPTIONS = [
  ...HAS_KIDS_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

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
      onHasKidsChange(value as DbHasKids);
    }
  };

  return (
    <OnboardingStepWrapper title="Do you have children?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={isPreferNot ? "prefer_not_to_say" : hasKids || null}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
