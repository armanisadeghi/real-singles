"use client";

/**
 * LookingForStep
 *
 * Step 22: What I'm Looking For description
 */

import { useEffect, useRef } from "react";
import { OnboardingStepWrapper, OnboardingTextarea } from "../OnboardingStepWrapper";

interface LookingForStepProps {
  lookingForDescription: string;
  onChange: (value: string) => void;
}

export function LookingForStep({
  lookingForDescription,
  onChange,
}: LookingForStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingStepWrapper
      title="What are you looking for?"
      subtitle="Describe your ideal match"
      needsKeyboard
    >
      <OnboardingTextarea
        ref={textareaRef}
        placeholder="Describe what you're looking for in a partner..."
        value={lookingForDescription}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        rows={3}
      />
      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        {lookingForDescription.length}/500
      </p>
    </OnboardingStepWrapper>
  );
}
