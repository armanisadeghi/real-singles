"use client";

/**
 * PoliticalViewsStep
 *
 * Step 17: Political Views (split from old BeliefsStep)
 * Uses option cards since 6 options fit without scroll.
 * "Prefer not to say" is a UI-only card — tracked via markFieldAsPreferNot().
 * Auto-advances after selection with a brief delay.
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DbPolitical value.
 */

import { useRef, useEffect } from "react";
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
  /** Called after selection to auto-advance to next step */
  onAutoAdvance?: () => Promise<void>;
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
  onAutoAdvance,
}: PoliticalViewsStepProps) {
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const currentSelected = isPreferNot ? "prefer_not_to_say" : politicalViews || null;

  const handleChange = (value: string) => {
    // Don't re-advance if clicking the already-selected option
    if (value === currentSelected) return;

    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onPoliticalViewsChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onPoliticalViewsChange(value as DbPolitical);
    }

    // Auto-advance after brief delay so user sees selection
    if (onAutoAdvance) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        onAutoAdvance();
      }, 400);
    }
  };

  return (
    <OnboardingStepWrapper title="What are your political views?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={currentSelected}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
