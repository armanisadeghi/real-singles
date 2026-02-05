"use client";

/**
 * useOnboarding Hook
 *
 * Central state management for the onboarding wizard.
 * Handles navigation, data persistence, and completion tracking.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ONBOARDING_STEPS,
  TOTAL_STEPS,
  getStepByNumber,
  type OnboardingStep,
} from "@/lib/onboarding/steps-config";
import {
  calculateCompletion,
  getResumeStep,
  isStepComplete,
  getNextIncompleteStepAfter,
  hasCompletedStepsAhead,
  type ProfileData,
  type CompletionStatus,
} from "@/lib/onboarding/completion";

// ============================================
// TYPES
// ============================================

export type SaveAction = "continue" | "skip" | "prefer_not" | "back";

export interface StepValues {
  [key: string]: unknown;
}

export interface UseOnboardingOptions {
  initialStep?: number;
  resume?: boolean;
  targetStep?: number; // Go directly to this step (overrides resume behavior)
}

export interface UseOnboardingReturn {
  // Current state
  currentStep: number;
  currentStepConfig: OnboardingStep | undefined;
  stepValues: StepValues;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Profile data
  profile: ProfileData | null;
  photoCount: number;
  completion: CompletionStatus | null;

  // Navigation
  goToStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;

  // Data management
  setFieldValue: (key: string, value: unknown) => void;
  setMultipleValues: (values: StepValues) => void;
  saveAndContinue: () => Promise<void>;
  saveAndSkip: () => Promise<void>;
  saveAsPreferNot: () => Promise<void>;

  // Per-field prefer not to say
  markFieldAsPreferNot: (fieldKey: string) => Promise<void>;
  removeFieldFromPreferNot: (fieldKey: string) => Promise<void>;
  isFieldPreferNot: (fieldKey: string) => boolean;

  // Utilities
  isStepComplete: (stepNumber: number) => boolean;
  refreshProfile: () => Promise<void>;
  
  // Skip ahead
  nextIncompleteStep: number | null;
  canSkipAhead: boolean;
  skipToNextIncomplete: () => void;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useOnboarding(
  options: UseOnboardingOptions = {}
): UseOnboardingReturn {
  const { initialStep = 1, resume = false, targetStep } = options;
  const router = useRouter();

  // Use refs to avoid dependency issues
  const resumeRef = useRef(resume);
  const targetStepRef = useRef(targetStep);
  const hasInitializedRef = useRef(false);

  // Core state
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepValues, setStepValues] = useState<StepValues>({});
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const currentStepConfig = useMemo(
    () => getStepByNumber(currentStep),
    [currentStep]
  );

  const completion = useMemo(
    () => (profile ? calculateCompletion(profile, photoCount) : null),
    [profile, photoCount]
  );

  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < TOTAL_STEPS;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchProfile = useCallback(async (shouldSetStep: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch profile data
      const profileRes = await fetch("/api/users/me");
      if (!profileRes.ok) {
        throw new Error("Failed to fetch profile");
      }
      const profileJson = await profileRes.json();
      
      // API returns { success, data, msg } - extract data
      const profileData = profileJson.data || profileJson;

      // Fetch completion data (includes photo count)
      const completionRes = await fetch("/api/profile/completion");
      if (!completionRes.ok) {
        throw new Error("Failed to fetch completion status");
      }
      const completionData = await completionRes.json();

      // Convert API response to snake_case profile data
      // Note: API uses DOB not DateOfBirth
      const fetchedProfile: ProfileData = {
        display_name: profileData.DisplayName || "",
        first_name: profileData.FirstName || "",
        last_name: profileData.LastName || "",
        date_of_birth: profileData.DOB || "", // API uses DOB
        gender: profileData.Gender || "",
        looking_for: profileData.LookingFor || [],
        profile_image_url: profileData.ProfileImageUrl || "",
        verification_selfie_url: profileData.VerificationSelfieUrl || "",
        height_inches: profileData.HeightInches || null,
        body_type: profileData.BodyType || "",
        ethnicity: profileData.Ethnicity || [],
        dating_intentions: profileData.DatingIntentions || "",
        marital_status: profileData.MaritalStatus || "",
        country: profileData.Country || "",
        city: profileData.City || "",
        state: profileData.State || "",
        occupation: profileData.Occupation || "",
        company: profileData.Company || "",
        education: profileData.Education || "",
        religion: profileData.Religion || "",
        political_views: profileData.PoliticalViews || profileData.Political || "",
        exercise: profileData.Exercise || "",
        languages: profileData.Languages || [],
        smoking: profileData.Smoking || "",
        drinking: profileData.Drinking || "",
        marijuana: profileData.Marijuana || "",
        has_kids: profileData.HasKids || "",
        wants_kids: profileData.WantsKids || "",
        pets: profileData.Pets || [],
        interests: profileData.Interests || [],
        life_goals: profileData.LifeGoals || [],
        bio: profileData.Bio || profileData.About || "",
        looking_for_description: profileData.LookingForDescription || "",
        ideal_first_date: profileData.IdealFirstDate || "",
        non_negotiables: profileData.NonNegotiables || "",
        way_to_heart: profileData.WayToHeart || "",
        after_work: profileData.AfterWork || "",
        nightclub_or_home: profileData.NightclubOrHome || "",
        pet_peeves: profileData.PetPeeves || "",
        craziest_travel_story: profileData.CraziestTravelStory || "",
        weirdest_gift: profileData.WeirdestGift || "",
        worst_job: profileData.WorstJob || "",
        dream_job: profileData.DreamJob || "",
        social_link_1: profileData.SocialLink1 || "",
        social_link_2: profileData.SocialLink2 || "",
        profile_completion_step: profileData.ProfileCompletionStep || 0,
        profile_completion_skipped: profileData.ProfileCompletionSkipped || [],
        profile_completion_prefer_not: profileData.ProfileCompletionPreferNot || [],
        profile_completed_at: profileData.ProfileCompletedAt || "",
        can_start_matching: profileData.CanStartMatching || false,
      };

      setProfile(fetchedProfile);
      setPhotoCount(completionData.data?.photoCount || 0);

      // Set initial step based on priority:
      // 1. targetStep (explicit step from URL) - highest priority
      // 2. resume (go to first incomplete step)
      // 3. initialStep (default: 1)
      if (shouldSetStep) {
        if (targetStepRef.current && targetStepRef.current >= 1 && targetStepRef.current <= TOTAL_STEPS) {
          // User explicitly requested a specific step - go there directly
          setCurrentStep(targetStepRef.current);
        } else if (resumeRef.current) {
          // Resume mode - go to first incomplete step
          const completionStatus = calculateCompletion(
            fetchedProfile,
            completionData.data?.photoCount || 0
          );
          const resumeStep = getResumeStep(fetchedProfile, completionStatus);
          setCurrentStep(resumeStep);
        }
        // Otherwise, keep the initialStep (default: 1)
      }

      // Pre-populate step values from profile
      populateStepValues(fetchedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Populate step values from profile data
  const populateStepValues = useCallback((profileData: ProfileData) => {
    const values: StepValues = {};

    // Map profile data to API field keys (used by the wizard)
    // Use empty string check to avoid setting undefined values
    if (profileData.display_name) values.DisplayName = profileData.display_name;
    if (profileData.first_name) values.FirstName = profileData.first_name;
    if (profileData.last_name) values.LastName = profileData.last_name;
    // The API expects "DOB" for save, but we use "DateOfBirth" in wizard
    if (profileData.date_of_birth) values.DateOfBirth = profileData.date_of_birth;
    if (profileData.gender) values.Gender = profileData.gender;
    if (profileData.looking_for && profileData.looking_for.length > 0) 
      values.LookingFor = profileData.looking_for;
    if (profileData.height_inches)
      values.HeightInches = profileData.height_inches;
    if (profileData.body_type) values.BodyType = profileData.body_type;
    if (profileData.ethnicity && profileData.ethnicity.length > 0) 
      values.Ethnicity = profileData.ethnicity;
    if (profileData.dating_intentions)
      values.DatingIntentions = profileData.dating_intentions;
    if (profileData.marital_status)
      values.MaritalStatus = profileData.marital_status;
    if (profileData.country) values.Country = profileData.country;
    if (profileData.city) values.City = profileData.city;
    if (profileData.occupation) values.Occupation = profileData.occupation;
    if (profileData.company) values.Company = profileData.company;
    if (profileData.education) values.Education = profileData.education;
    if (profileData.religion) values.Religion = profileData.religion;
    if (profileData.political_views)
      values.PoliticalViews = profileData.political_views;
    if (profileData.exercise) values.Exercise = profileData.exercise;
    if (profileData.languages && profileData.languages.length > 0) 
      values.Languages = profileData.languages;
    if (profileData.smoking) values.Smoking = profileData.smoking;
    if (profileData.drinking) values.Drinking = profileData.drinking;
    if (profileData.marijuana) values.Marijuana = profileData.marijuana;
    if (profileData.has_kids) values.HasKids = profileData.has_kids;
    if (profileData.wants_kids) values.WantsKids = profileData.wants_kids;
    if (profileData.pets && profileData.pets.length > 0) 
      values.Pets = profileData.pets;
    if (profileData.interests && profileData.interests.length > 0) 
      values.Interests = profileData.interests;
    if (profileData.life_goals && profileData.life_goals.length > 0) 
      values.LifeGoals = profileData.life_goals;
    if (profileData.bio) values.Bio = profileData.bio;
    if (profileData.looking_for_description)
      values.LookingForDescription = profileData.looking_for_description;
    if (profileData.ideal_first_date)
      values.IdealFirstDate = profileData.ideal_first_date;
    if (profileData.non_negotiables)
      values.NonNegotiables = profileData.non_negotiables;
    if (profileData.way_to_heart)
      values.WayToHeart = profileData.way_to_heart;
    if (profileData.after_work) values.AfterWork = profileData.after_work;
    if (profileData.nightclub_or_home)
      values.NightclubOrHome = profileData.nightclub_or_home;
    if (profileData.pet_peeves) values.PetPeeves = profileData.pet_peeves;
    if (profileData.craziest_travel_story)
      values.CraziestTravelStory = profileData.craziest_travel_story;
    if (profileData.weirdest_gift)
      values.WeirdestGift = profileData.weirdest_gift;
    if (profileData.worst_job) values.WorstJob = profileData.worst_job;
    if (profileData.dream_job) values.DreamJob = profileData.dream_job;
    if (profileData.social_link_1)
      values.SocialLink1 = profileData.social_link_1;
    if (profileData.social_link_2)
      values.SocialLink2 = profileData.social_link_2;

    setStepValues(values);
  }, []);

  // Initial fetch - only run once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchProfile(true); // true = should set step if resuming
    }
  }, [fetchProfile]);

  // ============================================
  // NAVIGATION
  // ============================================

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
      setError(null);
    }
  }, []);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStep((prev) => prev + 1);
      setError(null);
    }
  }, [canGoNext]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  }, [canGoBack]);

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  const setFieldValue = useCallback((key: string, value: unknown) => {
    setStepValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setMultipleValues = useCallback((values: StepValues) => {
    setStepValues((prev) => ({ ...prev, ...values }));
  }, []);

  // Save current step values and continue
  const saveAndContinue = useCallback(async () => {
    if (!currentStepConfig) return;

    try {
      setIsSaving(true);
      setError(null);

      // Get field values for this step
      const fieldsToSave: Record<string, unknown> = {};
      for (const field of currentStepConfig.fields) {
        const value = stepValues[field.key];
        if (value !== undefined) {
          fieldsToSave[field.key] = value;
        }
      }

      // Add step number
      fieldsToSave.ProfileCompletionStep = currentStep + 1;

      // Save to API (skip for photos/selfie steps which have their own handlers)
      if (
        currentStepConfig.id !== "photos" &&
        currentStepConfig.id !== "verification-selfie"
      ) {
        const res = await fetch("/api/users/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsToSave),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.msg || "Failed to save");
        }
      } else {
        // Just update the step number for media steps
        await fetch("/api/users/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ProfileCompletionStep: currentStep + 1 }),
        });
      }

      // Remove from skipped if was there
      const stepFieldKeys = currentStepConfig.fields.map((f) => f.dbColumn);
      for (const fieldKey of stepFieldKeys) {
        if (profile?.profile_completion_skipped?.includes(fieldKey)) {
          await fetch("/api/profile/completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "unskip", field: fieldKey }),
          });
        }
      }

      // Refresh profile to update completion percentage
      await fetchProfile(false);
      
      // Brief delay (500ms) to let user see the updated percentage
      // This provides visual feedback that progress is being tracked
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Go to next step AFTER delay
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, currentStepConfig, stepValues, profile, fetchProfile]);

  // Skip current step
  const saveAndSkip = useCallback(async () => {
    if (!currentStepConfig || !currentStepConfig.allowSkip) return;

    try {
      setIsSaving(true);
      setError(null);

      // Mark all fields in this step as skipped
      const stepFieldKeys = currentStepConfig.fields.map((f) => f.dbColumn);
      for (const fieldKey of stepFieldKeys) {
        await fetch("/api/profile/completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "skip", field: fieldKey }),
        });
      }

      // Update step number
      await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ProfileCompletionStep: currentStep + 1 }),
      });

      // Refresh profile to update completion percentage
      await fetchProfile(false);

      // Go to next step
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip");
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, currentStepConfig, fetchProfile]);

  // Mark as "prefer not to say"
  const saveAsPreferNot = useCallback(async () => {
    if (!currentStepConfig || !currentStepConfig.allowPreferNot) return;

    try {
      setIsSaving(true);
      setError(null);

      // Mark all sensitive fields in this step as prefer_not
      const sensitivesFields = currentStepConfig.fields.filter((f) => f.sensitive);
      for (const field of sensitivesFields) {
        await fetch("/api/profile/completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "prefer_not", field: field.dbColumn }),
        });
      }

      // Update step number
      await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ProfileCompletionStep: currentStep + 1 }),
      });

      // Refresh profile to update completion percentage
      await fetchProfile(false);

      // Go to next step
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preference");
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, currentStepConfig, fetchProfile]);

  // Check if a step is complete
  const checkStepComplete = useCallback(
    (stepNumber: number) => {
      if (!profile) return false;
      return isStepComplete(stepNumber, profile, photoCount);
    },
    [profile, photoCount]
  );

  // Refresh profile data (without changing current step)
  const refreshProfile = useCallback(async () => {
    await fetchProfile(false);
  }, [fetchProfile]);

  // Mark a specific field as "prefer not to say"
  const markFieldAsPreferNot = useCallback(async (fieldKey: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch("/api/profile/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prefer_not", field: fieldKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to mark field as prefer not");
      }

      // Refresh profile to update prefer_not list
      await fetchProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark field as prefer not");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [fetchProfile]);

  // Remove a field from "prefer not to say" list
  const removeFieldFromPreferNot = useCallback(async (fieldKey: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch("/api/profile/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_prefer_not", field: fieldKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to remove field from prefer not");
      }

      // Refresh profile to update prefer_not list
      await fetchProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove field from prefer not");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [fetchProfile]);

  // Check if a field is marked as "prefer not to say"
  const isFieldPreferNot = useCallback(
    (fieldKey: string) => {
      return profile?.profile_completion_prefer_not?.includes(fieldKey) || false;
    },
    [profile]
  );

  // Skip ahead functionality
  const nextIncompleteStep = useMemo(() => {
    if (!profile) return null;
    return getNextIncompleteStepAfter(currentStep, profile, photoCount);
  }, [currentStep, profile, photoCount]);

  const canSkipAhead = useMemo(() => {
    if (!profile) return false;
    // Only show skip ahead if:
    // 1. There's an incomplete step ahead
    // 2. There are completed steps ahead (meaning user has data further along)
    return (
      nextIncompleteStep !== null &&
      hasCompletedStepsAhead(currentStep, profile, photoCount)
    );
  }, [currentStep, profile, photoCount, nextIncompleteStep]);

  const skipToNextIncomplete = useCallback(() => {
    if (nextIncompleteStep) {
      setCurrentStep(nextIncompleteStep);
      setError(null);
    }
  }, [nextIncompleteStep]);

  return {
    // Current state
    currentStep,
    currentStepConfig,
    stepValues,
    isLoading,
    isSaving,
    error,

    // Profile data
    profile,
    photoCount,
    completion,

    // Navigation
    goToStep,
    goNext,
    goBack,
    canGoBack,
    canGoNext,
    isFirstStep,
    isLastStep,

    // Data management
    setFieldValue,
    setMultipleValues,
    saveAndContinue,
    saveAndSkip,
    saveAsPreferNot,

    // Per-field prefer not to say
    markFieldAsPreferNot,
    removeFieldFromPreferNot,
    isFieldPreferNot,

    // Utilities
    isStepComplete: checkStepComplete,
    refreshProfile,
    
    // Skip ahead
    nextIncompleteStep,
    canSkipAhead,
    skipToNextIncomplete,
  };
}
