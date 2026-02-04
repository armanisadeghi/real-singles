"use client";

/**
 * HabitsStep
 *
 * Step 18: Smoking, Drinking, Marijuana
 */

import { OnboardingStepWrapper, OnboardingSelect, OnboardingSelectWithPreferNot } from "../OnboardingStepWrapper";
import { SMOKING_OPTIONS, DRINKING_OPTIONS, MARIJUANA_OPTIONS } from "@/types";

interface HabitsStepProps {
  smoking: string;
  drinking: string;
  marijuana: string;
  onSmokingChange: (value: string) => void;
  onDrinkingChange: (value: string) => void;
  onMarijuanaChange: (value: string) => void;
  isMarijuanaPreferNot: boolean;
  onMarijuanaPreferNotChange: (isPreferNot: boolean) => void;
}

export function HabitsStep({
  smoking,
  drinking,
  marijuana,
  onSmokingChange,
  onDrinkingChange,
  onMarijuanaChange,
  isMarijuanaPreferNot,
  onMarijuanaPreferNotChange,
}: HabitsStepProps) {
  // Filter out "prefer_not_to_say" from options
  const marijuanaOptions = MARIJUANA_OPTIONS.filter(
    (opt) => opt.value !== "prefer_not_to_say"
  );

  return (
    <OnboardingStepWrapper title="Your habits">
      <OnboardingSelect
        label="Smoking"
        options={SMOKING_OPTIONS}
        value={smoking}
        onChange={(e) => onSmokingChange(e.target.value)}
        placeholder="Select smoking habits"
      />

      <OnboardingSelect
        label="Drinking"
        options={DRINKING_OPTIONS}
        value={drinking}
        onChange={(e) => onDrinkingChange(e.target.value)}
        placeholder="Select drinking habits"
      />

      <OnboardingSelectWithPreferNot
        label="Marijuana"
        options={marijuanaOptions}
        value={marijuana}
        onChange={onMarijuanaChange}
        isPreferNot={isMarijuanaPreferNot}
        onPreferNotChange={onMarijuanaPreferNotChange}
        fieldDbColumn="marijuana"
        placeholder="Select marijuana use"
      />
    </OnboardingStepWrapper>
  );
}
