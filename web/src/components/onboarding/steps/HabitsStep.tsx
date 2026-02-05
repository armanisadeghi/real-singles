"use client";

/**
 * HabitsStep
 *
 * Step 20: Smoking, Drinking, Marijuana
 * All three on same page using dropdowns (lists would cause scroll).
 * Each habit has its own "Prefer not to say" as a dropdown option.
 */

import { OnboardingStepWrapper, OnboardingSelect } from "../OnboardingStepWrapper";
import { SMOKING_OPTIONS, DRINKING_OPTIONS, MARIJUANA_OPTIONS } from "@/types";

interface HabitsStepProps {
  smoking: string;
  drinking: string;
  marijuana: string;
  onSmokingChange: (value: string) => void;
  onDrinkingChange: (value: string) => void;
  onMarijuanaChange: (value: string) => void;
  // Per-field prefer not to say
  isSmokingPreferNot: boolean;
  isDrinkingPreferNot: boolean;
  isMarijuanaPreferNot: boolean;
  onSmokingPreferNotChange: (isPreferNot: boolean) => void;
  onDrinkingPreferNotChange: (isPreferNot: boolean) => void;
  onMarijuanaPreferNotChange: (isPreferNot: boolean) => void;
}

// Extend each options array with "Prefer not to say" as a selectable dropdown option
const SMOKING_WITH_PREFER = [
  ...SMOKING_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

const DRINKING_WITH_PREFER = [
  ...DRINKING_OPTIONS,
  { value: "prefer_not_to_say" as const, label: "Prefer not to say" },
];

const MARIJUANA_WITH_PREFER = [
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
      onSmokingChange(value);
    }
  };

  const handleDrinkingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "prefer_not_to_say") {
      onDrinkingPreferNotChange(true);
      onDrinkingChange("");
    } else {
      if (isDrinkingPreferNot) onDrinkingPreferNotChange(false);
      onDrinkingChange(value);
    }
  };

  const handleMarijuanaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "prefer_not_to_say") {
      onMarijuanaPreferNotChange(true);
      onMarijuanaChange("");
    } else {
      if (isMarijuanaPreferNot) onMarijuanaPreferNotChange(false);
      onMarijuanaChange(value);
    }
  };

  return (
    <OnboardingStepWrapper title="Your habits">
      <OnboardingSelect
        label="Smoking"
        options={SMOKING_WITH_PREFER}
        value={isSmokingPreferNot ? "prefer_not_to_say" : smoking}
        onChange={handleSmokingChange}
        placeholder="Select smoking habits"
      />

      <OnboardingSelect
        label="Drinking"
        options={DRINKING_WITH_PREFER}
        value={isDrinkingPreferNot ? "prefer_not_to_say" : drinking}
        onChange={handleDrinkingChange}
        placeholder="Select drinking habits"
      />

      <OnboardingSelect
        label="Marijuana"
        options={MARIJUANA_WITH_PREFER}
        value={isMarijuanaPreferNot ? "prefer_not_to_say" : marijuana}
        onChange={handleMarijuanaChange}
        placeholder="Select marijuana use"
      />
    </OnboardingStepWrapper>
  );
}
