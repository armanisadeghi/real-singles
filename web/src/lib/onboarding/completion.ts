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
  // Display name (what the user wants to be called publicly)
  display_name?: string | null;
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
  zip_code?: string | null;
  state?: string | null;
  street_address?: string | null;

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
  past_event?: string | null;

  // Social
  social_link_1?: string | null;
  social_link_2?: string | null;

  // Media
  voice_prompt_url?: string | null;
  video_intro_url?: string | null;
  voice_prompt_duration_seconds?: number | null;
  video_intro_duration_seconds?: number | null;

  // Additional location
  hometown?: string | null;
  schools?: string[] | null;
  zodiac_sign?: string | null;

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
// FIELD DEFINITIONS (Single Source of Truth)
// ============================================
// This is the ONE authoritative field list for completion calculation.
// The API route (/api/profile/completion) imports this — never define fields there.

export interface ProfileFieldDef {
  key: string;           // Database column name (used for value lookup)
  label: string;         // Human-readable label
  required: boolean;     // Required to start matching
  sensitive: boolean;    // Allows "prefer not to say" option
  step: number;          // Onboarding step number
  category: string;      // Grouping for UI
}

export const PROFILE_FIELDS: ProfileFieldDef[] = [
  // Required fields (steps 1-4)
  { key: "first_name", label: "First Name", required: true, sensitive: false, step: 1, category: "basic" },
  { key: "date_of_birth", label: "Date of Birth", required: true, sensitive: false, step: 2, category: "basic" },
  { key: "gender", label: "Gender", required: true, sensitive: false, step: 3, category: "basic" },
  { key: "looking_for", label: "Looking For", required: true, sensitive: false, step: 4, category: "basic" },
  // Note: profile_image_url is handled separately via photo count (step 5)
  // Verification selfie is step 6
  { key: "verification_selfie_url", label: "Verification Selfie", required: false, sensitive: false, step: 6, category: "verification" },
  // Bio & descriptions (steps 7-8)
  { key: "bio", label: "About Me", required: false, sensitive: false, step: 7, category: "about" },
  { key: "looking_for_description", label: "What I'm Looking For", required: false, sensitive: false, step: 8, category: "about" },
  // Physical (steps 9-10)
  { key: "height_inches", label: "Height", required: false, sensitive: false, step: 9, category: "physical" },
  { key: "body_type", label: "Body Type", required: false, sensitive: false, step: 9, category: "physical" },
  { key: "ethnicity", label: "Ethnicity", required: false, sensitive: true, step: 10, category: "physical" },
  // Relationship (steps 11-12) — split: marital status first, then dating intentions
  { key: "marital_status", label: "Marital Status", required: false, sensitive: true, step: 11, category: "relationship" },
  { key: "dating_intentions", label: "Dating Intentions", required: false, sensitive: false, step: 12, category: "relationship" },
  // Location (step 13)
  { key: "country", label: "Country", required: false, sensitive: false, step: 13, category: "location" },
  { key: "city", label: "City", required: false, sensitive: false, step: 13, category: "location" },
  { key: "zip_code", label: "Zip Code", required: false, sensitive: false, step: 13, category: "location" },
  { key: "state", label: "State", required: false, sensitive: false, step: 13, category: "location" },
  { key: "hometown", label: "Hometown", required: false, sensitive: false, step: 13, category: "location" },
  // Education & career (steps 14-15)
  { key: "occupation", label: "Occupation", required: false, sensitive: false, step: 14, category: "career" },
  { key: "company", label: "Company", required: false, sensitive: false, step: 14, category: "career" },
  { key: "education", label: "Education Level", required: false, sensitive: false, step: 15, category: "education" },
  { key: "schools", label: "Schools", required: false, sensitive: false, step: 15, category: "education" },
  // Beliefs & values (steps 16-17) — split: religion, then political views
  { key: "religion", label: "Religion", required: false, sensitive: true, step: 16, category: "beliefs" },
  { key: "political_views", label: "Political Views", required: false, sensitive: true, step: 17, category: "beliefs" },
  // Lifestyle (steps 18-19)
  { key: "exercise", label: "Exercise", required: false, sensitive: false, step: 18, category: "lifestyle" },
  { key: "languages", label: "Languages", required: false, sensitive: false, step: 19, category: "lifestyle" },
  // Habits (step 20)
  { key: "smoking", label: "Smoking", required: false, sensitive: true, step: 20, category: "habits" },
  { key: "drinking", label: "Drinking", required: false, sensitive: true, step: 20, category: "habits" },
  { key: "marijuana", label: "Marijuana", required: false, sensitive: true, step: 20, category: "habits" },
  // Family (steps 21-23) — split: has kids, wants kids, pets
  { key: "has_kids", label: "Have Children", required: false, sensitive: true, step: 21, category: "family" },
  { key: "wants_kids", label: "Want Children", required: false, sensitive: true, step: 22, category: "family" },
  { key: "pets", label: "Pets", required: false, sensitive: false, step: 23, category: "family" },
  // Interests & personality (steps 24-25)
  { key: "interests", label: "Interests", required: false, sensitive: false, step: 24, category: "personality" },
  { key: "life_goals", label: "Life Goals", required: false, sensitive: false, step: 25, category: "personality" },
  { key: "zodiac_sign", label: "Zodiac Sign", required: false, sensitive: false, step: 2, category: "personality" },
  // Profile prompts (steps 26-35)
  { key: "ideal_first_date", label: "Ideal First Date", required: false, sensitive: false, step: 26, category: "prompts" },
  { key: "non_negotiables", label: "Non-Negotiables", required: false, sensitive: false, step: 27, category: "prompts" },
  { key: "way_to_heart", label: "Way to My Heart", required: false, sensitive: false, step: 28, category: "prompts" },
  { key: "after_work", label: "After Work", required: false, sensitive: false, step: 29, category: "prompts" },
  { key: "nightclub_or_home", label: "Nightclub or Home", required: false, sensitive: false, step: 30, category: "prompts" },
  { key: "pet_peeves", label: "Pet Peeves", required: false, sensitive: false, step: 31, category: "prompts" },
  { key: "craziest_travel_story", label: "Craziest Travel Story", required: false, sensitive: false, step: 32, category: "prompts" },
  { key: "weirdest_gift", label: "Weirdest Gift", required: false, sensitive: false, step: 33, category: "prompts" },
  { key: "worst_job", label: "Worst Job", required: false, sensitive: false, step: 34, category: "prompts" },
  { key: "dream_job", label: "Dream Job", required: false, sensitive: false, step: 35, category: "prompts" },
  { key: "past_event", label: "Past Event", required: false, sensitive: false, step: 35, category: "prompts" },
  // Social links (step 36)
  { key: "social_link_1", label: "Social Link 1", required: false, sensitive: false, step: 36, category: "social" },
  { key: "social_link_2", label: "Social Link 2", required: false, sensitive: false, step: 36, category: "social" },
  // Media — voice & video (step 37)
  { key: "voice_prompt_url", label: "Voice Prompt", required: false, sensitive: false, step: 37, category: "media" },
  { key: "video_intro_url", label: "Video Intro", required: false, sensitive: false, step: 37, category: "media" },
];

const TOTAL_FIELDS = PROFILE_FIELDS.length;
export const MIN_PHOTOS_REQUIRED = parseInt(process.env.MIN_PHOTOS_REQUIRED || "1", 10);

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

  for (const field of PROFILE_FIELDS) {
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
