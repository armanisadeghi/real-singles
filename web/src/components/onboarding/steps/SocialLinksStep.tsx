"use client";

/**
 * SocialLinksStep
 *
 * Step 33: Social media links
 */

import { OnboardingStepWrapper, OnboardingInput } from "../OnboardingStepWrapper";

interface SocialLinksStepProps {
  socialLink1: string;
  socialLink2: string;
  onSocialLink1Change: (value: string) => void;
  onSocialLink2Change: (value: string) => void;
}

export function SocialLinksStep({
  socialLink1,
  socialLink2,
  onSocialLink1Change,
  onSocialLink2Change,
}: SocialLinksStepProps) {
  return (
    <OnboardingStepWrapper
      title="Connect your socials"
      subtitle="Optional — helps verify you're real"
      needsKeyboard
    >
      <OnboardingInput
        label="Social Link 1"
        placeholder="https://instagram.com/..."
        value={socialLink1}
        onChange={(e) => onSocialLink1Change(e.target.value)}
        type="url"
        maxLength={255}
        autoComplete="url"
      />

      <OnboardingInput
        label="Social Link 2"
        placeholder="https://linkedin.com/..."
        value={socialLink2}
        onChange={(e) => onSocialLink2Change(e.target.value)}
        type="url"
        maxLength={255}
        autoComplete="url"
      />
    </OnboardingStepWrapper>
  );
}
