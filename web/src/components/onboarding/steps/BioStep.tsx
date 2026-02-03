"use client";

/**
 * BioStep
 *
 * Step 21: Bio / About Me
 */

import { useEffect, useRef } from "react";
import { OnboardingStepWrapper, OnboardingTextarea } from "../OnboardingStepWrapper";

interface BioStepProps {
  bio: string;
  onChange: (value: string) => void;
}

export function BioStep({ bio, onChange }: BioStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingStepWrapper
      title="Tell us about yourself"
      subtitle="Write a short bio"
      needsKeyboard
    >
      <OnboardingTextarea
        ref={textareaRef}
        placeholder="Share something interesting about yourself..."
        value={bio}
        onChange={(e) => onChange(e.target.value)}
        maxLength={1000}
        rows={4}
      />
      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        {bio.length}/1000
      </p>
    </OnboardingStepWrapper>
  );
}
