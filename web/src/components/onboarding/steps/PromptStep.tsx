"use client";

/**
 * PromptStep
 *
 * Generic step for profile prompts (Steps 23-32)
 */

import { useEffect, useRef } from "react";
import {
  OnboardingStepWrapper,
  OnboardingTextarea,
  OnboardingInput,
} from "../OnboardingStepWrapper";

interface PromptStepProps {
  title: string;
  subtitle?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  isShortAnswer?: boolean;
}

export function PromptStep({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  maxLength = 500,
  isShortAnswer = false,
}: PromptStepProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingStepWrapper title={title} subtitle={subtitle} needsKeyboard>
      {isShortAnswer ? (
        <OnboardingInput
          ref={inputRef as React.RefObject<HTMLInputElement>}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      ) : (
        <OnboardingTextarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={3}
        />
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        {value.length}/{maxLength}
      </p>
    </OnboardingStepWrapper>
  );
}
