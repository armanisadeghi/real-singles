"use client";

/**
 * InterestsStep
 *
 * Step 19: Interests (multi-select)
 */

import { OnboardingStepWrapper, OnboardingChips } from "../OnboardingStepWrapper";
import { INTEREST_OPTIONS } from "@/types";

interface InterestsStepProps {
  interests: string[];
  onChange: (value: string[]) => void;
}

export function InterestsStep({ interests, onChange }: InterestsStepProps) {
  return (
    <OnboardingStepWrapper
      title="What are your interests?"
      subtitle="Select what you enjoy"
    >
      <OnboardingChips
        options={INTEREST_OPTIONS}
        selected={interests}
        onChange={onChange}
      />
    </OnboardingStepWrapper>
  );
}
