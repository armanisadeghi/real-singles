"use client";

/**
 * PoliticalViewsStep
 *
 * Step 17: Political Views (split from old BeliefsStep)
 * Uses option cards since 6 options fit without scroll.
 * Includes "Prefer not to say" as a selectable option card.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { POLITICAL_OPTIONS } from "@/types";

interface PoliticalViewsStepProps {
  politicalViews: string;
  onPoliticalViewsChange: (value: string) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

// Extend options with "Prefer not to say" as a selectable card
const POLITICAL_WITH_PREFER_NOT = [
  ...POLITICAL_OPTIONS,
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export function PoliticalViewsStep({
  politicalViews,
  onPoliticalViewsChange,
  isPreferNot,
  onPreferNotChange,
}: PoliticalViewsStepProps) {
  const handleChange = (value: string) => {
    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onPoliticalViewsChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onPoliticalViewsChange(value);
    }
  };

  return (
    <OnboardingStepWrapper title="What are your political views?">
      <OnboardingOptionCards
        options={POLITICAL_WITH_PREFER_NOT}
        selected={isPreferNot ? "prefer_not_to_say" : politicalViews || null}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
