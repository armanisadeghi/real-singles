"use client";

/**
 * HabitsStep
 *
 * Step 20: Smoking, Drinking, Marijuana
 * All three on same page using dropdowns (lists would cause scroll).
 * Each habit has its own "Prefer not to say" as a dropdown option.
 *
 * "Prefer not to say" is a UI-only option — tracked via markFieldAsPreferNot().
 * The field value stays "" (unset), which saveAndContinue strips before API calls.
 *
 * NOTE: "prefer_not_to_say" is NOT a valid DB value for any of these fields.
 */

import { OnboardingStepWrapper, OnboardingSelect } from "../OnboardingStepWrapper";
import { SMOKING_OPTIONS, DRINKING_OPTIONS, MARIJUANA_OPTIONS } from "@/types";
import type { DbSmoking, DbDrinking, DbMarijuana } from "@/types/db-constraints";

interface HabitsStepProps {
  smoking: DbSmoking | "";
  drinking: DbDrinking | "";
  marijuana: DbMarijuana | "";
  onSmokingChange: (value: DbSmoking | "") => void;
  onDrinkingChange: (value: DbDrinking | "") => void;
  onMarijuanaChange: (value: DbMarijuana | "") => void;
  // Per-field prefer not to say
  isSmokingPreferNot: boolean;
  isDrinkingPreferNot: boolean;
  isMarijuanaPreferNot: boolean;
  onSmokingPreferNotChange: (isPreferNot: boolean) => void;
  onDrinkingPreferNotChange: (isPreferNot: boolean) => void;
  onMarijuanaPreferNotChange: (isPreferNot: boolean) => void;
}

// Display options include "Prefer not to say" as a UI-only option
const SMOKING_DISPLAY = [
  ...SMOKING_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

const DRINKING_DISPLAY = [
  ...DRINKING_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

const MARIJUANA_DISPLAY = [
  ...MARIJUANA_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

export function HabitsStep({
  smoking,
  drinking,
  marijuana,
  onSmokingChange,
  onDrinkingChange,
  onMarijuanaChange,
  isSmokingPreferNot,
  isDrinkingPreferNot,
  isMarijuanaPreferNot,
  onSmokingPreferNotChange,
  onDrinkingPreferNotChange,
  onMarijuanaPreferNotChange,
}: HabitsStepProps) {
  const handleSmokingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "prefer_not_to_say") {
      onSmokingPreferNotChange(true);
      onSmokingChange("");
    } else {
      if (isSmokingPreferNot) onSmokingPreferNotChange(false);
      onSmokingChange(value as DbSmoking);
    }
  };

  const handleDrinkingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "prefer_not_to_say") {
      onDrinkingPreferNotChange(true);
      onDrinkingChange("");
    } else {
      if (isDrinkingPreferNot) onDrinkingPreferNotChange(false);
      onDrinkingChange(value as DbDrinking);
    }
  };

  const handleMarijuanaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "prefer_not_to_say") {
      onMarijuanaPreferNotChange(true);
      onMarijuanaChange("");
    } else {
      if (isMarijuanaPreferNot) onMarijuanaPreferNotChange(false);
      onMarijuanaChange(value as DbMarijuana);
    }
  };

  return (
    <OnboardingStepWrapper title="Your habits">
      <OnboardingSelect
        label="Smoking"
        options={SMOKING_DISPLAY}
        value={isSmokingPreferNot ? "prefer_not_to_say" : smoking}
        onChange={handleSmokingChange}
        placeholder="Select smoking habits"
      />

      <OnboardingSelect
        label="Drinking"
        options={DRINKING_DISPLAY}
        value={isDrinkingPreferNot ? "prefer_not_to_say" : drinking}
        onChange={handleDrinkingChange}
        placeholder="Select drinking habits"
      />

      <OnboardingSelect
        label="Marijuana"
        options={MARIJUANA_DISPLAY}
        value={isMarijuanaPreferNot ? "prefer_not_to_say" : marijuana}
        onChange={handleMarijuanaChange}
        placeholder="Select marijuana use"
      />
    </OnboardingStepWrapper>
  );
}
