"use client";

/**
 * HabitsStep
 *
 * Step 16: Smoking, Drinking, Marijuana
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
}

export function HabitsStep({
  smoking,
  drinking,
  marijuana,
  onSmokingChange,
  onDrinkingChange,
  onMarijuanaChange,
}: HabitsStepProps) {
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

      <OnboardingSelect
        label="Marijuana"
        options={MARIJUANA_OPTIONS}
        value={marijuana}
        onChange={(e) => onMarijuanaChange(e.target.value)}
        placeholder="Select marijuana use"
      />
    </OnboardingStepWrapper>
  );
}
