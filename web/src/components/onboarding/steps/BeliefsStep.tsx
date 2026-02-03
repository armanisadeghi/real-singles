"use client";

/**
 * BeliefsStep
 *
 * Step 13: Religion and Political Views
 */

import { OnboardingStepWrapper, OnboardingSelect } from "../OnboardingStepWrapper";
import { RELIGION_OPTIONS, POLITICAL_OPTIONS } from "@/types";

interface BeliefsStepProps {
  religion: string;
  politicalViews: string;
  onReligionChange: (value: string) => void;
  onPoliticalViewsChange: (value: string) => void;
}

export function BeliefsStep({
  religion,
  politicalViews,
  onReligionChange,
  onPoliticalViewsChange,
}: BeliefsStepProps) {
  // Filter out "prefer_not_to_say" from options
  const religionOptions = RELIGION_OPTIONS.filter(
    (opt) => opt.value !== "prefer_not_to_say"
  );

  return (
    <OnboardingStepWrapper title="Your beliefs">
      <OnboardingSelect
        label="Religion"
        options={religionOptions}
        value={religion}
        onChange={(e) => onReligionChange(e.target.value)}
        placeholder="Select religion"
      />

      <OnboardingSelect
        label="Political Views"
        options={POLITICAL_OPTIONS}
        value={politicalViews}
        onChange={(e) => onPoliticalViewsChange(e.target.value)}
        placeholder="Select political views"
      />
    </OnboardingStepWrapper>
  );
}
