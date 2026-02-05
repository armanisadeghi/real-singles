"use client";

/**
 * NameStep
 *
 * Step 1: Display Name — what the user wants to be called publicly
 * (Legal first/last name is collected at registration)
 */

import { useEffect, useRef } from "react";
import {
  OnboardingStepWrapper,
  OnboardingInput,
} from "../OnboardingStepWrapper";

interface NameStepProps {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
}

export function NameStep({
  displayName,
  onDisplayNameChange,
}: NameStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingStepWrapper
      title="What should we call you?"
      subtitle="This is how other members will see you"
      needsKeyboard
    >
      <OnboardingInput
        ref={inputRef}
        placeholder="e.g. Kayla, KayLee, K..."
        value={displayName}
        onChange={(e) => onDisplayNameChange(e.target.value)}
        maxLength={50}
        autoCapitalize="words"
        autoComplete="nickname"
      />
    </OnboardingStepWrapper>
  );
}
