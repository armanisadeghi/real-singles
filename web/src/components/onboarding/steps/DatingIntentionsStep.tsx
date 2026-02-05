"use client";

/**
 * DatingIntentionsStep
 *
 * Step 12: Dating Intentions (split from old RelationshipGoalsStep)
 * Uses option cards for a clean, list-based selection.
 */

import {
  OnboardingStepWrapper,
  OnboardingOptionCards,
} from "../OnboardingStepWrapper";
import { DATING_INTENTIONS_OPTIONS } from "@/types";

interface DatingIntentionsStepProps {
  datingIntentions: string;
  onDatingIntentionsChange: (value: string) => void;
}

export function DatingIntentionsStep({
  datingIntentions,
  onDatingIntentionsChange,
}: DatingIntentionsStepProps) {
  return (
    <OnboardingStepWrapper
      title="What are you looking for?"
      subtitle="What kind of relationship interests you?"
    >
      <OnboardingOptionCards
        options={DATING_INTENTIONS_OPTIONS}
        selected={datingIntentions || null}
        onChange={onDatingIntentionsChange}
      />
    </OnboardingStepWrapper>
  );
}
