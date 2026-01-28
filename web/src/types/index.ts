/**
 * Types Index
 * 
 * This file exports:
 * - Standardized UI constants (OPTIONS arrays) - TYPE-CHECKED against DB constraints
 * - Database types (re-exported from db.ts) - SSOT from Supabase
 * - API response types
 * - Profile completion types
 * 
 * IMPORTANT: OPTIONS arrays are type-checked against db-constraints.ts.
 * If you add an option value not in the DB constraint, TypeScript will error.
 * 
 * To add a new option value:
 * 1. Create a migration to update the DB CHECK constraint
 * 2. Add the value to the type in db-constraints.ts
 * 3. Add the value to the OPTIONS array below
 * 
 * For entity types, prefer importing directly from @/types/db
 */

import type { 
  DbGender,
  DbBodyType,
  DbMaritalStatus,
  DbHasKids,
  DbWantsKids,
  DbSmoking,
  DbDrinking,
  DbMarijuana,
  DbExercise,
  DbDatingIntentions,
  DbEducation,
  DbEthnicity,
  DbReligion,
  DbPolitical,
  DbZodiac,
  TypedOption,
} from "./db-constraints";

// Re-export constraint types for consumers
export type {
  DbGender,
  DbBodyType,
  DbMaritalStatus,
  DbHasKids,
  DbWantsKids,
  DbSmoking,
  DbDrinking,
  DbMarijuana,
  DbExercise,
  DbDatingIntentions,
  DbEducation,
  DbEthnicity,
  DbReligion,
  DbPolitical,
  DbZodiac,
} from "./db-constraints";

export { REQUIRED_FIELDS, SKIPPABLE_FIELDS } from "./db-constraints";

// ============================================
// TYPE-SAFE OPTIONS (Constrained by DB types)
// ============================================
// If you add a value not in the corresponding Db* type, TypeScript will error.

/**
 * Gender options - REQUIRED field for matching algorithm
 * Users MUST select a gender to be shown to potential matches.
 * Do NOT add "prefer_not_to_say" - this field cannot be skipped.
 * @constraint DbGender - see db-constraints.ts
 */
export const GENDER_OPTIONS: readonly TypedOption<DbGender>[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-Binary" },
  { value: "other", label: "Other" },
] as const;

/** @constraint DbBodyType - see db-constraints.ts */
export const BODY_TYPE_OPTIONS: readonly TypedOption<DbBodyType>[] = [
  { value: "slim", label: "Slim/Slender" },
  { value: "athletic", label: "Athletic/Fit" },
  { value: "average", label: "Average" },
  { value: "muscular", label: "Muscular" },
  { value: "curvy", label: "Curvy" },
  { value: "plus_size", label: "A few extra pounds" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbMaritalStatus - see db-constraints.ts */
export const MARITAL_STATUS_OPTIONS: readonly TypedOption<DbMaritalStatus>[] = [
  { value: "never_married", label: "Never Married" },
  { value: "separated", label: "Currently Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widow/Widower" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbHasKids - see db-constraints.ts */
export const HAS_KIDS_OPTIONS: readonly TypedOption<DbHasKids>[] = [
  { value: "no", label: "No" },
  { value: "yes_live_at_home", label: "Yes (Live at home)" },
  { value: "yes_live_away", label: "Yes (Live away)" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbWantsKids - see db-constraints.ts */
export const WANTS_KIDS_OPTIONS: readonly TypedOption<DbWantsKids>[] = [
  { value: "no", label: "No" },
  { value: "definitely", label: "Definitely" },
  { value: "someday", label: "Someday" },
  { value: "ok_if_partner_has", label: "No (but OK if partner has)" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbSmoking - see db-constraints.ts */
export const SMOKING_OPTIONS: readonly TypedOption<DbSmoking>[] = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Yes (Occasionally)" },
  { value: "daily", label: "Yes (Daily)" },
  { value: "trying_to_quit", label: "Trying to quit" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbDrinking - see db-constraints.ts */
export const DRINKING_OPTIONS: readonly TypedOption<DbDrinking>[] = [
  { value: "never", label: "Never" },
  { value: "social", label: "Social" },
  { value: "moderate", label: "Moderately" },
  { value: "regular", label: "Regular" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbMarijuana - see db-constraints.ts */
export const MARIJUANA_OPTIONS: readonly TypedOption<DbMarijuana>[] = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "yes", label: "Yes" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbExercise - see db-constraints.ts */
export const EXERCISE_OPTIONS: readonly TypedOption<DbExercise>[] = [
  { value: "never", label: "Never" },
  { value: "sometimes", label: "Sometimes" },
  { value: "regularly", label: "Regularly" },
  { value: "daily", label: "Daily" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/**
 * Dating intentions - critical for serious-dater positioning (The League, Hinge model)
 * @constraint DbDatingIntentions - see db-constraints.ts
 */
export const DATING_INTENTIONS_OPTIONS: readonly TypedOption<DbDatingIntentions>[] = [
  { value: "life_partner", label: "Life Partner" },
  { value: "long_term", label: "Long-term Relationship" },
  { value: "long_term_open", label: "Long-term, Open to Short" },
  { value: "figuring_out", label: "Figuring Out My Goals" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbEducation - see db-constraints.ts */
export const EDUCATION_OPTIONS: readonly TypedOption<DbEducation>[] = [
  { value: "high_school", label: "High School" },
  { value: "some_college", label: "Some College" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "graduate", label: "Graduate Degree" },
  { value: "phd", label: "PhD/Post-doctoral" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbEthnicity - see db-constraints.ts */
export const ETHNICITY_OPTIONS: readonly TypedOption<DbEthnicity>[] = [
  { value: "white", label: "White/Caucasian" },
  { value: "latino", label: "Latino/Hispanic" },
  { value: "black", label: "Black/African American" },
  { value: "asian", label: "Asian" },
  { value: "native_american", label: "Native American" },
  { value: "east_indian", label: "East Indian" },
  { value: "pacific_islander", label: "Pacific Islander" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "armenian", label: "Armenian" },
  { value: "mixed", label: "Mixed/Multi-racial" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbReligion - see db-constraints.ts */
export const RELIGION_OPTIONS: readonly TypedOption<DbReligion>[] = [
  { value: "adventist", label: "Adventist" },
  { value: "agnostic", label: "Agnostic" },
  { value: "atheist", label: "Atheist" },
  { value: "buddhist", label: "Buddhist" },
  { value: "catholic", label: "Catholic" },
  { value: "christian", label: "Christian/LDS/Protestant" },
  { value: "hindu", label: "Hindu" },
  { value: "jewish", label: "Jewish" },
  { value: "muslim", label: "Muslim/Islam" },
  { value: "spiritual", label: "Spiritual but not religious" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbPolitical - see db-constraints.ts */
export const POLITICAL_OPTIONS: readonly TypedOption<DbPolitical>[] = [
  { value: "no_answer", label: "No answer" },
  { value: "undecided", label: "Undecided" },
  { value: "conservative", label: "Conservative" },
  { value: "liberal", label: "Liberal" },
  { value: "libertarian", label: "Libertarian" },
  { value: "moderate", label: "Moderate" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/** @constraint DbZodiac - see db-constraints.ts */
export const ZODIAC_OPTIONS: readonly TypedOption<DbZodiac>[] = [
  { value: "aries", label: "Aries" },
  { value: "taurus", label: "Taurus" },
  { value: "gemini", label: "Gemini" },
  { value: "cancer", label: "Cancer" },
  { value: "leo", label: "Leo" },
  { value: "virgo", label: "Virgo" },
  { value: "libra", label: "Libra" },
  { value: "scorpio", label: "Scorpio" },
  { value: "sagittarius", label: "Sagittarius" },
  { value: "capricorn", label: "Capricorn" },
  { value: "aquarius", label: "Aquarius" },
  { value: "pisces", label: "Pisces" },
] as const;

/**
 * Calculate zodiac sign from a date of birth
 * @param dateString - Date string in any format parseable by Date constructor (YYYY-MM-DD or MM/DD/YYYY)
 * @returns Lowercase zodiac sign string or null if invalid date
 */
export function getZodiacFromDate(dateString: string): string | null {
  if (!dateString) return null;
  
  let month: number;
  let day: number;
  
  // Handle MM/DD/YYYY format
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
  } else {
    // Handle YYYY-MM-DD format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    month = date.getMonth() + 1; // getMonth is 0-indexed
    day = date.getDate();
  }
  
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  // Zodiac date ranges (approximate)
  const zodiacSigns: { sign: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[] = [
    { sign: "capricorn", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
    { sign: "aquarius", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { sign: "pisces", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    { sign: "aries", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { sign: "taurus", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { sign: "gemini", startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
    { sign: "cancer", startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
    { sign: "leo", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { sign: "virgo", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    { sign: "libra", startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
    { sign: "scorpio", startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
    { sign: "sagittarius", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  ];
  
  for (const z of zodiacSigns) {
    // Handle Capricorn which spans December-January
    if (z.sign === "capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return z.sign;
      }
    } else {
      if ((month === z.startMonth && day >= z.startDay) || 
          (month === z.endMonth && day <= z.endDay)) {
        return z.sign;
      }
    }
  }
  
  return null;
}

// Top 15 Western countries for a luxury dating app (US-focused but international)
export const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "CH", label: "Switzerland" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "IE", label: "Ireland" },
  { value: "NZ", label: "New Zealand" },
] as const;

export const PETS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "other", label: "Other" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "arabic", label: "Arabic" },
  { value: "armenian", label: "Armenian" },
  { value: "dutch", label: "Dutch" },
  { value: "hebrew", label: "Hebrew" },
  { value: "hindi", label: "Hindi" },
  { value: "norwegian", label: "Norwegian" },
  { value: "russian", label: "Russian" },
  { value: "swedish", label: "Swedish" },
  { value: "tagalog", label: "Tagalog" },
  { value: "turkish", label: "Turkish" },
  { value: "urdu", label: "Urdu" },
  { value: "other", label: "Other" },
] as const;

// Comprehensive interests list (merged from web + mobile + business logic)
export const INTEREST_OPTIONS = [
  // From business logic
  { value: "dining_out", label: "Dining out" },
  { value: "sports", label: "Sports" },
  { value: "museums_art", label: "Museums/Art" },
  { value: "music", label: "Music" },
  { value: "gardening", label: "Gardening" },
  { value: "basketball", label: "Basketball" },
  { value: "dancing", label: "Dancing" },
  { value: "travel", label: "Travel" },
  // From current web (deduplicated)
  { value: "movies", label: "Movies" },
  { value: "reading", label: "Reading" },
  { value: "fitness", label: "Fitness" },
  { value: "cooking", label: "Cooking" },
  { value: "photography", label: "Photography" },
  { value: "gaming", label: "Gaming" },
  { value: "hiking", label: "Hiking" },
  { value: "yoga", label: "Yoga" },
  { value: "wine", label: "Wine" },
  { value: "coffee", label: "Coffee" },
  { value: "dogs", label: "Dogs" },
  { value: "cats", label: "Cats" },
  { value: "fashion", label: "Fashion" },
  { value: "technology", label: "Technology" },
  { value: "nature", label: "Nature" },
  { value: "beach", label: "Beach" },
  { value: "mountains", label: "Mountains" },
  // Additional common interests
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "concerts", label: "Concerts" },
  { value: "theater", label: "Theater" },
  { value: "volunteering", label: "Volunteering" },
] as const;

// ============================================
// RE-EXPORT DATABASE TYPES (SSOT)
// ============================================
// Entity types should be imported from @/types/db instead of defining here.
// This re-export maintains backwards compatibility during migration.

export type {
  // Database row types (snake_case - for internal/API use)
  DbUser,
  DbProfile,
  DbUserGallery,
  DbUserFilters,
  DbMatch,
  DbFavorite,
  DbFollow,
  DbBlock,
  DbConversation,
  DbConversationParticipant,
  DbEvent,
  DbEventAttendee,
  DbVirtualSpeedDating,
  DbSpeedDatingRegistration,
  DbProduct,
  DbOrder,
  DbPointTransaction,
  DbReferral,
  DbReview,
  DbReport,
  DbNotification,
  DbContactSubmission,
  DbLifeGoalDefinition,
  DbPromptDefinition,
  DbUserProfilePrompt,
  // Application types (camelCase - for frontend use)
  AppUser,
  AppProfile,
  AppUserGallery,
  AppEvent,
  AppNotification,
  AppConversation,
  AppProduct,
  AppMatch,
  AppReview,
  AppOrder,
  AppReferral,
  AppBlock,
  AppFavorite,
  AppSpeedDatingSession,
  AppEventAttendee,
  AppLifeGoalDefinition,
  AppPromptDefinition,
  AppUserProfilePrompt,
} from "./db";

// ============================================
// LOOKING FOR / RELATIONSHIP OPTIONS
// ============================================

/**
 * Looking for / relationship type options
 * Synced with mobile/constants/options.ts
 */
export const LOOKING_FOR_OPTIONS = [
  { value: "relationship", label: "Relationship" },
  { value: "casual", label: "Something casual" },
  { value: "marriage", label: "Marriage" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

// ============================================
// EVENT OPTIONS (matches DB CHECK constraints)
// ============================================

/**
 * Event type options - matches database CHECK constraint
 * Synced with mobile/constants/options.ts
 */
export const EVENT_TYPE_OPTIONS = [
  { value: "in_person", label: "In Person" },
  { value: "virtual", label: "Virtual" },
  { value: "speed_dating", label: "Speed Dating" },
] as const;

/**
 * Event status options - matches database CHECK constraint
 * Synced with mobile/constants/options.ts
 */
export const EVENT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/**
 * Event attendee status options - matches database CHECK constraint
 * Synced with mobile/constants/options.ts
 */
export const EVENT_ATTENDEE_STATUS_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
  { value: "cancelled", label: "Cancelled" },
] as const;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// PROFILE COMPLETION TYPES
// ============================================

export interface ProfileField {
  key: string;
  label: string;
  step: number;
  category: string;
  required: boolean;
  sensitive: boolean;
}

export interface ProfileCompletionStatus {
  percentage: number;
  completedCount: number;
  totalCount: number;
  completedFields: string[];
  incompleteFields: string[];
  requiredIncomplete: string[];
  skippedFields: string[];
  preferNotFields: string[];
  nextField: ProfileField | null;
  canStartMatching: boolean;
  isComplete: boolean;
  fields: ProfileField[];
}

export type ProfileCompletionAction = 
  | "skip" 
  | "prefer_not" 
  | "unskip" 
  | "remove_prefer_not" 
  | "set_step" 
  | "mark_complete";

// ============================================
// LIFE GOALS (The League model)
// ============================================

// Type aliases for backwards compatibility (prefer importing from db.ts directly)
export type LifeGoalDefinition = import("./db").DbLifeGoalDefinition;

export const LIFE_GOAL_CATEGORIES = [
  { value: "career", label: "Career & Achievement" },
  { value: "adventure", label: "Adventure & Travel" },
  { value: "personal", label: "Personal & Lifestyle" },
  { value: "impact", label: "Impact & Legacy" },
] as const;

// ============================================
// PROFILE PROMPTS SYSTEM
// ============================================

// Type aliases for backwards compatibility (prefer importing from db.ts directly)
export type PromptDefinition = import("./db").DbPromptDefinition;
export type UserProfilePrompt = import("./db").DbUserProfilePrompt;

export const PROMPT_CATEGORIES = [
  { value: "about_me", label: "About Me" },
  { value: "conversation", label: "Conversation Starters" },
  { value: "experiences", label: "Life & Experiences" },
  { value: "work", label: "Work & Career" },
  { value: "fun", label: "Fun & Quirky" },
  { value: "looking_for", label: "Looking For" },
] as const;
