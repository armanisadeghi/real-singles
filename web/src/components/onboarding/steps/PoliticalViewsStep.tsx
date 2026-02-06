"use client";

/**
 * PoliticalViewsStep
 *
 * Step 17: Political Views (split from old BeliefsStep)
 * Uses option cards since 6 options fit without scroll.
 * "Prefer not to say" is a UI-only card — tracked via markFieldAsPreferNot().
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DbPolitical value.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { POLITICAL_OPTIONS } from "@/types";
import type { DbPolitical } from "@/types/db-constraints";

interface PoliticalViewsStepProps {
  politicalViews: DbPolitical | "";
  onPoliticalViewsChange: (value: DbPolitical | "") => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

const DISPLAY_OPTIONS = [
  ...POLITICAL_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

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
      onPoliticalViewsChange(value as DbPolitical);
    }
  };

  return (
    <OnboardingStepWrapper title="What are your political views?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={isPreferNot ? "prefer_not_to_say" : politicalViews || null}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
