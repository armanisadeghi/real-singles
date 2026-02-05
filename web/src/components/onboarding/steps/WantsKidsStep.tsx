"use client";

/**
 * WantsKidsStep
 *
 * Step 22: Do you want children? (split from old KidsStep)
 * Uses option cards for a clean, list-based selection.
 * Includes "Prefer not to say" as a selectable option card.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { WANTS_KIDS_OPTIONS } from "@/types";

interface WantsKidsStepProps {
  wantsKids: string;
  onWantsKidsChange: (value: string) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

// Extend options with "Prefer not to say" as a selectable card
const WANTS_KIDS_WITH_PREFER_NOT = [
  ...WANTS_KIDS_OPTIONS,
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export function WantsKidsStep({
  wantsKids,
  onWantsKidsChange,
  isPreferNot,
  onPreferNotChange,
}: WantsKidsStepProps) {
  const handleChange = (value: string) => {
    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onWantsKidsChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onWantsKidsChange(value);
    }
  };

  return (
    <OnboardingStepWrapper title="Do you want children?">
      <OnboardingOptionCards
        options={WANTS_KIDS_WITH_PREFER_NOT}
        selected={isPreferNot ? "prefer_not_to_say" : wantsKids || null}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
