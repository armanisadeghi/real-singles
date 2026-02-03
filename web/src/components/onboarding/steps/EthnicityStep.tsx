"use client";

/**
 * EthnicityStep
 *
 * Step 8: Ethnicity selection (multi-select)
 */

import { OnboardingStepWrapper, OnboardingChips } from "../OnboardingStepWrapper";
import { ETHNICITY_OPTIONS } from "@/types";

interface EthnicityStepProps {
  ethnicity: string[];
  onChange: (value: string[]) => void;
}

export function EthnicityStep({ ethnicity, onChange }: EthnicityStepProps) {
  // Filter out "prefer_not_to_say" from regular options (handled by navigation)
  const options = ETHNICITY_OPTIONS.filter(
    (opt) => opt.value !== "prefer_not_to_say"
  );

  return (
    <OnboardingStepWrapper
      title="What's your ethnicity?"
      subtitle="Select all that apply"
    >
      <OnboardingChips options={options} selected={ethnicity} onChange={onChange} />
    </OnboardingStepWrapper>
  );
}
