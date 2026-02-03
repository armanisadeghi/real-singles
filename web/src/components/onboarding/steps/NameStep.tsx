"use client";

/**
 * NameStep
 *
 * Step 1: First Name and Last Name
 */

import { useEffect, useRef } from "react";
import {
  OnboardingStepWrapper,
  OnboardingInput,
} from "../OnboardingStepWrapper";

interface NameStepProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
}

export function NameStep({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}: NameStepProps) {
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input
  useEffect(() => {
    const timer = setTimeout(() => {
      firstNameRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingStepWrapper
      title="What's your name?"
      subtitle="This is how you'll appear to others"
      needsKeyboard
    >
      <OnboardingInput
        ref={firstNameRef}
        placeholder="First name"
        value={firstName}
        onChange={(e) => onFirstNameChange(e.target.value)}
        maxLength={50}
        autoCapitalize="words"
        autoComplete="given-name"
      />
      <OnboardingInput
        placeholder="Last name"
        value={lastName}
        onChange={(e) => onLastNameChange(e.target.value)}
        maxLength={50}
        autoCapitalize="words"
        autoComplete="family-name"
      />
    </OnboardingStepWrapper>
  );
}
