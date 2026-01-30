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
 * @updated migration: 00023_profile_field_updates.sql
 */

// ============================================
// REQUIRED FIELDS (cannot be null/skipped)
// ============================================

/**
 * Gender - REQUIRED for matching algorithm
 * @constraint profiles_gender_check (migration: 00001, reverted in 00015)
 */
export type DbGender = "male" | "female" | "non-binary" | "other";

// ============================================
// OPTIONAL FIELDS (can be null, no prefer_not_to_say)
// ============================================

/**
 * Body Type - Optional
 * @constraint profiles_body_type_check (migration: 00023)
 */
export type DbBodyType = 
  | "slim" 
  | "athletic" 
  | "average" 
  | "muscular" 
  | "curvy" 
  | "plus_size";

/**
 * Marital Status - Optional
 * @constraint profiles_marital_status_check (migration: 00023)
 */
export type DbMaritalStatus = 
  | "never_married" 
  | "separated" 
  | "divorced" 
  | "widowed";

/**
 * Has Kids - "Do you have children"
 * @constraint profiles_has_kids_check (migration: 00023)
 */
export type DbHasKids = 
  | "no" 
  | "yes_live_at_home" 
  | "yes_live_away"
  | "yes_shared";

/**
 * Wants Kids - "Do you want children"
 * @constraint profiles_wants_kids_check (migration: 00023)
 */
export type DbWantsKids = 
  | "no" 
  | "no_ok_if_partner_has" 
  | "yes" 
  | "not_sure";

/**
 * Smoking - Optional lifestyle
 * @constraint profiles_smoking_check (migration: 00023)
 */
export type DbSmoking = 
  | "never" 
  | "occasionally" 
  | "daily" 
  | "trying_to_quit";

/**
 * Drinking - Optional lifestyle
 * @constraint profiles_drinking_check (migration: 00023)
 */
export type DbDrinking = 
  | "never" 
  | "social" 
  | "moderate" 
  | "regular";

/**
 * Marijuana - Optional lifestyle
 * @constraint profiles_marijuana_check (migration: 00023)
 */
export type DbMarijuana = 
  | "never" 
  | "yes" 
  | "occasionally";

/**
 * Exercise - Optional lifestyle
 * @constraint profiles_exercise_check (migration: 00023)
 */
export type DbExercise = 
  | "never" 
  | "sometimes" 
  | "regularly" 
  | "daily";

/**
 * Dating Intentions - Optional
 * @constraint profiles_dating_intentions_check (migration: 00023)
 */
export type DbDatingIntentions = 
  | "life_partner" 
  | "long_term" 
  | "long_term_open" 
  | "figuring_out";

// ============================================
// UNCONSTRAINED FIELDS (no DB CHECK, but typed for consistency)
// ============================================

/**
 * Education - No DB constraint
 */
export type DbEducation = 
  | "high_school" 
  | "some_college" 
  | "associate" 
  | "bachelor" 
  | "graduate" 
  | "phd"
  | "trade_school";

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
 * Split Christian/LDS/Protestant into separate options
 */
export type DbReligion = 
  | "adventist" 
  | "agnostic" 
  | "atheist" 
  | "buddhist" 
  | "catholic" 
  | "christian"
  | "lds"
  | "protestant"
  | "hindu" 
  | "jewish" 
  | "muslim" 
  | "spiritual" 
  | "other";

/**
 * Political Views - No DB constraint
 */
export type DbPolitical = 
  | "undecided" 
  | "conservative" 
  | "liberal" 
  | "libertarian" 
  | "moderate"
  | "not_political";

/**
 * Pets - No DB constraint, stored as TEXT[]
 */
export type DbPets = 
  | "dog" 
  | "cat" 
  | "fish"
  | "other"
  | "dont_have_but_love"
  | "pet_free"
  | "allergic";

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
 * Required fields that cannot be null
 */
export const REQUIRED_FIELDS = ["gender"] as const;

/**
 * Optional fields that can be null (user can skip them)
 * Note: These no longer have "prefer_not_to_say" options,
 * users simply leave them null/unset if they don't want to answer
 */
export const OPTIONAL_FIELDS = [
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
  "pets",
  "hometown",
] as const;

export type RequiredField = typeof REQUIRED_FIELDS[number];
export type OptionalField = typeof OPTIONAL_FIELDS[number];

// Legacy alias for backwards compatibility
export const SKIPPABLE_FIELDS = OPTIONAL_FIELDS;
export type SkippableField = OptionalField;
