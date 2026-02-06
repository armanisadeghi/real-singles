"use client";

/**
 * MaritalStatusStep
 *
 * Step 11: Marital Status (split from old RelationshipGoalsStep)
 * Uses option cards for a clean, list-based selection.
 * "Prefer not to say" is a UI-only card — it calls markFieldAsPreferNot()
 * which tracks the preference separately. The field value stays "" (unset),
 * which saveAndContinue strips before sending to the API.
 * Auto-advances after selection with a brief delay.
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DbMaritalStatus value.
 * The DB constraint only allows: never_married | separated | divorced | widowed
 */

import { useRef, useEffect } from "react";
import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { MARITAL_STATUS_OPTIONS } from "@/types";
import type { DbMaritalStatus } from "@/types/db-constraints";

interface MaritalStatusStepProps {
  maritalStatus: DbMaritalStatus | "";
  onMaritalStatusChange: (value: DbMaritalStatus | "") => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
  /** Called after selection to auto-advance to next step */
  onAutoAdvance?: () => Promise<void>;
}

/**
 * Display options include "Prefer not to say" as a UI-only option.
 * This value never reaches the API — it's intercepted by handleChange.
 */
const DISPLAY_OPTIONS = [
  ...MARITAL_STATUS_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

export function MaritalStatusStep({
  maritalStatus,
  onMaritalStatusChange,
  isPreferNot,
  onPreferNotChange,
  onAutoAdvance,
}: MaritalStatusStepProps) {
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const currentSelected = isPreferNot ? "prefer_not_to_say" : maritalStatus || null;

  const handleChange = (value: string) => {
    if (value === currentSelected) return;

    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onMaritalStatusChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onMaritalStatusChange(value as DbMaritalStatus);
    }

    if (onAutoAdvance) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        onAutoAdvance();
      }, 400);
    }
  };

  return (
    <OnboardingStepWrapper title="What's your marital status?">
      <OnboardingOptionCards
        options={DISPLAY_OPTIONS}
        selected={currentSelected}
        onChange={handleChange}
      />
    </OnboardingStepWrapper>
  );
}
