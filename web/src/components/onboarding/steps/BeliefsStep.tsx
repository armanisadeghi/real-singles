"use client";

/**
 * BeliefsStep
 *
 * Step 15: Religion and Political Views
 */

import { OnboardingStepWrapper, OnboardingSelectWithPreferNot } from "../OnboardingStepWrapper";
import { RELIGION_OPTIONS, POLITICAL_OPTIONS } from "@/types";

interface BeliefsStepProps {
  religion: string;
  politicalViews: string;
  onReligionChange: (value: string) => void;
  onPoliticalViewsChange: (value: string) => void;
  isReligionPreferNot: boolean;
  isPoliticalViewsPreferNot: boolean;
  onReligionPreferNotChange: (isPreferNot: boolean) => void;
  onPoliticalViewsPreferNotChange: (isPreferNot: boolean) => void;
}

export function BeliefsStep({
  religion,
  politicalViews,
  onReligionChange,
  onPoliticalViewsChange,
  isReligionPreferNot,
  isPoliticalViewsPreferNot,
  onReligionPreferNotChange,
  onPoliticalViewsPreferNotChange,
}: BeliefsStepProps) {
  // Filter out "prefer_not_to_say" from options if it exists
  const religionOptions = RELIGION_OPTIONS.filter(
    (opt) => opt.value !== ("prefer_not_to_say" as any)
  );
  const politicalOptions = POLITICAL_OPTIONS.filter(
    (opt) => opt.value !== ("prefer_not_to_say" as any)
  );

  return (
    <OnboardingStepWrapper title="Your beliefs">
      <OnboardingSelectWithPreferNot
        label="Religion"
        options={religionOptions}
        value={religion}
        onChange={onReligionChange}
        isPreferNot={isReligionPreferNot}
        onPreferNotChange={onReligionPreferNotChange}
        fieldDbColumn="religion"
        placeholder="Select religion"
      />

      <OnboardingSelectWithPreferNot
        label="Political Views"
        options={politicalOptions}
        value={politicalViews}
        onChange={onPoliticalViewsChange}
        isPreferNot={isPoliticalViewsPreferNot}
        onPreferNotChange={onPoliticalViewsPreferNotChange}
        fieldDbColumn="political_views"
        placeholder="Select political views"
      />
    </OnboardingStepWrapper>
  );
}
