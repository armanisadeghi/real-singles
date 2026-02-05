"use client";

/**
 * InterestedInStep
 *
 * Step 4: Who are you interested in? (Multi-select)
 * Uses OnboardingOptionCardsMulti for consistency with GenderStep's card style.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCardsMulti,
} from "../OnboardingStepWrapper";
import { GENDER_OPTIONS } from "@/types";

interface InterestedInStepProps {
  lookingFor: string[];
  onChange: (value: string[]) => void;
}

export function InterestedInStep({
  lookingFor,
  onChange,
}: InterestedInStepProps) {
  return (
    <OnboardingStepWrapper
      title="Who are you interested in?"
      subtitle="Select all that apply"
    >
      <OnboardingOptionCardsMulti
        options={GENDER_OPTIONS}
        selected={lookingFor}
        onChange={onChange}
      />
    </OnboardingStepWrapper>
  );
}
