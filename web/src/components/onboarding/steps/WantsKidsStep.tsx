"use client";

/**
 * WantsKidsStep
 *
 * Step 22: Do you want children? (split from old KidsStep)
 * Uses option cards for a clean, list-based selection.
 * "Prefer not to say" is a UI-only card — tracked via markFieldAsPreferNot().
 * Auto-advances after selection with a brief delay.
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DbWantsKids value.
 */

import { useRef, useEffect } from "react";
import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { WANTS_KIDS_OPTIONS } from "@/types";
import type { DbWantsKids } from "@/types/db-constraints";

interface WantsKidsStepProps {
  wantsKids: DbWantsKids | "";
  onWantsKidsChange: (value: DbWantsKids | "") => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
  /** Called after selection to auto-advance to next step */
  onAutoAdvance?: () => Promise<void>;
}

const DISPLAY_OPTIONS = [
  ...WANTS_KIDS_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

export function WantsKidsStep({
  wantsKids,
  onWantsKidsChange,
  isPreferNot,
  onPreferNotChange,
  onAutoAdvance,
}: WantsKidsStepProps) {
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const currentSelected = isPreferNot ? "prefer_not_to_say" : wantsKids || null;

  const handleChange = (value: string) => {
    if (value === currentSelected) return;

    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onWantsKidsChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onWantsKidsChange(value as DbWantsKids);
    }

    if (onAutoAdvance) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        onAutoAdvance();
      }, 400);
    }
  };

  return (
    <OnboardingStepWrapper title="Do you want children?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={currentSelected}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
