"use client";

/**
 * HasKidsStep
 *
 * Step 21: Do you have children? (split from old KidsStep)
 * Uses option cards for a clean, list-based selection.
 * "Prefer not to say" is a UI-only card — tracked via markFieldAsPreferNot().
 * Auto-advances after selection with a brief delay.
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DbHasKids value.
 */

import { useRef, useEffect } from "react";
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
  /** Called after selection to auto-advance to next step */
  onAutoAdvance?: () => Promise<void>;
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
  onAutoAdvance,
}: HasKidsStepProps) {
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const currentSelected = isPreferNot ? "prefer_not_to_say" : hasKids || null;

  const handleChange = (value: string) => {
    if (value === currentSelected) return;

    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onHasKidsChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onHasKidsChange(value as DbHasKids);
    }

    if (onAutoAdvance) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        onAutoAdvance();
      }, 400);
    }
  };

  return (
    <OnboardingStepWrapper title="Do you have children?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={currentSelected}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
