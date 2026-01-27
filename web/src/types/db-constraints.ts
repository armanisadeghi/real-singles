/**
 * Database Constraint Types
 * 
 * SINGLE SOURCE OF TRUTH for all CHECK constraint values.
 * These types MUST match the database schema exactly.
 * 
 * When adding a new value:
 * 1. Create a migration to update the DB constraint
 * 2. Add the value to the type below
 * 3. Add the value to the corresponding OPTIONS array
 * 
 * TypeScript will error at compile time if OPTIONS contains a value
 * not defined in these types.
 * 
 * @see web/supabase/migrations/ for corresponding CHECK constraints
 */

// ============================================
// REQUIRED FIELDS (cannot have prefer_not_to_say)
// ============================================

/**
 * Gender - REQUIRED for matching algorithm
 * @constraint profiles_gender_check (migration: 00001, reverted in 00015)
 */
export type DbGender = "male" | "female" | "non-binary" | "other";

// ============================================
// OPTIONAL FIELDS (can have prefer_not_to_say)
// ============================================

/**
 * Body Type - Optional, can be skipped
 * @constraint profiles_body_type_check (migration: 00005, updated 00014)
 */
export type DbBodyType = 
  | "slim" 
  | "athletic" 
  | "average" 
  | "muscular" 
  | "curvy" 
  | "plus_size"
  | "prefer_not_to_say";

/**
 * Marital Status - Optional, can be skipped
 * @constraint profiles_marital_status_check (migration: 00005)
 */
export type DbMaritalStatus = 
  | "never_married" 
  | "separated" 
  | "divorced" 
  | "widowed"
  | "prefer_not_to_say";

/**
 * Has Kids - Sensitive, can be skipped
 * @constraint profiles_has_kids_check (migration: 00005, updated 00006000)
 */
export type DbHasKids = 
  | "no" 
  | "yes_live_at_home" 
  | "yes_live_away"
  | "prefer_not_to_say";

/**
 * Wants Kids - Sensitive, can be skipped
 * @constraint profiles_wants_kids_check (migration: 00005, updated 00006000)
 */
export type DbWantsKids = 
  | "no" 
  | "definitely" 
  | "someday" 
  | "ok_if_partner_has"
  | "prefer_not_to_say";

/**
 * Smoking - Optional lifestyle, can be skipped
 * @constraint profiles_smoking_check (migration: 00005, updated 00014)
 */
export type DbSmoking = 
  | "no" 
  | "occasionally" 
  | "daily" 
  | "trying_to_quit"
  | "prefer_not_to_say";

/**
 * Drinking - Optional lifestyle, can be skipped
 * @constraint profiles_drinking_check (migration: 00005, updated 00014)
 */
export type DbDrinking = 
  | "never" 
  | "social" 
  | "moderate" 
  | "regular"
  | "prefer_not_to_say";

/**
 * Marijuana - Sensitive, can be skipped
 * @constraint profiles_marijuana_check (migration: 00005, updated 00006000)
 */
export type DbMarijuana = 
  | "no" 
  | "yes" 
  | "occasionally"
  | "prefer_not_to_say";

/**
 * Exercise - Optional lifestyle, can be skipped
 * @constraint profiles_exercise_check (migration: 00001, updated 00014)
 */
export type DbExercise = 
  | "never" 
  | "sometimes" 
  | "regularly" 
  | "daily"
  | "prefer_not_to_say";

/**
 * Dating Intentions - Optional, can be skipped
 * @constraint profiles_dating_intentions_check (migration: 00008)
 */
export type DbDatingIntentions = 
  | "life_partner" 
  | "long_term" 
  | "long_term_open" 
  | "figuring_out"
  | "prefer_not_to_say";

// ============================================
// UNCONSTRAINED FIELDS (no DB CHECK, but typed for consistency)
// ============================================

/**
 * Education - No DB constraint, but should be consistent
 */
export type DbEducation = 
  | "high_school" 
  | "some_college" 
  | "associate" 
  | "bachelor" 
  | "graduate" 
  | "phd"
  | "prefer_not_to_say";

/**
 * Ethnicity - No DB constraint, stored as TEXT[]
 */
export type DbEthnicity = 
  | "white" 
  | "latino" 
  | "black" 
  | "asian" 
  | "native_american" 
  | "east_indian" 
  | "pacific_islander" 
  | "middle_eastern" 
  | "armenian" 
  | "mixed" 
  | "other"
  | "prefer_not_to_say";

/**
 * Religion - No DB constraint
 */
export type DbReligion = 
  | "adventist" 
  | "agnostic" 
  | "atheist" 
  | "buddhist" 
  | "catholic" 
  | "christian" 
  | "hindu" 
  | "jewish" 
  | "muslim" 
  | "spiritual" 
  | "other"
  | "prefer_not_to_say";

/**
 * Political Views - No DB constraint
 */
export type DbPolitical = 
  | "no_answer" 
  | "undecided" 
  | "conservative" 
  | "liberal" 
  | "libertarian" 
  | "moderate"
  | "prefer_not_to_say";

/**
 * Zodiac Sign - No DB constraint, calculated from DOB
 */
export type DbZodiac = 
  | "aries" 
  | "taurus" 
  | "gemini" 
  | "cancer" 
  | "leo" 
  | "virgo" 
  | "libra" 
  | "scorpio" 
  | "sagittarius" 
  | "capricorn" 
  | "aquarius" 
  | "pisces";

// ============================================
// TYPE UTILITIES
// ============================================

/**
 * Type-safe option object that enforces value matches a constraint type
 */
export interface TypedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * Creates a type-safe options array where values must match the constraint type.
 * TypeScript will error if you add a value not in T.
 */
export type TypedOptions<T extends string> = readonly TypedOption<T>[];

/**
 * Helper to create type-safe options.
 * Usage: createOptions<DbGender>([{ value: "male", label: "Male" }, ...])
 * 
 * If you add { value: "invalid", label: "Invalid" }, TypeScript errors.
 */
export function createOptions<T extends string>(
  options: TypedOptions<T>
): TypedOptions<T> {
  return options;
}

// ============================================
// FIELD METADATA
// ============================================

/**
 * Categorizes fields by whether they can be skipped
 */
export const REQUIRED_FIELDS = ["gender"] as const;

export const SKIPPABLE_FIELDS = [
  "body_type",
  "marital_status", 
  "has_kids",
  "wants_kids",
  "smoking",
  "drinking",
  "marijuana",
  "exercise",
  "dating_intentions",
  "education",
  "ethnicity",
  "religion",
  "political_views",
] as const;

export type RequiredField = typeof REQUIRED_FIELDS[number];
export type SkippableField = typeof SKIPPABLE_FIELDS[number];
