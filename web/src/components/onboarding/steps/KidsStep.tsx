"use client";

/**
 * KidsStep
 *
 * Step 19: Has kids and Wants kids
 */

import { OnboardingStepWrapper, OnboardingSelectWithPreferNot } from "../OnboardingStepWrapper";
import { HAS_KIDS_OPTIONS, WANTS_KIDS_OPTIONS } from "@/types";

interface KidsStepProps {
  hasKids: string;
  wantsKids: string;
  onHasKidsChange: (value: string) => void;
  onWantsKidsChange: (value: string) => void;
  isHasKidsPreferNot: boolean;
  isWantsKidsPreferNot: boolean;
  onHasKidsPreferNotChange: (isPreferNot: boolean) => void;
  onWantsKidsPreferNotChange: (isPreferNot: boolean) => void;
}

export function KidsStep({
  hasKids,
  wantsKids,
  onHasKidsChange,
  onWantsKidsChange,
  isHasKidsPreferNot,
  isWantsKidsPreferNot,
  onHasKidsPreferNotChange,
  onWantsKidsPreferNotChange,
}: KidsStepProps) {
  // Filter out "prefer_not_to_say" from options if it exists
  const hasKidsOptions = HAS_KIDS_OPTIONS.filter(
    (opt) => opt.value !== ("prefer_not_to_say" as any)
  );
  const wantsKidsOptions = WANTS_KIDS_OPTIONS.filter(
    (opt) => opt.value !== ("prefer_not_to_say" as any)
  );

  return (
    <OnboardingStepWrapper title="About children">
      <OnboardingSelectWithPreferNot
        label="Do you have children?"
        options={hasKidsOptions}
        value={hasKids}
        onChange={onHasKidsChange}
        isPreferNot={isHasKidsPreferNot}
        onPreferNotChange={onHasKidsPreferNotChange}
        fieldDbColumn="has_kids"
        placeholder="Select"
      />

      <OnboardingSelectWithPreferNot
        label="Do you want children?"
        options={wantsKidsOptions}
        value={wantsKids}
        onChange={onWantsKidsChange}
        isPreferNot={isWantsKidsPreferNot}
        onPreferNotChange={onWantsKidsPreferNotChange}
        fieldDbColumn="wants_kids"
        placeholder="Select"
      />
    </OnboardingStepWrapper>
  );
}
