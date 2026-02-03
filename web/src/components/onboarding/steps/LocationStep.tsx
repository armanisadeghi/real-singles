"use client";

/**
 * LocationStep
 *
 * Step 10: Country and City
 */

import { OnboardingStepWrapper, OnboardingSelect, OnboardingInput } from "../OnboardingStepWrapper";
import { COUNTRY_OPTIONS } from "@/types";

interface LocationStepProps {
  country: string;
  city: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
}

export function LocationStep({
  country,
  city,
  onCountryChange,
  onCityChange,
}: LocationStepProps) {
  return (
    <OnboardingStepWrapper title="Where do you live?" needsKeyboard>
      <OnboardingSelect
        label="Country"
        options={COUNTRY_OPTIONS}
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        placeholder="Select country"
      />

      <OnboardingInput
        label="City"
        placeholder="Enter your city"
        value={city}
        onChange={(e) => onCityChange(e.target.value)}
        maxLength={100}
        autoComplete="address-level2"
      />
    </OnboardingStepWrapper>
  );
}
