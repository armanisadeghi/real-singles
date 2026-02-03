"use client";

/**
 * PetsStep
 *
 * Step 18: Pets (multi-select)
 */

import { OnboardingStepWrapper, OnboardingChips } from "../OnboardingStepWrapper";
import { PETS_OPTIONS } from "@/types";

interface PetsStepProps {
  pets: string[];
  onChange: (value: string[]) => void;
}

export function PetsStep({ pets, onChange }: PetsStepProps) {
  return (
    <OnboardingStepWrapper
      title="Do you have pets?"
      subtitle="Select all that apply"
    >
      <OnboardingChips options={PETS_OPTIONS} selected={pets} onChange={onChange} />
    </OnboardingStepWrapper>
  );
}
