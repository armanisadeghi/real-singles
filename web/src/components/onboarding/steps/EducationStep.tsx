"use client";

/**
 * EducationStep
 *
 * Step 12: Education level
 */

import { OnboardingStepWrapper, OnboardingOptionCards } from "../OnboardingStepWrapper";
import { EDUCATION_OPTIONS } from "@/types";

interface EducationStepProps {
  education: string | null;
  onChange: (value: string) => void;
}

export function EducationStep({ education, onChange }: EducationStepProps) {
  return (
    <OnboardingStepWrapper title="What's your education?">
      <OnboardingOptionCards
        options={EDUCATION_OPTIONS}
        selected={education}
        onChange={onChange}
      />
    </OnboardingStepWrapper>
  );
}
