"use client";

/**
 * RelationshipGoalsStep
 *
 * Step 9: Dating Intentions and Marital Status
 */

import { OnboardingStepWrapper, OnboardingSelect } from "../OnboardingStepWrapper";
import { DATING_INTENTIONS_OPTIONS, MARITAL_STATUS_OPTIONS } from "@/types";

interface RelationshipGoalsStepProps {
  datingIntentions: string;
  maritalStatus: string;
  onDatingIntentionsChange: (value: string) => void;
  onMaritalStatusChange: (value: string) => void;
}

export function RelationshipGoalsStep({
  datingIntentions,
  maritalStatus,
  onDatingIntentionsChange,
  onMaritalStatusChange,
}: RelationshipGoalsStepProps) {
  return (
    <OnboardingStepWrapper title="What are you looking for?">
      <OnboardingSelect
        label="Dating Intentions"
        options={DATING_INTENTIONS_OPTIONS}
        value={datingIntentions}
        onChange={(e) => onDatingIntentionsChange(e.target.value)}
        placeholder="Select your intentions"
      />

      <OnboardingSelect
        label="Marital Status"
        options={MARITAL_STATUS_OPTIONS}
        value={maritalStatus}
        onChange={(e) => onMaritalStatusChange(e.target.value)}
        placeholder="Select status"
      />
    </OnboardingStepWrapper>
  );
}
