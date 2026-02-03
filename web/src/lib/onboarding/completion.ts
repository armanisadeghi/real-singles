/**
 * Onboarding Completion Utilities
 *
 * Handles calculation of profile completion percentage and tracking.
 * This mirrors the server-side logic in /api/profile/completion but
 * can be used client-side for optimistic updates.
 */

import { ONBOARDING_STEPS, getAllFields } from "./steps-config";

// ============================================
// TYPES
// ============================================

export interface ProfileData {
  // Basic info
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  looking_for?: string[] | null;
  profile_image_url?: string | null;
  verification_selfie_url?: string | null;

  // Physical
  height_inches?: number | null;
  body_type?: string | null;
  ethnicity?: string[] | null;

  // Relationship
  dating_intentions?: string | null;
  marital_status?: string | null;

  // Location
  country?: string | null;
  city?: string | null;
  state?: string | null;

  // Lifestyle
  occupation?: string | null;
  company?: string | null;
  education?: string | null;
  religion?: string | null;
  political_views?: string | null;
  exercise?: string | null;
  languages?: string[] | null;

  // Habits
  smoking?: string | null;
  drinking?: string | null;
  marijuana?: string | null;

  // Family
  has_kids?: string | null;
  wants_kids?: string | null;
  pets?: string[] | null;

  // Personality
  interests?: string[] | null;
  life_goals?: string[] | null;

  // About
  bio?: string | null;
  looking_for_description?: string | null;

  // Prompts
  ideal_first_date?: string | null;
  non_negotiables?: string | null;
  way_to_heart?: string | null;
  after_work?: string | null;
  nightclub_or_home?: string | null;
  pet_peeves?: string | null;
  craziest_travel_story?: string | null;
  weirdest_gift?: string | null;
  worst_job?: string | null;
  dream_job?: string | null;

  // Social
  social_link_1?: string | null;
  social_link_2?: string | null;

  // Completion tracking
  profile_completion_step?: number | null;
  profile_completion_skipped?: string[] | null;
  profile_completion_prefer_not?: string[] | null;
  profile_completed_at?: string | null;
  can_start_matching?: boolean | null;

  // Allow any other fields
  [key: string]: unknown;
}

export interface CompletionStatus {
  percentage: number;
  completedCount: number;
  totalCount: number;
  completedFields: string[];
  incompleteFields: string[];
  skippedFields: string[];
  preferNotFields: string[];
  requiredIncomplete: string[];
  nextIncompleteStep: number | null;
  firstSkippedStep: number | null;
  canStartMatching: boolean;
  isComplete: boolean;
  photoCount: number;
  hasMinimumPhotos: boolean;
}

// ============================================
// FIELD DEFINITIONS
// ============================================

// Fields that count toward completion (excluding media fields handled separately)
const COMPLETION_FIELDS = [
  // Basic (step 1-4, but photos handled separately)
  { key: "first_name", step: 1, required: true },
  { key: "date_of_birth", step: 2, required: true },
  { key: "gender", step: 3, required: true },
  { key: "looking_for", step: 4, required: true },
  // Physical (steps 7-8)
  { key: "height_inches", step: 7, required: false },
  { key: "body_type", step: 7, required: false },
  { key: "ethnicity", step: 8, required: false },
  // Relationship (step 9)
  { key: "dating_intentions", step: 9, required: false },
  { key: "marital_status", step: 9, required: false },
  // Location (step 10)
  { key: "country", step: 10, required: false },
  { key: "city", step: 10, required: false },
  // Lifestyle (steps 11-15)
  { key: "occupation", step: 11, required: false },
  { key: "company", step: 11, required: false },
  { key: "education", step: 12, required: false },
  { key: "religion", step: 13, required: false },
  { key: "political_views", step: 13, required: false },
  { key: "exercise", step: 14, required: false },
  { key: "languages", step: 15, required: false },
  // Habits (step 16)
  { key: "smoking", step: 16, required: false },
  { key: "drinking", step: 16, required: false },
  { key: "marijuana", step: 16, required: false },
  // Family (steps 17-18)
  { key: "has_kids", step: 17, required: false },
  { key: "wants_kids", step: 17, required: false },
  { key: "pets", step: 18, required: false },
  // Personality (steps 19-20)
  { key: "interests", step: 19, required: false },
  { key: "life_goals", step: 20, required: false },
  // About (steps 21-22)
  { key: "bio", step: 21, required: false },
  { key: "looking_for_description", step: 22, required: false },
  // Prompts (steps 23-32)
  { key: "ideal_first_date", step: 23, required: false },
  { key: "non_negotiables", step: 24, required: false },
  { key: "way_to_heart", step: 25, required: false },
  { key: "after_work", step: 26, required: false },
  { key: "nightclub_or_home", step: 27, required: false },
  { key: "pet_peeves", step: 28, required: false },
  { key: "craziest_travel_story", step: 29, required: false },
  { key: "weirdest_gift", step: 30, required: false },
  { key: "worst_job", step: 31, required: false },
  { key: "dream_job", step: 32, required: false },
  // Social (step 33)
  { key: "social_link_1", step: 33, required: false },
  { key: "social_link_2", step: 33, required: false },
];

const TOTAL_FIELDS = COMPLETION_FIELDS.length;
const MIN_PHOTOS_REQUIRED = 1;

// ============================================
// UTILITIES
// ============================================

/**
 * Check if a field has a meaningful value
 */
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Calculate profile completion status
 */
export function calculateCompletion(
  profile: ProfileData,
  photoCount: number = 0
): CompletionStatus {
  const skippedFields = profile.profile_completion_skipped || [];
  const preferNotFields = profile.profile_completion_prefer_not || [];

  const completedFields: string[] = [];
  const incompleteFields: string[] = [];
  const requiredIncomplete: string[] = [];

  // Track which steps have incomplete fields
  const incompleteSteps = new Set<number>();
  const skippedSteps = new Set<number>();

  for (const field of COMPLETION_FIELDS) {
    const value = profile[field.key];
    const isSkipped = skippedFields.includes(field.key);
    const isPreferNot = preferNotFields.includes(field.key);

    if (hasValue(value) || isPreferNot) {
      // Field is "complete" if has value OR user chose "prefer not to say"
      completedFields.push(field.key);
    } else if (isSkipped) {
      // Skipped fields count as incomplete
      incompleteFields.push(field.key);
      skippedSteps.add(field.step);
      if (field.required) {
        requiredIncomplete.push(field.key);
      }
    } else {
      // No value, not skipped, not prefer_not
      incompleteFields.push(field.key);
      incompleteSteps.add(field.step);
      if (field.required) {
        requiredIncomplete.push(field.key);
      }
    }
  }

  // Check photo requirement
  const hasPhotos = hasValue(profile.profile_image_url) || photoCount > 0;
  const hasMinimumPhotos = photoCount >= MIN_PHOTOS_REQUIRED || hasPhotos;

  if (!hasMinimumPhotos) {
    incompleteSteps.add(5); // Photos step
    requiredIncomplete.push("profile_image_url");
  }

  // Calculate percentage
  // Photos count as 1 field in percentage
  const photoComplete = hasMinimumPhotos ? 1 : 0;
  const percentage = Math.round(
    ((completedFields.length + photoComplete) / (TOTAL_FIELDS + 1)) * 100
  );

  // Find next incomplete step (not skipped)
  const sortedIncomplete = Array.from(incompleteSteps).sort((a, b) => a - b);
  const nextIncompleteStep = sortedIncomplete[0] ?? null;

  // Find first skipped step (for resume)
  const sortedSkipped = Array.from(skippedSteps).sort((a, b) => a - b);
  const firstSkippedStep = sortedSkipped[0] ?? null;

  // Check matching eligibility
  const canStartMatching = requiredIncomplete.length === 0 && hasMinimumPhotos;

  // Check if fully complete
  const isComplete = incompleteFields.length === 0 && hasMinimumPhotos;

  return {
    percentage,
    completedCount: completedFields.length + photoComplete,
    totalCount: TOTAL_FIELDS + 1, // +1 for photos
    completedFields,
    incompleteFields,
    skippedFields,
    preferNotFields,
    requiredIncomplete,
    nextIncompleteStep,
    firstSkippedStep,
    canStartMatching,
    isComplete,
    photoCount,
    hasMinimumPhotos,
  };
}

/**
 * Get the step number to resume from
 * Priority: first incomplete step > first skipped step > complete
 * 
 * Note: We ignore the saved profile_completion_step because it can be outdated.
 * Instead, we always find the first step that actually needs attention.
 */
export function getResumeStep(
  profile: ProfileData,
  completion: CompletionStatus
): number {
  // Find the first incomplete step by checking each step in order
  for (const step of ONBOARDING_STEPS) {
    // Skip the complete step
    if (step.id === "complete") continue;
    
    // Check if this step is complete
    const stepComplete = isStepCompleteByConfig(step, profile, completion);
    if (!stepComplete) {
      return step.stepNumber;
    }
  }

  // All complete, go to complete step
  return ONBOARDING_STEPS.length;
}

/**
 * Check if a step is complete based on its configuration
 */
function isStepCompleteByConfig(
  step: (typeof ONBOARDING_STEPS)[number],
  profile: ProfileData,
  completion: CompletionStatus
): boolean {
  // Photos step - needs at least 1 photo
  if (step.id === "photos") {
    return hasValue(profile.profile_image_url) || completion.photoCount >= MIN_PHOTOS_REQUIRED;
  }

  // Verification selfie - optional, consider complete if has value OR was skipped
  if (step.id === "verification-selfie") {
    return hasValue(profile.verification_selfie_url) || 
           completion.skippedFields.includes("verification_selfie_url");
  }

  // For all other steps, check each field
  const preferNotFields = profile.profile_completion_prefer_not || [];
  const skippedFields = profile.profile_completion_skipped || [];

  for (const field of step.fields) {
    const value = profile[field.dbColumn];
    const isPreferNot = preferNotFields.includes(field.dbColumn);
    const isSkipped = skippedFields.includes(field.dbColumn);

    // A field is "complete" if it has a value, or user chose "prefer not to say"
    // Skipped fields are NOT complete - we want to return to them
    if (!hasValue(value) && !isPreferNot) {
      // For required steps, any missing field means incomplete
      if (step.isRequired) {
        return false;
      }
      // For optional steps, only count as incomplete if not skipped
      if (!isSkipped) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a specific step is complete
 */
export function isStepComplete(
  stepNumber: number,
  profile: ProfileData,
  photoCount: number = 0
): boolean {
  const step = ONBOARDING_STEPS.find((s) => s.stepNumber === stepNumber);
  if (!step) return false;

  // Complete step is always "complete"
  if (step.id === "complete") return true;

  // Photos step
  if (step.id === "photos") {
    return (
      hasValue(profile.profile_image_url) || photoCount >= MIN_PHOTOS_REQUIRED
    );
  }

  // Verification selfie step (not required)
  if (step.id === "verification-selfie") {
    return hasValue(profile.verification_selfie_url);
  }

  const preferNotFields = profile.profile_completion_prefer_not || [];

  // Check all fields in the step
  for (const field of step.fields) {
    const value = profile[field.dbColumn];
    const isPreferNot = preferNotFields.includes(field.dbColumn);

    if (!hasValue(value) && !isPreferNot) {
      return false;
    }
  }

  return true;
}

/**
 * Get fields that are incomplete in a step
 */
export function getIncompleteFieldsInStep(
  stepNumber: number,
  profile: ProfileData
): string[] {
  const step = ONBOARDING_STEPS.find((s) => s.stepNumber === stepNumber);
  if (!step) return [];

  const preferNotFields = profile.profile_completion_prefer_not || [];
  const incomplete: string[] = [];

  for (const field of step.fields) {
    const value = profile[field.dbColumn];
    const isPreferNot = preferNotFields.includes(field.dbColumn);

    if (!hasValue(value) && !isPreferNot) {
      incomplete.push(field.dbColumn);
    }
  }

  return incomplete;
}

/**
 * Format completion percentage for display
 */
export function formatCompletionPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

/**
 * Get a color class based on completion percentage
 */
export function getCompletionColor(percentage: number): string {
  if (percentage < 25) return "text-red-500 dark:text-red-400";
  if (percentage < 50) return "text-orange-500 dark:text-orange-400";
  if (percentage < 75) return "text-yellow-500 dark:text-yellow-400";
  if (percentage < 100) return "text-green-500 dark:text-green-400";
  return "text-pink-500 dark:text-pink-400";
}

/**
 * Get progress bar gradient based on percentage
 */
export function getCompletionGradient(percentage: number): string {
  if (percentage < 25)
    return "bg-gradient-to-r from-red-500 to-orange-500";
  if (percentage < 50)
    return "bg-gradient-to-r from-orange-500 to-yellow-500";
  if (percentage < 75)
    return "bg-gradient-to-r from-yellow-500 to-green-500";
  return "bg-gradient-to-r from-green-500 to-pink-500";
}

/**
 * Find the next incomplete step after the current step.
 * Returns null if there are no incomplete steps ahead.
 */
export function getNextIncompleteStepAfter(
  currentStep: number,
  profile: ProfileData,
  photoCount: number = 0
): number | null {
  for (const step of ONBOARDING_STEPS) {
    // Only look at steps after the current one
    if (step.stepNumber <= currentStep) continue;
    
    // Skip the complete step
    if (step.id === "complete") continue;
    
    // Check if this step is incomplete
    if (!isStepComplete(step.stepNumber, profile, photoCount)) {
      return step.stepNumber;
    }
  }
  
  return null;
}

/**
 * Check if there are any completed steps after the current step.
 * This indicates the user has previously filled in later steps,
 * making "skip ahead" functionality useful.
 */
export function hasCompletedStepsAhead(
  currentStep: number,
  profile: ProfileData,
  photoCount: number = 0
): boolean {
  for (const step of ONBOARDING_STEPS) {
    // Only look at steps after the current one
    if (step.stepNumber <= currentStep) continue;
    
    // Skip the complete step
    if (step.id === "complete") continue;
    
    // If any step ahead is complete, return true
    if (isStepComplete(step.stepNumber, profile, photoCount)) {
      return true;
    }
  }
  
  return false;
}
