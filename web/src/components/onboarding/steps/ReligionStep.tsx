"use client";

/**
 * ReligionStep
 *
 * Step 16: Religion (split from old BeliefsStep)
 * Uses select dropdown since 14 options would cause scroll as list cards.
 * "Prefer not to say" is included as a selectable dropdown option.
 */

import {
  OnboardingStepWrapper,
  OnboardingSelect,
} from "../OnboardingStepWrapper";
import { RELIGION_OPTIONS } from "@/types";

interface ReligionStepProps {
  religion: string;
  onReligionChange: (value: string) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
}

export function ReligionStep({
  religion,
  onReligionChange,
  isPreferNot,
  onPreferNotChange,
}: ReligionStepProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "prefer_not_to_say") {
      onPreferNotChange(true);
      onReligionChange("");
    } else {
      if (isPreferNot) {
        onPreferNotChange(false);
      }
      onReligionChange(value);
    }
  };

  return (
    <OnboardingStepWrapper title="What's your religion?">
      <OnboardingSelect
        options={RELIGION_OPTIONS}
        value={isPreferNot ? "prefer_not_to_say" : religion}
        onChange={handleChange}
        placeholder="Select your religion"
      />
    </OnboardingStepWrapper>
  );
}
