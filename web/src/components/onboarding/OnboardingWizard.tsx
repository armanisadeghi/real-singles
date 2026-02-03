"use client";

/**
 * OnboardingWizard
 *
 * Main wizard component that orchestrates the onboarding flow.
 */

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingNav } from "./OnboardingNav";
import { Loader2 } from "lucide-react";

// Step components
import {
  NameStep,
  BirthdayStep,
  GenderStep,
  InterestedInStep,
  PhotosStep,
  VerificationSelfieStep,
  PhysicalStep,
  EthnicityStep,
  RelationshipGoalsStep,
  LocationStep,
  WorkStep,
  EducationStep,
  BeliefsStep,
  ExerciseStep,
  LanguagesStep,
  HabitsStep,
  KidsStep,
  PetsStep,
  InterestsStep,
  LifeGoalsStep,
  BioStep,
  LookingForStep,
  PromptStep,
  SocialLinksStep,
  CompleteStep,
} from "./steps";

interface OnboardingWizardProps {
  resume?: boolean;
  targetStep?: number; // Go directly to this step (overrides resume)
}

export function OnboardingWizard({ resume = false, targetStep }: OnboardingWizardProps) {
  const router = useRouter();

  const {
    currentStep,
    currentStepConfig,
    stepValues,
    isLoading,
    isSaving,
    error,
    profile,
    photoCount,
    completion,
    goBack,
    canGoBack,
    setFieldValue,
    setMultipleValues,
    saveAndContinue,
    saveAndSkip,
    saveAsPreferNot,
    refreshProfile,
  } = useOnboarding({ resume, targetStep });

  // Check if current step can continue (has required values)
  const canContinue = useMemo(() => {
    if (!currentStepConfig) return false;

    // Complete step always can continue (no fields)
    if (currentStepConfig.id === "complete") return true;

    // Photos step - check if at least 1 photo
    if (currentStepConfig.id === "photos") {
      return photoCount >= 1 || !!profile?.profile_image_url;
    }

    // Verification selfie - always can continue (optional)
    if (currentStepConfig.id === "verification-selfie") {
      return true;
    }

    // For required steps, check if all fields have values
    if (currentStepConfig.isRequired) {
      for (const field of currentStepConfig.fields) {
        const value = stepValues[field.key];
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return false;
        }
      }
    }

    return true;
  }, [currentStepConfig, stepValues, photoCount, profile]);

  // Handle close/exit
  const handleClose = useCallback(() => {
    router.push("/profile");
  }, [router]);

  // Convert height to feet/inches
  const heightInches = stepValues.HeightInches as number | undefined;
  const heightFeet = heightInches ? Math.floor(heightInches / 12).toString() : "";
  const heightInchesRemainder = heightInches ? (heightInches % 12).toString() : "";

  // Height change handlers
  const handleHeightFeetChange = useCallback(
    (feet: string) => {
      const inches = stepValues.HeightInches
        ? (stepValues.HeightInches as number) % 12
        : 0;
      if (feet) {
        setFieldValue("HeightInches", parseInt(feet) * 12 + inches);
      }
    },
    [stepValues.HeightInches, setFieldValue]
  );

  const handleHeightInchesChange = useCallback(
    (inches: string) => {
      const feet = stepValues.HeightInches
        ? Math.floor((stepValues.HeightInches as number) / 12)
        : 5;
      if (inches !== undefined) {
        setFieldValue("HeightInches", feet * 12 + parseInt(inches || "0"));
      }
    },
    [stepValues.HeightInches, setFieldValue]
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (currentStepConfig?.id) {
      case "name":
        return (
          <NameStep
            firstName={(stepValues.FirstName as string) || ""}
            lastName={(stepValues.LastName as string) || ""}
            onFirstNameChange={(v) => setFieldValue("FirstName", v)}
            onLastNameChange={(v) => setFieldValue("LastName", v)}
          />
        );

      case "birthday":
        return (
          <BirthdayStep
            dateOfBirth={(stepValues.DateOfBirth as string) || ""}
            onChange={(v) => setFieldValue("DateOfBirth", v)}
          />
        );

      case "gender":
        return (
          <GenderStep
            gender={(stepValues.Gender as string) || null}
            onChange={(v) => setFieldValue("Gender", v)}
          />
        );

      case "interested-in":
        return (
          <InterestedInStep
            lookingFor={(stepValues.LookingFor as string[]) || []}
            onChange={(v) => setFieldValue("LookingFor", v)}
          />
        );

      case "photos":
        return (
          <PhotosStep photoCount={photoCount} onPhotosChange={refreshProfile} />
        );

      case "verification-selfie":
        return (
          <VerificationSelfieStep
            hasVerificationSelfie={!!profile?.verification_selfie_url}
            onSelfieChange={refreshProfile}
          />
        );

      case "physical":
        return (
          <PhysicalStep
            heightFeet={heightFeet}
            heightInches={heightInchesRemainder}
            bodyType={(stepValues.BodyType as string) || ""}
            onHeightFeetChange={handleHeightFeetChange}
            onHeightInchesChange={handleHeightInchesChange}
            onBodyTypeChange={(v) => setFieldValue("BodyType", v)}
          />
        );

      case "ethnicity":
        return (
          <EthnicityStep
            ethnicity={(stepValues.Ethnicity as string[]) || []}
            onChange={(v) => setFieldValue("Ethnicity", v)}
          />
        );

      case "relationship-goals":
        return (
          <RelationshipGoalsStep
            datingIntentions={(stepValues.DatingIntentions as string) || ""}
            maritalStatus={(stepValues.MaritalStatus as string) || ""}
            onDatingIntentionsChange={(v) => setFieldValue("DatingIntentions", v)}
            onMaritalStatusChange={(v) => setFieldValue("MaritalStatus", v)}
          />
        );

      case "location":
        return (
          <LocationStep
            country={(stepValues.Country as string) || ""}
            city={(stepValues.City as string) || ""}
            onCountryChange={(v) => setFieldValue("Country", v)}
            onCityChange={(v) => setFieldValue("City", v)}
          />
        );

      case "work":
        return (
          <WorkStep
            occupation={(stepValues.Occupation as string) || ""}
            company={(stepValues.Company as string) || ""}
            onOccupationChange={(v) => setFieldValue("Occupation", v)}
            onCompanyChange={(v) => setFieldValue("Company", v)}
          />
        );

      case "education":
        return (
          <EducationStep
            education={(stepValues.Education as string) || null}
            onChange={(v) => setFieldValue("Education", v)}
          />
        );

      case "beliefs":
        return (
          <BeliefsStep
            religion={(stepValues.Religion as string) || ""}
            politicalViews={(stepValues.PoliticalViews as string) || ""}
            onReligionChange={(v) => setFieldValue("Religion", v)}
            onPoliticalViewsChange={(v) => setFieldValue("PoliticalViews", v)}
          />
        );

      case "exercise":
        return (
          <ExerciseStep
            exercise={(stepValues.Exercise as string) || null}
            onChange={(v) => setFieldValue("Exercise", v)}
          />
        );

      case "languages":
        return (
          <LanguagesStep
            languages={(stepValues.Languages as string[]) || []}
            onChange={(v) => setFieldValue("Languages", v)}
          />
        );

      case "habits":
        return (
          <HabitsStep
            smoking={(stepValues.Smoking as string) || ""}
            drinking={(stepValues.Drinking as string) || ""}
            marijuana={(stepValues.Marijuana as string) || ""}
            onSmokingChange={(v) => setFieldValue("Smoking", v)}
            onDrinkingChange={(v) => setFieldValue("Drinking", v)}
            onMarijuanaChange={(v) => setFieldValue("Marijuana", v)}
          />
        );

      case "kids":
        return (
          <KidsStep
            hasKids={(stepValues.HasKids as string) || ""}
            wantsKids={(stepValues.WantsKids as string) || ""}
            onHasKidsChange={(v) => setFieldValue("HasKids", v)}
            onWantsKidsChange={(v) => setFieldValue("WantsKids", v)}
          />
        );

      case "pets":
        return (
          <PetsStep
            pets={(stepValues.Pets as string[]) || []}
            onChange={(v) => setFieldValue("Pets", v)}
          />
        );

      case "interests":
        return (
          <InterestsStep
            interests={(stepValues.Interests as string[]) || []}
            onChange={(v) => setFieldValue("Interests", v)}
          />
        );

      case "life-goals":
        return (
          <LifeGoalsStep
            lifeGoals={(stepValues.LifeGoals as string[]) || []}
            onChange={(v) => setFieldValue("LifeGoals", v)}
          />
        );

      case "bio":
        return (
          <BioStep
            bio={(stepValues.Bio as string) || ""}
            onChange={(v) => setFieldValue("Bio", v)}
          />
        );

      case "looking-for-description":
        return (
          <LookingForStep
            lookingForDescription={(stepValues.LookingForDescription as string) || ""}
            onChange={(v) => setFieldValue("LookingForDescription", v)}
          />
        );

      case "prompt-ideal-date":
        return (
          <PromptStep
            title="My ideal first date..."
            subtitle="...starts with and ends with"
            placeholder="Tell us about your perfect first date..."
            value={(stepValues.IdealFirstDate as string) || ""}
            onChange={(v) => setFieldValue("IdealFirstDate", v)}
          />
        );

      case "prompt-non-negotiables":
        return (
          <PromptStep
            title="My top non-negotiables"
            placeholder="What are your deal-breakers?"
            value={(stepValues.NonNegotiables as string) || ""}
            onChange={(v) => setFieldValue("NonNegotiables", v)}
          />
        );

      case "prompt-way-to-heart":
        return (
          <PromptStep
            title="The way to my heart is through..."
            placeholder="What wins you over?"
            value={(stepValues.WayToHeart as string) || ""}
            onChange={(v) => setFieldValue("WayToHeart", v)}
          />
        );

      case "prompt-after-work":
        return (
          <PromptStep
            title="After work, you can find me..."
            placeholder="How do you unwind?"
            value={(stepValues.AfterWork as string) || ""}
            onChange={(v) => setFieldValue("AfterWork", v)}
          />
        );

      case "prompt-nightclub-or-home":
        return (
          <PromptStep
            title="Nightclub or night at home?"
            placeholder="Your preference and why"
            value={(stepValues.NightclubOrHome as string) || ""}
            onChange={(v) => setFieldValue("NightclubOrHome", v)}
            maxLength={200}
            isShortAnswer
          />
        );

      case "prompt-pet-peeves":
        return (
          <PromptStep
            title="My pet peeves"
            placeholder="What grinds your gears?"
            value={(stepValues.PetPeeves as string) || ""}
            onChange={(v) => setFieldValue("PetPeeves", v)}
          />
        );

      case "prompt-travel-story":
        return (
          <PromptStep
            title="My craziest travel story"
            placeholder="Share an adventure..."
            value={(stepValues.CraziestTravelStory as string) || ""}
            onChange={(v) => setFieldValue("CraziestTravelStory", v)}
          />
        );

      case "prompt-weirdest-gift":
        return (
          <PromptStep
            title="The weirdest gift I've received"
            placeholder="What was it?"
            value={(stepValues.WeirdestGift as string) || ""}
            onChange={(v) => setFieldValue("WeirdestGift", v)}
          />
        );

      case "prompt-worst-job":
        return (
          <PromptStep
            title="The worst job I ever had"
            placeholder="We've all been there..."
            value={(stepValues.WorstJob as string) || ""}
            onChange={(v) => setFieldValue("WorstJob", v)}
          />
        );

      case "prompt-dream-job":
        return (
          <PromptStep
            title="The job I'd do for free"
            placeholder="What's your passion?"
            value={(stepValues.DreamJob as string) || ""}
            onChange={(v) => setFieldValue("DreamJob", v)}
          />
        );

      case "social-links":
        return (
          <SocialLinksStep
            socialLink1={(stepValues.SocialLink1 as string) || ""}
            socialLink2={(stepValues.SocialLink2 as string) || ""}
            onSocialLink1Change={(v) => setFieldValue("SocialLink1", v)}
            onSocialLink2Change={(v) => setFieldValue("SocialLink2", v)}
          />
        );

      case "complete":
        return (
          <CompleteStep
            completion={completion}
            firstName={(stepValues.FirstName as string) || ""}
          />
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Unknown step</p>
          </div>
        );
    }
  };

  // Complete step has no navigation
  const isCompleteStep = currentStepConfig?.id === "complete";

  return (
    <>
      {/* Progress header */}
      <OnboardingProgress
        currentStep={currentStep}
        completionPercentage={completion?.percentage ?? 0}
        onClose={handleClose}
      />

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        </div>
      )}

      {/* Step content */}
      {renderStep()}

      {/* Navigation footer (hidden on complete step) */}
      {!isCompleteStep && (
        <OnboardingNav
          onBack={goBack}
          onSkip={currentStepConfig?.allowSkip ? saveAndSkip : undefined}
          onPreferNot={
            currentStepConfig?.allowPreferNot ? saveAsPreferNot : undefined
          }
          onContinue={saveAndContinue}
          canGoBack={canGoBack}
          canSkip={currentStepConfig?.allowSkip ?? false}
          canPreferNot={currentStepConfig?.allowPreferNot ?? false}
          canContinue={canContinue}
          isSaving={isSaving}
          isRequired={currentStepConfig?.isRequired ?? false}
          continueLabel={
            currentStep === 33 ? "Finish" : "Continue"
          }
        />
      )}
    </>
  );
}
