"use client";

/**
 * ExerciseStep
 *
 * Step 14: Exercise frequency
 */

import { OnboardingStepWrapper, OnboardingOptionCards } from "../OnboardingStepWrapper";
import { EXERCISE_OPTIONS } from "@/types";

interface ExerciseStepProps {
  exercise: string | null;
  onChange: (value: string) => void;
}

export function ExerciseStep({ exercise, onChange }: ExerciseStepProps) {
  return (
    <OnboardingStepWrapper title="How often do you exercise?">
      <OnboardingOptionCards
        options={EXERCISE_OPTIONS}
        selected={exercise}
        onChange={onChange}
      />
    </OnboardingStepWrapper>
  );
}
