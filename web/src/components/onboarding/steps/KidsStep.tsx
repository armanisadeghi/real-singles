"use client";

/**
 * KidsStep
 *
 * Step 17: Has kids and Wants kids
 */

import { OnboardingStepWrapper, OnboardingSelect } from "../OnboardingStepWrapper";
import { HAS_KIDS_OPTIONS, WANTS_KIDS_OPTIONS } from "@/types";

interface KidsStepProps {
  hasKids: string;
  wantsKids: string;
  onHasKidsChange: (value: string) => void;
  onWantsKidsChange: (value: string) => void;
}

export function KidsStep({
  hasKids,
  wantsKids,
  onHasKidsChange,
  onWantsKidsChange,
}: KidsStepProps) {
  return (
    <OnboardingStepWrapper title="About children">
      <OnboardingSelect
        label="Do you have children?"
        options={HAS_KIDS_OPTIONS}
        value={hasKids}
        onChange={(e) => onHasKidsChange(e.target.value)}
        placeholder="Select"
      />

      <OnboardingSelect
        label="Do you want children?"
        options={WANTS_KIDS_OPTIONS}
        value={wantsKids}
        onChange={(e) => onWantsKidsChange(e.target.value)}
        placeholder="Select"
      />
    </OnboardingStepWrapper>
  );
}
