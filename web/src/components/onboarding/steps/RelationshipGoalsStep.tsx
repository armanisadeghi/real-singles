"use client";

/**
 * RelationshipGoalsStep
 *
 * Step 11: Dating Intentions and Marital Status
 */

import { OnboardingStepWrapper, OnboardingSelect, OnboardingSelectWithPreferNot } from "../OnboardingStepWrapper";
import { DATING_INTENTIONS_OPTIONS, MARITAL_STATUS_OPTIONS } from "@/types";

interface RelationshipGoalsStepProps {
  datingIntentions: string;
  maritalStatus: string;
  onDatingIntentionsChange: (value: string) => void;
  onMaritalStatusChange: (value: string) => void;
  isMaritalStatusPreferNot: boolean;
  onMaritalStatusPreferNotChange: (isPreferNot: boolean) => void;
}

export function RelationshipGoalsStep({
  datingIntentions,
  maritalStatus,
  onDatingIntentionsChange,
  onMaritalStatusChange,
  isMaritalStatusPreferNot,
  onMaritalStatusPreferNotChange,
}: RelationshipGoalsStepProps) {
  // Filter out "prefer_not_to_say" from options
  const maritalStatusOptions = MARITAL_STATUS_OPTIONS.filter(
    (opt) => opt.value !== "prefer_not_to_say"
  );

  return (
    <OnboardingStepWrapper title="What are you looking for?">
      <OnboardingSelect
        label="Dating Intentions"
        options={DATING_INTENTIONS_OPTIONS}
        value={datingIntentions}
        onChange={(e) => onDatingIntentionsChange(e.target.value)}
        placeholder="Select your intentions"
      />

      <OnboardingSelectWithPreferNot
        label="Marital Status"
        options={maritalStatusOptions}
        value={maritalStatus}
        onChange={onMaritalStatusChange}
        isPreferNot={isMaritalStatusPreferNot}
        onPreferNotChange={onMaritalStatusPreferNotChange}
        fieldDbColumn="marital_status"
        placeholder="Select status"
      />
    </OnboardingStepWrapper>
  );
}
