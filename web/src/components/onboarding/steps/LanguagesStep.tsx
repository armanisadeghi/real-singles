"use client";

/**
 * LanguagesStep
 *
 * Step 15: Languages spoken (multi-select)
 */

import { OnboardingStepWrapper, OnboardingChips } from "../OnboardingStepWrapper";
import { LANGUAGE_OPTIONS } from "@/types";

interface LanguagesStepProps {
  languages: string[];
  onChange: (value: string[]) => void;
}

export function LanguagesStep({ languages, onChange }: LanguagesStepProps) {
  return (
    <OnboardingStepWrapper
      title="What languages do you speak?"
      subtitle="Select all that apply"
    >
      <OnboardingChips
        options={LANGUAGE_OPTIONS}
        selected={languages}
        onChange={onChange}
      />
    </OnboardingStepWrapper>
  );
}
