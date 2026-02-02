/**
 * Profile Validation Schemas
 * 
 * Zod schemas that validate against DB constraint types.
 * These ensure API validation matches database CHECK constraints exactly.
 * 
 * The type flow is:
 * 1. DB migrations define CHECK constraints
 * 2. db-constraints.ts defines TypeScript types matching those constraints
 * 3. This file creates Zod schemas from those types for runtime validation
 * 4. index.ts OPTIONS arrays are type-checked against the same types
 * 
 * This ensures compile-time AND runtime consistency.
 * 
 * @updated migration: 00023_profile_field_updates.sql
 */

import { z } from "zod";
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
  DbPets,
} from "@/types/db-constraints";

// ============================================
// CONSTRAINED FIELD SCHEMAS (have DB CHECK constraints)
// ============================================

// Gender - REQUIRED, CHECK constraint
const genderValues: [DbGender, ...DbGender[]] = ["male", "female", "non-binary", "other"];
export const GenderSchema = z.enum(genderValues);
export type Gender = z.infer<typeof GenderSchema>;

// Body Type - CHECK constraint (no prefer_not_to_say)
const bodyTypeValues: [DbBodyType, ...DbBodyType[]] = ["slim", "athletic", "average", "muscular", "curvy", "plus_size"];
export const BodyTypeSchema = z.enum(bodyTypeValues);
export type BodyType = z.infer<typeof BodyTypeSchema>;

// Marital Status - CHECK constraint (no prefer_not_to_say)
const maritalStatusValues: [DbMaritalStatus, ...DbMaritalStatus[]] = ["never_married", "separated", "divorced", "widowed"];
export const MaritalStatusSchema = z.enum(maritalStatusValues);
export type MaritalStatus = z.infer<typeof MaritalStatusSchema>;

// Has Kids - CHECK constraint (no prefer_not_to_say, added yes_shared)
const hasKidsValues: [DbHasKids, ...DbHasKids[]] = ["no", "yes_live_at_home", "yes_live_away", "yes_shared"];
export const HasKidsSchema = z.enum(hasKidsValues);
export type HasKids = z.infer<typeof HasKidsSchema>;

// Wants Kids - CHECK constraint (restructured)
const wantsKidsValues: [DbWantsKids, ...DbWantsKids[]] = ["no", "no_ok_if_partner_has", "yes", "not_sure"];
export const WantsKidsSchema = z.enum(wantsKidsValues);
export type WantsKids = z.infer<typeof WantsKidsSchema>;

// Smoking - CHECK constraint (no -> never, no prefer_not_to_say)
const smokingValues: [DbSmoking, ...DbSmoking[]] = ["never", "occasionally", "daily", "trying_to_quit"];
export const SmokingSchema = z.enum(smokingValues);
export type Smoking = z.infer<typeof SmokingSchema>;

// Drinking - CHECK constraint (no prefer_not_to_say)
const drinkingValues: [DbDrinking, ...DbDrinking[]] = ["never", "social", "moderate", "regular"];
export const DrinkingSchema = z.enum(drinkingValues);
export type Drinking = z.infer<typeof DrinkingSchema>;

// Marijuana - CHECK constraint (no -> never, no prefer_not_to_say)
const marijuanaValues: [DbMarijuana, ...DbMarijuana[]] = ["never", "yes", "occasionally"];
export const MarijuanaSchema = z.enum(marijuanaValues);
export type Marijuana = z.infer<typeof MarijuanaSchema>;

// Exercise - CHECK constraint (no prefer_not_to_say)
const exerciseValues: [DbExercise, ...DbExercise[]] = ["never", "sometimes", "regularly", "daily"];
export const ExerciseSchema = z.enum(exerciseValues);
export type Exercise = z.infer<typeof ExerciseSchema>;

// Dating Intentions - CHECK constraint (migration: 00024)
const datingIntentionsValues: [DbDatingIntentions, ...DbDatingIntentions[]] = ["long_term", "long_term_open", "short_term_open", "short_term", "figuring_out"];
export const DatingIntentionsSchema = z.enum(datingIntentionsValues);
export type DatingIntentions = z.infer<typeof DatingIntentionsSchema>;

// ============================================
// UNCONSTRAINED FIELD SCHEMAS (no DB CHECK, but typed for consistency)
// ============================================

// Education - no DB constraint (added trade_school, no prefer_not_to_say)
const educationValues: [DbEducation, ...DbEducation[]] = ["high_school", "trade_school", "some_college", "associate", "bachelor", "graduate", "phd"];
export const EducationSchema = z.enum(educationValues);
export type Education = z.infer<typeof EducationSchema>;

// Ethnicity - no DB constraint, stored as TEXT[] (keeps prefer_not_to_say)
const ethnicityValues: [DbEthnicity, ...DbEthnicity[]] = ["white", "latino", "black", "asian", "native_american", "east_indian", "pacific_islander", "middle_eastern", "armenian", "mixed", "other", "prefer_not_to_say"];
export const EthnicitySchema = z.enum(ethnicityValues);
export type Ethnicity = z.infer<typeof EthnicitySchema>;

// Religion - no DB constraint (Christian denominations consolidated, migration: 00024)
const religionValues: [DbReligion, ...DbReligion[]] = ["adventist", "agnostic", "atheist", "buddhist", "christian_catholic", "christian_lds", "christian_protestant", "christian_orthodox", "hindu", "jewish", "muslim", "spiritual", "other", "prefer_not_to_say"];
export const ReligionSchema = z.enum(religionValues);
export type Religion = z.infer<typeof ReligionSchema>;

// Political Views - no DB constraint (removed no_answer, added not_political, no prefer_not_to_say)
const politicalValues: [DbPolitical, ...DbPolitical[]] = ["not_political", "undecided", "conservative", "liberal", "libertarian", "moderate"];
export const PoliticalSchema = z.enum(politicalValues);
export type Political = z.infer<typeof PoliticalSchema>;

// Pets - no DB constraint (restructured)
const petsValues: [DbPets, ...DbPets[]] = ["dog", "cat", "fish", "other", "dont_have_but_love", "pet_free", "allergic"];
export const PetsSchema = z.enum(petsValues);
export type Pets = z.infer<typeof PetsSchema>;

// Zodiac Sign - no DB constraint
const zodiacValues: [DbZodiac, ...DbZodiac[]] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
export const ZodiacSchema = z.enum(zodiacValues);
export type Zodiac = z.infer<typeof ZodiacSchema>;

// ============================================
// PROFILE UPDATE SCHEMA
// ============================================

/**
 * Schema for validating profile update requests.
 * All fields are optional since partial updates are allowed.
 * 
 * This validates the API field names (PascalCase) used by clients.
 */
export const ProfileUpdateSchema = z.object({
  // Basic Info
  FirstName: z.string().min(1).max(50).optional(),
  LastName: z.string().min(1).max(50).optional(),
  DOB: z.string().optional(), // Date string
  Gender: GenderSchema.optional(),
  ZodiacSign: ZodiacSchema.optional(),
  HSign: ZodiacSchema.optional(), // Mobile alias
  Bio: z.string().max(1000).optional(),
  About: z.string().max(1000).optional(), // Mobile alias
  LookingForDescription: z.string().max(500).optional(),
  DatingIntentions: DatingIntentionsSchema.optional(),
  
  // Location
  City: z.string().max(100).optional(),
  State: z.string().max(100).optional(),
  Country: z.string().max(100).optional(),
  ZipCode: z.string().max(20).optional(),
  Zipcode: z.string().max(20).optional(), // Mobile alias
  Latitude: z.union([z.string(), z.number()]).optional(),
  Longitude: z.union([z.string(), z.number()]).optional(),
  Hometown: z.string().max(100).optional(), // NEW: Free-text hometown field
  
  // Physical
  Height: z.union([z.string(), z.number()]).optional(),
  HeightInches: z.union([z.string(), z.number()]).optional(),
  BodyType: BodyTypeSchema.optional(),
  
  // Ethnicity (can be string or array for multi-select)
  Ethnicity: z.union([
    EthnicitySchema,
    z.array(EthnicitySchema),
    z.string(), // Allow comma-separated string
  ]).optional(),
  
  // Lifestyle
  MaritalStatus: MaritalStatusSchema.optional(),
  Religion: ReligionSchema.optional(),
  Political: PoliticalSchema.optional(),
  PoliticalViews: PoliticalSchema.optional(),
  Education: EducationSchema.optional(),
  Occupation: z.string().max(100).optional(),
  JobTitle: z.string().max(100).optional(), // Mobile alias
  Company: z.string().max(100).optional(),
  
  // Habits
  Smoking: SmokingSchema.optional(),
  Drinking: DrinkingSchema.optional(),
  Drinks: DrinkingSchema.optional(), // Mobile alias
  Marijuana: MarijuanaSchema.optional(),
  Exercise: ExerciseSchema.optional(),
  
  // Family
  HasKids: HasKidsSchema.optional(),
  WantsKids: WantsKidsSchema.optional(),
  WantChild: WantsKidsSchema.optional(), // Mobile alias
  
  // Pets (can be string or array for multi-select)
  Pets: z.union([
    PetsSchema,
    z.array(PetsSchema),
    z.string(), // Allow comma-separated string
  ]).optional(),
}).passthrough(); // Allow additional fields for prompts, etc.

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

// ============================================
// VALIDATION HELPER
// ============================================

/**
 * Validates profile update data and returns typed result.
 * Returns { success: true, data } or { success: false, error }
 */
export function validateProfileUpdate(data: unknown): 
  | { success: true; data: ProfileUpdate }
  | { success: false; error: string; details: z.ZodError } {
  const result = ProfileUpdateSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Format error message with field names
  const errorMessages = result.error.issues.map((e) => {
    const path = e.path.join(".");
    return `${path}: ${e.message}`;
  });
  
  return {
    success: false,
    error: `Invalid profile data: ${errorMessages.join(", ")}`,
    details: result.error,
  };
}
