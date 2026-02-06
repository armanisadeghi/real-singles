"use client";

/**
 * ReligionStep
 *
 * Step 16: Religion (split from old BeliefsStep)
 * Uses scrollable option cards for a visual list-based selection.
 * "Prefer not to say" is a UI-only card — tracked via markFieldAsPreferNot().
 * Auto-advances after selection with a brief delay.
 */

import { useRef, useEffect } from "react";
import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { RELIGION_OPTIONS } from "@/types";

/** Display options — use the typed RELIGION_OPTIONS but filter out prefer_not_to_say
 *  (it's in the DB constraint but handled as UI-only like other steps) */
const DISPLAY_OPTIONS = [
  ...RELIGION_OPTIONS.filter((o) => o.value !== "prefer_not_to_say"),
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

interface ReligionStepProps {
  religion: string;
  onReligionChange: (value: string) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
  /** Called after selection to auto-advance to next step */
  onAutoAdvance?: () => Promise<void>;
}

export function ReligionStep({
  religion,
  onReligionChange,
  isPreferNot,
  onPreferNotChange,
  onAutoAdvance,
}: ReligionStepProps) {
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const currentSelected = isPreferNot ? "prefer_not_to_say" : religion || null;

  const handleChange = (value: string) => {
    if (value === currentSelected) return;

    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onReligionChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onReligionChange(value);
    }

    if (onAutoAdvance) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        onAutoAdvance();
      }, 400);
    }
  };

  return (
    <OnboardingStepWrapper title="What's your religion?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={currentSelected}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
