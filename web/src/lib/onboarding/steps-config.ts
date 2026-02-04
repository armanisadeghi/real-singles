/**
 * Onboarding Steps Configuration
 *
 * Defines all steps in the onboarding wizard, their fields, and metadata.
 * This is the single source of truth for the onboarding flow.
 */

import {
  GENDER_OPTIONS,
  BODY_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  HAS_KIDS_OPTIONS,
  WANTS_KIDS_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  MARIJUANA_OPTIONS,
  EXERCISE_OPTIONS,
  DATING_INTENTIONS_OPTIONS,
  EDUCATION_OPTIONS,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  POLITICAL_OPTIONS,
  PETS_OPTIONS,
  LANGUAGE_OPTIONS,
  INTEREST_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/types";

// ============================================
// TYPES
// ============================================

export type StepInputType =
  | "text"
  | "textarea"
  | "date"
  | "select"
  | "multi-select"
  | "photo-upload"
  | "camera-capture"
  | "url";

export interface StepField {
  key: string; // API field key (PascalCase for API)
  dbColumn: string; // Database column name (snake_case)
  label: string; // Display label
  placeholder?: string;
  inputType: StepInputType;
  options?: readonly { value: string; label: string }[];
  required?: boolean; // Required to start matching
  sensitive?: boolean; // Allows "prefer not to say"
  maxLength?: number;
  rows?: number; // For textarea
}

export interface OnboardingStep {
  id: string; // Unique step identifier
  stepNumber: number; // Order in the flow
  title: string; // Main heading
  subtitle?: string; // Optional subheading/description
  phase: string; // Grouping category
  fields: StepField[];
  isRequired: boolean; // Cannot skip this step (all fields required)
  allowSkip: boolean; // Show skip button
  allowPreferNot: boolean; // Show "prefer not to say" option
  needsKeyboard: boolean; // Has text/textarea inputs
  component: string; // Component name to render
}

// ============================================
// STEP DEFINITIONS
// ============================================

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // Phase 1: Required (Steps 1-6)
  {
    id: "name",
    stepNumber: 1,
    title: "What's your name?",
    subtitle: "This is how you'll appear to others",
    phase: "required",
    fields: [
      {
        key: "FirstName",
        dbColumn: "first_name",
        label: "First Name",
        placeholder: "First name",
        inputType: "text",
        required: true,
        maxLength: 50,
      },
      {
        key: "LastName",
        dbColumn: "last_name",
        label: "Last Name",
        placeholder: "Last name",
        inputType: "text",
        required: true,
        maxLength: 50,
      },
    ],
    isRequired: true,
    allowSkip: false,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "NameStep",
  },
  {
    id: "birthday",
    stepNumber: 2,
    title: "When's your birthday?",
    subtitle: "We'll show your age, not your birthday",
    phase: "required",
    fields: [
      {
        key: "DateOfBirth",
        dbColumn: "date_of_birth",
        label: "Date of Birth",
        inputType: "date",
        required: true,
      },
    ],
    isRequired: true,
    allowSkip: false,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "BirthdayStep",
  },
  {
    id: "gender",
    stepNumber: 3,
    title: "What's your gender?",
    phase: "required",
    fields: [
      {
        key: "Gender",
        dbColumn: "gender",
        label: "Gender",
        inputType: "select",
        options: GENDER_OPTIONS,
        required: true,
      },
    ],
    isRequired: true,
    allowSkip: false,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "GenderStep",
  },
  {
    id: "interested-in",
    stepNumber: 4,
    title: "Who are you interested in?",
    subtitle: "Select all that apply",
    phase: "required",
    fields: [
      {
        key: "LookingFor",
        dbColumn: "looking_for",
        label: "Interested In",
        inputType: "multi-select",
        options: GENDER_OPTIONS,
        required: true,
      },
    ],
    isRequired: true,
    allowSkip: false,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "InterestedInStep",
  },
  {
    id: "photos",
    stepNumber: 5,
    title: "Add your photos",
    subtitle: "Show your best self — at least 1 photo required",
    phase: "required",
    fields: [
      {
        key: "ProfileImageUrl",
        dbColumn: "profile_image_url",
        label: "Photos",
        inputType: "photo-upload",
        required: true,
      },
    ],
    isRequired: true,
    allowSkip: false,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "PhotosStep",
  },
  {
    id: "verification-selfie",
    stepNumber: 6,
    title: "Verify it's you",
    subtitle: "Take a quick selfie to get verified",
    phase: "required",
    fields: [
      {
        key: "VerificationSelfieUrl",
        dbColumn: "verification_selfie_url",
        label: "Verification Selfie",
        inputType: "camera-capture",
        required: false, // Can skip but encouraged
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "VerificationSelfieStep",
  },

  // Phase 2: About You (Steps 7-8) - HIGH PRIORITY
  {
    id: "bio",
    stepNumber: 7,
    title: "Tell us about yourself",
    subtitle: "Write a short bio",
    phase: "about",
    fields: [
      {
        key: "Bio",
        dbColumn: "bio",
        label: "About Me",
        placeholder: "Share something interesting about yourself...",
        inputType: "textarea",
        maxLength: 1000,
        rows: 4,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "BioStep",
  },
  {
    id: "looking-for-description",
    stepNumber: 8,
    title: "What are you looking for?",
    subtitle: "Describe your ideal match",
    phase: "about",
    fields: [
      {
        key: "LookingForDescription",
        dbColumn: "looking_for_description",
        label: "What I'm Looking For",
        placeholder: "Describe what you're looking for in a partner...",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "LookingForStep",
  },

  // Phase 3: Physical (Steps 9-10)
  {
    id: "physical",
    stepNumber: 9,
    title: "Physical attributes",
    phase: "physical",
    fields: [
      {
        key: "HeightInches",
        dbColumn: "height_inches",
        label: "Height",
        inputType: "select",
        // Height options will be generated in component (feet + inches)
      },
      {
        key: "BodyType",
        dbColumn: "body_type",
        label: "Body Type",
        inputType: "select",
        options: BODY_TYPE_OPTIONS,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "PhysicalStep",
  },
  {
    id: "ethnicity",
    stepNumber: 10,
    title: "What's your ethnicity?",
    subtitle: "Select all that apply",
    phase: "physical",
    fields: [
      {
        key: "Ethnicity",
        dbColumn: "ethnicity",
        label: "Ethnicity",
        inputType: "multi-select",
        options: ETHNICITY_OPTIONS,
        sensitive: true,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "EthnicityStep",
  },

  // Phase 4: Relationship (Step 11)
  {
    id: "relationship-goals",
    stepNumber: 11,
    title: "What are you looking for?",
    phase: "relationship",
    fields: [
      {
        key: "DatingIntentions",
        dbColumn: "dating_intentions",
        label: "Dating Intentions",
        inputType: "select",
        options: DATING_INTENTIONS_OPTIONS,
      },
      {
        key: "MaritalStatus",
        dbColumn: "marital_status",
        label: "Marital Status",
        inputType: "select",
        options: MARITAL_STATUS_OPTIONS,
        sensitive: true,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "RelationshipGoalsStep",
  },

  // Phase 5: Location (Step 12)
  {
    id: "location",
    stepNumber: 12,
    title: "Where do you live?",
    phase: "location",
    fields: [
      {
        key: "Country",
        dbColumn: "country",
        label: "Country",
        inputType: "select",
        options: COUNTRY_OPTIONS,
      },
      {
        key: "City",
        dbColumn: "city",
        label: "City",
        placeholder: "Enter your city",
        inputType: "text",
        maxLength: 100,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "LocationStep",
  },

  // Phase 6: Lifestyle (Steps 13-17)
  {
    id: "work",
    stepNumber: 13,
    title: "What do you do?",
    phase: "lifestyle",
    fields: [
      {
        key: "Occupation",
        dbColumn: "occupation",
        label: "Occupation",
        placeholder: "Your job title",
        inputType: "text",
        maxLength: 100,
      },
      {
        key: "Company",
        dbColumn: "company",
        label: "Company",
        placeholder: "Where you work",
        inputType: "text",
        maxLength: 100,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "WorkStep",
  },
  {
    id: "education",
    stepNumber: 14,
    title: "What's your education?",
    phase: "lifestyle",
    fields: [
      {
        key: "Education",
        dbColumn: "education",
        label: "Education Level",
        inputType: "select",
        options: EDUCATION_OPTIONS,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "EducationStep",
  },
  {
    id: "beliefs",
    stepNumber: 15,
    title: "Your beliefs",
    phase: "lifestyle",
    fields: [
      {
        key: "Religion",
        dbColumn: "religion",
        label: "Religion",
        inputType: "select",
        options: RELIGION_OPTIONS,
        sensitive: true,
      },
      {
        key: "PoliticalViews",
        dbColumn: "political_views",
        label: "Political Views",
        inputType: "select",
        options: POLITICAL_OPTIONS,
        sensitive: true,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "BeliefsStep",
  },
  {
    id: "exercise",
    stepNumber: 16,
    title: "How often do you exercise?",
    phase: "lifestyle",
    fields: [
      {
        key: "Exercise",
        dbColumn: "exercise",
        label: "Exercise",
        inputType: "select",
        options: EXERCISE_OPTIONS,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "ExerciseStep",
  },
  {
    id: "languages",
    stepNumber: 17,
    title: "What languages do you speak?",
    subtitle: "Select all that apply",
    phase: "lifestyle",
    fields: [
      {
        key: "Languages",
        dbColumn: "languages",
        label: "Languages",
        inputType: "multi-select",
        options: LANGUAGE_OPTIONS,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "LanguagesStep",
  },

  // Phase 7: Habits (Step 18)
  {
    id: "habits",
    stepNumber: 18,
    title: "Your habits",
    phase: "habits",
    fields: [
      {
        key: "Smoking",
        dbColumn: "smoking",
        label: "Smoking",
        inputType: "select",
        options: SMOKING_OPTIONS,
      },
      {
        key: "Drinking",
        dbColumn: "drinking",
        label: "Drinking",
        inputType: "select",
        options: DRINKING_OPTIONS,
      },
      {
        key: "Marijuana",
        dbColumn: "marijuana",
        label: "Marijuana",
        inputType: "select",
        options: MARIJUANA_OPTIONS,
        sensitive: true,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "HabitsStep",
  },

  // Phase 8: Family (Steps 19-20)
  {
    id: "kids",
    stepNumber: 19,
    title: "About children",
    phase: "family",
    fields: [
      {
        key: "HasKids",
        dbColumn: "has_kids",
        label: "Do you have children?",
        inputType: "select",
        options: HAS_KIDS_OPTIONS,
        sensitive: true,
      },
      {
        key: "WantsKids",
        dbColumn: "wants_kids",
        label: "Do you want children?",
        inputType: "select",
        options: WANTS_KIDS_OPTIONS,
        sensitive: true,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "KidsStep",
  },
  {
    id: "pets",
    stepNumber: 20,
    title: "Do you have pets?",
    subtitle: "Select all that apply",
    phase: "family",
    fields: [
      {
        key: "Pets",
        dbColumn: "pets",
        label: "Pets",
        inputType: "multi-select",
        options: PETS_OPTIONS,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "PetsStep",
  },

  // Phase 9: Personality (Steps 21-22)
  {
    id: "interests",
    stepNumber: 21,
    title: "What are your interests?",
    subtitle: "Select what you enjoy",
    phase: "personality",
    fields: [
      {
        key: "Interests",
        dbColumn: "interests",
        label: "Interests",
        inputType: "multi-select",
        options: INTEREST_OPTIONS,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "InterestsStep",
  },
  {
    id: "life-goals",
    stepNumber: 22,
    title: "What are your life goals?",
    subtitle: "Select up to 10",
    phase: "personality",
    fields: [
      {
        key: "LifeGoals",
        dbColumn: "life_goals",
        label: "Life Goals",
        inputType: "multi-select",
        // Life goals are fetched from API
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "LifeGoalsStep",
  },

  // Phase 10: Prompts (Steps 23-32)
  {
    id: "prompt-ideal-date",
    stepNumber: 23,
    title: "My ideal first date...",
    subtitle: "...starts with and ends with",
    phase: "prompts",
    fields: [
      {
        key: "IdealFirstDate",
        dbColumn: "ideal_first_date",
        label: "Ideal First Date",
        placeholder: "Tell us about your perfect first date...",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-non-negotiables",
    stepNumber: 24,
    title: "My top non-negotiables",
    phase: "prompts",
    fields: [
      {
        key: "NonNegotiables",
        dbColumn: "non_negotiables",
        label: "Non-Negotiables",
        placeholder: "What are your deal-breakers?",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-way-to-heart",
    stepNumber: 25,
    title: "The way to my heart is through...",
    phase: "prompts",
    fields: [
      {
        key: "WayToHeart",
        dbColumn: "way_to_heart",
        label: "Way to My Heart",
        placeholder: "What wins you over?",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-after-work",
    stepNumber: 26,
    title: "After work, you can find me...",
    phase: "prompts",
    fields: [
      {
        key: "AfterWork",
        dbColumn: "after_work",
        label: "After Work",
        placeholder: "How do you unwind?",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-nightclub-or-home",
    stepNumber: 27,
    title: "Nightclub or night at home?",
    phase: "prompts",
    fields: [
      {
        key: "NightclubOrHome",
        dbColumn: "nightclub_or_home",
        label: "Nightclub or Home",
        placeholder: "Your preference and why",
        inputType: "text",
        maxLength: 200,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-pet-peeves",
    stepNumber: 28,
    title: "My pet peeves",
    phase: "prompts",
    fields: [
      {
        key: "PetPeeves",
        dbColumn: "pet_peeves",
        label: "Pet Peeves",
        placeholder: "What grinds your gears?",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-travel-story",
    stepNumber: 29,
    title: "My craziest travel story",
    phase: "prompts",
    fields: [
      {
        key: "CraziestTravelStory",
        dbColumn: "craziest_travel_story",
        label: "Craziest Travel Story",
        placeholder: "Share an adventure...",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-weirdest-gift",
    stepNumber: 30,
    title: "The weirdest gift I've received",
    phase: "prompts",
    fields: [
      {
        key: "WeirdestGift",
        dbColumn: "weirdest_gift",
        label: "Weirdest Gift",
        placeholder: "What was it?",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-worst-job",
    stepNumber: 31,
    title: "The worst job I ever had",
    phase: "prompts",
    fields: [
      {
        key: "WorstJob",
        dbColumn: "worst_job",
        label: "Worst Job",
        placeholder: "We've all been there...",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },
  {
    id: "prompt-dream-job",
    stepNumber: 32,
    title: "The job I'd do for free",
    phase: "prompts",
    fields: [
      {
        key: "DreamJob",
        dbColumn: "dream_job",
        label: "Dream Job",
        placeholder: "What's your passion?",
        inputType: "textarea",
        maxLength: 500,
        rows: 3,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "PromptStep",
  },

  // Phase 11: Social Links (Step 33)
  {
    id: "social-links",
    stepNumber: 33,
    title: "Connect your socials",
    subtitle: "Optional — helps verify you're real",
    phase: "social",
    fields: [
      {
        key: "SocialLink1",
        dbColumn: "social_link_1",
        label: "Social Link 1",
        placeholder: "https://instagram.com/...",
        inputType: "url",
        maxLength: 255,
      },
      {
        key: "SocialLink2",
        dbColumn: "social_link_2",
        label: "Social Link 2",
        placeholder: "https://linkedin.com/...",
        inputType: "url",
        maxLength: 255,
      },
    ],
    isRequired: false,
    allowSkip: true,
    allowPreferNot: false,
    needsKeyboard: true,
    component: "SocialLinksStep",
  },

  // Phase 12: Complete (Step 34)
  {
    id: "complete",
    stepNumber: 34,
    title: "You're all set!",
    subtitle: "Your profile is ready",
    phase: "complete",
    fields: [],
    isRequired: false,
    allowSkip: false,
    allowPreferNot: false,
    needsKeyboard: false,
    component: "CompleteStep",
  },
];

// ============================================
// UTILITIES
// ============================================

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export const REQUIRED_STEPS = ONBOARDING_STEPS.filter((s) => s.isRequired);

export const OPTIONAL_STEPS = ONBOARDING_STEPS.filter(
  (s) => !s.isRequired && s.id !== "complete"
);

/**
 * Get a step by its ID
 */
export function getStepById(id: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.id === id);
}

/**
 * Get a step by its number (1-indexed)
 */
export function getStepByNumber(num: number): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.stepNumber === num);
}

/**
 * Get all fields from all steps (flattened)
 */
export function getAllFields(): StepField[] {
  return ONBOARDING_STEPS.flatMap((s) => s.fields);
}

/**
 * Get all field keys that count toward completion
 */
export function getCompletionFieldKeys(): string[] {
  return getAllFields()
    .filter((f) => f.key !== "ProfileImageUrl" && f.key !== "VerificationSelfieUrl")
    .map((f) => f.dbColumn);
}

/**
 * Get the step containing a specific field
 */
export function getStepForField(fieldKey: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((step) =>
    step.fields.some((f) => f.key === fieldKey || f.dbColumn === fieldKey)
  );
}

/**
 * Get phases with their steps
 */
export function getPhases(): { phase: string; steps: OnboardingStep[] }[] {
  const phases: { phase: string; steps: OnboardingStep[] }[] = [];
  const phaseMap = new Map<string, OnboardingStep[]>();

  for (const step of ONBOARDING_STEPS) {
    if (!phaseMap.has(step.phase)) {
      phaseMap.set(step.phase, []);
    }
    phaseMap.get(step.phase)!.push(step);
  }

  for (const [phase, steps] of phaseMap) {
    phases.push({ phase, steps });
  }

  return phases;
}

/**
 * Phase display names
 */
export const PHASE_LABELS: Record<string, string> = {
  required: "Getting Started",
  physical: "Physical",
  relationship: "Relationship",
  location: "Location",
  lifestyle: "Lifestyle",
  habits: "Habits",
  family: "Family",
  personality: "Personality",
  about: "About You",
  prompts: "Prompts",
  social: "Social",
  complete: "Complete",
};
