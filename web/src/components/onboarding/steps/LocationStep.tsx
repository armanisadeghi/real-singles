"use client";

/**
 * LocationStep
 *
 * Step 13: Country, City, and Zip Code
 * Zip code is used for finding nearby matches.
 */

import { OnboardingStepWrapper, OnboardingSelect, OnboardingInput } from "../OnboardingStepWrapper";
import { COUNTRY_OPTIONS } from "@/types";

interface LocationStepProps {
  country: string;
  city: string;
  zipCode: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
}

export function LocationStep({
  country,
  city,
  zipCode,
  onCountryChange,
  onCityChange,
  onZipCodeChange,
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

      <OnboardingInput
        label="Zip / Postal Code"
        placeholder="Enter your zip code"
        value={zipCode}
        onChange={(e) => onZipCodeChange(e.target.value)}
        maxLength={20}
        autoComplete="postal-code"
        hint="Used for finding nearby matches"
      />
    </OnboardingStepWrapper>
  );
}
