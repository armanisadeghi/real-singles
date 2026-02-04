"use client";

/**
 * EthnicityStep
 *
 * Step 10: Ethnicity selection (multi-select)
 */

import { OnboardingStepWrapper, OnboardingChipsWithPreferNot } from "../OnboardingStepWrapper";
import { ETHNICITY_OPTIONS } from "@/types";

interface EthnicityStepProps {
  ethnicity: string[];
  onChange: (value: string[]) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

export function EthnicityStep({ ethnicity, onChange, isPreferNot, onPreferNotChange }: EthnicityStepProps) {
  // Filter out "prefer_not_to_say" from regular options (handled by checkbox)
  const options = ETHNICITY_OPTIONS.filter(
    (opt) => opt.value !== "prefer_not_to_say"
  );

  return (
    <OnboardingStepWrapper
      title="What's your ethnicity?"
      subtitle="Select all that apply"
    >
      <OnboardingChipsWithPreferNot 
        options={options} 
        selected={ethnicity} 
        onChange={onChange}
        isPreferNot={isPreferNot}
        onPreferNotChange={onPreferNotChange}
        fieldDbColumn="ethnicity"
      />
    </OnboardingStepWrapper>
  );
}
