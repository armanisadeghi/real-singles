"use client";

/**
 * GenderStep
 *
 * Step 3: Gender selection
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { GENDER_OPTIONS } from "@/types";

interface GenderStepProps {
  gender: string | null;
  onChange: (value: string) => void;
}

export function GenderStep({ gender, onChange }: GenderStepProps) {
  return (
    <OnboardingStepWrapper title="What's your gender?">
      <OnboardingOptionCards
        options={GENDER_OPTIONS}
        selected={gender}
        onChange={onChange}
      />
    </OnboardingStepWrapper>
  );
}
