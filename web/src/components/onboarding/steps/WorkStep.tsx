"use client";

/**
 * WorkStep
 *
 * Step 11: Occupation and Company
 */

import { useEffect, useRef } from "react";
import { OnboardingStepWrapper, OnboardingInput } from "../OnboardingStepWrapper";

interface WorkStepProps {
  occupation: string;
  company: string;
  onOccupationChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
}

export function WorkStep({
  occupation,
  company,
  onOccupationChange,
  onCompanyChange,
}: WorkStepProps) {
  const occupationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      occupationRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingStepWrapper title="What do you do?" needsKeyboard>
      <OnboardingInput
        ref={occupationRef}
        label="Occupation"
        placeholder="Your job title"
        value={occupation}
        onChange={(e) => onOccupationChange(e.target.value)}
        maxLength={100}
        autoComplete="organization-title"
      />

      <OnboardingInput
        label="Company"
        placeholder="Where you work"
        value={company}
        onChange={(e) => onCompanyChange(e.target.value)}
        maxLength={100}
        autoComplete="organization"
      />
    </OnboardingStepWrapper>
  );
}
