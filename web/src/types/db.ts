/**
 * Database Types and Utilities
 * 
 * This file provides:
 * 1. Typed Supabase client type
 * 2. Table Row/Insert/Update types for easy use
 * 3. Snake_case to camelCase conversion utilities
 * 4. Application-level types derived from database types
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "./database.types";

// =============================================================================
// TYPED SUPABASE CLIENT
// =============================================================================

export type TypedSupabaseClient = SupabaseClient<Database>;

// =============================================================================
// TABLE ROW TYPES (for SELECT queries - what you GET from the database)
// =============================================================================

export type DbUser = Tables<"users">;
export type DbProfile = Tables<"profiles">;
export type DbUserGallery = Tables<"user_gallery">;
export type DbUserFilters = Tables<"user_filters">;
export type DbMatch = Tables<"matches">;
export type DbFavorite = Tables<"favorites">;
export type DbFollow = Tables<"follows">;
export type DbBlock = Tables<"blocks">;
export type DbConversation = Tables<"conversations">;
export type DbConversationParticipant = Tables<"conversation_participants">;
export type DbEvent = Tables<"events">;
export type DbEventAttendee = Tables<"event_attendees">;
export type DbVirtualSpeedDating = Tables<"virtual_speed_dating">;
export type DbSpeedDatingRegistration = Tables<"speed_dating_registrations">;
export type DbProduct = Tables<"products">;
export type DbOrder = Tables<"orders">;
export type DbPointTransaction = Tables<"point_transactions">;
export type DbReferral = Tables<"referrals">;
export type DbReview = Tables<"reviews">;
export type DbReport = Tables<"reports">;
export type DbNotification = Tables<"notifications">;
export type DbContactSubmission = Tables<"contact_submissions">;

// =============================================================================
// TABLE INSERT TYPES (for INSERT queries - what you SEND to create)
// =============================================================================

export type DbUserInsert = TablesInsert<"users">;
export type DbProfileInsert = TablesInsert<"profiles">;
export type DbUserGalleryInsert = TablesInsert<"user_gallery">;
export type DbUserFiltersInsert = TablesInsert<"user_filters">;
export type DbMatchInsert = TablesInsert<"matches">;
export type DbFavoriteInsert = TablesInsert<"favorites">;
export type DbFollowInsert = TablesInsert<"follows">;
export type DbBlockInsert = TablesInsert<"blocks">;
export type DbConversationInsert = TablesInsert<"conversations">;
export type DbConversationParticipantInsert = TablesInsert<"conversation_participants">;
export type DbEventInsert = TablesInsert<"events">;
export type DbEventAttendeeInsert = TablesInsert<"event_attendees">;
export type DbVirtualSpeedDatingInsert = TablesInsert<"virtual_speed_dating">;
export type DbSpeedDatingRegistrationInsert = TablesInsert<"speed_dating_registrations">;
export type DbProductInsert = TablesInsert<"products">;
export type DbOrderInsert = TablesInsert<"orders">;
export type DbPointTransactionInsert = TablesInsert<"point_transactions">;
export type DbReferralInsert = TablesInsert<"referrals">;
export type DbReviewInsert = TablesInsert<"reviews">;
export type DbReportInsert = TablesInsert<"reports">;
export type DbNotificationInsert = TablesInsert<"notifications">;
export type DbContactSubmissionInsert = TablesInsert<"contact_submissions">;

// =============================================================================
// TABLE UPDATE TYPES (for UPDATE queries - what you SEND to update)
// =============================================================================

export type DbUserUpdate = TablesUpdate<"users">;
export type DbProfileUpdate = TablesUpdate<"profiles">;
export type DbUserGalleryUpdate = TablesUpdate<"user_gallery">;
export type DbUserFiltersUpdate = TablesUpdate<"user_filters">;
export type DbMatchUpdate = TablesUpdate<"matches">;
export type DbFavoriteUpdate = TablesUpdate<"favorites">;
export type DbFollowUpdate = TablesUpdate<"follows">;
export type DbBlockUpdate = TablesUpdate<"blocks">;
export type DbConversationUpdate = TablesUpdate<"conversations">;
export type DbConversationParticipantUpdate = TablesUpdate<"conversation_participants">;
export type DbEventUpdate = TablesUpdate<"events">;
export type DbEventAttendeeUpdate = TablesUpdate<"event_attendees">;
export type DbVirtualSpeedDatingUpdate = TablesUpdate<"virtual_speed_dating">;
export type DbSpeedDatingRegistrationUpdate = TablesUpdate<"speed_dating_registrations">;
export type DbProductUpdate = TablesUpdate<"products">;
export type DbOrderUpdate = TablesUpdate<"orders">;
export type DbPointTransactionUpdate = TablesUpdate<"point_transactions">;
export type DbReferralUpdate = TablesUpdate<"referrals">;
export type DbReviewUpdate = TablesUpdate<"reviews">;
export type DbReportUpdate = TablesUpdate<"reports">;
export type DbNotificationUpdate = TablesUpdate<"notifications">;
export type DbContactSubmissionUpdate = TablesUpdate<"contact_submissions">;

// =============================================================================
// CASE CONVERSION UTILITIES
// =============================================================================

/**
 * Convert snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Type helper: Convert snake_case keys to camelCase
 */
type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type CamelCaseKeys<T> = {
  [K in keyof T as SnakeToCamelCase<K & string>]: T[K];
};

/**
 * Type helper: Convert camelCase keys to snake_case
 */
type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? T extends Capitalize<T>
    ? `_${Lowercase<T>}${CamelToSnakeCase<U>}`
    : `${T}${CamelToSnakeCase<U>}`
  : S;

type SnakeCaseKeys<T> = {
  [K in keyof T as CamelToSnakeCase<K & string>]: T[K];
};

/**
 * Convert object keys from snake_case to camelCase (runtime)
 */
export function toCamelCase<T extends Record<string, unknown>>(obj: T): CamelCaseKeys<T> {
  if (obj === null || typeof obj !== "object") {
    return obj as CamelCaseKeys<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "object" && item !== null
        ? toCamelCase(item as Record<string, unknown>)
        : item
    ) as unknown as CamelCaseKeys<T>;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = snakeToCamel(key);
    const value = obj[key];
    result[camelKey] =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? toCamelCase(value as Record<string, unknown>)
        : Array.isArray(value)
        ? value.map((item) =>
            typeof item === "object" && item !== null
              ? toCamelCase(item as Record<string, unknown>)
              : item
          )
        : value;
  }
  return result as CamelCaseKeys<T>;
}

/**
 * Convert object keys from camelCase to snake_case (runtime)
 */
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): SnakeCaseKeys<T> {
  if (obj === null || typeof obj !== "object") {
    return obj as SnakeCaseKeys<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "object" && item !== null
        ? toSnakeCase(item as Record<string, unknown>)
        : item
    ) as unknown as SnakeCaseKeys<T>;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = camelToSnake(key);
    const value = obj[key];
    result[snakeKey] =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? toSnakeCase(value as Record<string, unknown>)
        : Array.isArray(value)
        ? value.map((item) =>
            typeof item === "object" && item !== null
              ? toSnakeCase(item as Record<string, unknown>)
              : item
          )
        : value;
  }
  return result as SnakeCaseKeys<T>;
}

// =============================================================================
// APPLICATION-LEVEL TYPES (camelCase versions for frontend use)
// =============================================================================

/**
 * User type for application use (camelCase)
 */
export interface AppUser {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean | null;
  displayName: string | null;
  username: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastActiveAt: string | null;
  status: string | null;
  role: string | null;
  agoraUserId: string | null;
  pointsBalance: number | null;
  referralCode: string | null;
  referredBy: string | null;
}

/**
 * Profile type for application use (camelCase)
 */
export interface AppProfile {
  id: string;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  lookingFor: string[] | null;
  zodiacSign: string | null;
  bio: string | null;
  lookingForDescription: string | null;
  heightInches: number | null;
  bodyType: string | null;
  ethnicity: string[] | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  maritalStatus: string | null;
  religion: string | null;
  politicalViews: string | null;
  education: string | null;
  occupation: string | null;
  company: string | null;
  schools: string[] | null;
  languages: string[] | null;
  smoking: string | null;
  drinking: string | null;
  marijuana: string | null;
  exercise: string | null;
  hasKids: string | null;
  wantsKids: string | null;
  pets: string[] | null;
  interests: string[] | null;
  idealFirstDate: string | null;
  nonNegotiables: string | null;
  worstJob: string | null;
  dreamJob: string | null;
  nightclubOrHome: string | null;
  petPeeves: string | null;
  afterWork: string | null;
  wayToHeart: string | null;
  craziestTravelStory: string | null;
  weirdestGift: string | null;
  pastEvent: string | null;
  socialLink1: string | null;
  socialLink2: string | null;
  profileImageUrl: string | null;
  isVerified: boolean | null;
  verifiedAt: string | null;
  verificationSelfieUrl: string | null;
  isPhotoVerified: boolean | null;
  photoVerifiedAt: string | null;
  isIdVerified: boolean | null;
  idVerifiedAt: string | null;
  idDocumentUrl: string | null;
  profileCompletionStep: number | null;
  profileCompletionSkipped: string[] | null;
  profileCompletionPreferNot: string[] | null;
  profileCompletedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * User Gallery item type for application use (camelCase)
 */
export interface AppUserGallery {
  id: string;
  userId: string | null;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  isLivePhoto: boolean | null;
  isPrimary: boolean | null;
  displayOrder: number | null;
  createdAt: string | null;
}

/**
 * Event type for application use (camelCase)
 */
export interface AppEvent {
  id: string;
  createdBy: string | null;
  title: string;
  description: string | null;
  eventType: string;
  imageUrl: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  startDatetime: string;
  endDatetime: string | null;
  timezone: string | null;
  maxAttendees: number | null;
  currentAttendees: number | null;
  isPublic: boolean | null;
  requiresApproval: boolean | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Notification type for application use (camelCase)
 */
export interface AppNotification {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean | null;
  readAt: string | null;
  createdAt: string | null;
}

/**
 * Conversation type for application use (camelCase)
 */
export interface AppConversation {
  id: string;
  type: string | null;
  groupName: string | null;
  groupImageUrl: string | null;
  createdBy: string | null;
  agoraGroupId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Product type for application use (camelCase)
 */
export interface AppProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  retailValue: number | null;
  category: string | null;
  stockQuantity: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// =============================================================================
// CONVERSION FUNCTIONS FOR SPECIFIC TYPES
// =============================================================================

/**
 * Convert DbUser to AppUser
 */
export function dbUserToApp(dbUser: DbUser): AppUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    phone: dbUser.phone,
    phoneVerified: dbUser.phone_verified,
    displayName: dbUser.display_name,
    username: dbUser.username,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    lastActiveAt: dbUser.last_active_at,
    status: dbUser.status,
    role: dbUser.role,
    agoraUserId: dbUser.agora_user_id,
    pointsBalance: dbUser.points_balance,
    referralCode: dbUser.referral_code,
    referredBy: dbUser.referred_by,
  };
}

/**
 * Convert DbProfile to AppProfile
 */
export function dbProfileToApp(dbProfile: DbProfile): AppProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    firstName: dbProfile.first_name,
    lastName: dbProfile.last_name,
    dateOfBirth: dbProfile.date_of_birth,
    gender: dbProfile.gender,
    lookingFor: dbProfile.looking_for,
    zodiacSign: dbProfile.zodiac_sign,
    bio: dbProfile.bio,
    lookingForDescription: dbProfile.looking_for_description,
    heightInches: dbProfile.height_inches,
    bodyType: dbProfile.body_type,
    ethnicity: dbProfile.ethnicity,
    city: dbProfile.city,
    state: dbProfile.state,
    country: dbProfile.country,
    zipCode: dbProfile.zip_code,
    latitude: dbProfile.latitude,
    longitude: dbProfile.longitude,
    maritalStatus: dbProfile.marital_status,
    religion: dbProfile.religion,
    politicalViews: dbProfile.political_views,
    education: dbProfile.education,
    occupation: dbProfile.occupation,
    company: dbProfile.company,
    schools: dbProfile.schools,
    languages: dbProfile.languages,
    smoking: dbProfile.smoking,
    drinking: dbProfile.drinking,
    marijuana: dbProfile.marijuana,
    exercise: dbProfile.exercise,
    hasKids: dbProfile.has_kids,
    wantsKids: dbProfile.wants_kids,
    pets: dbProfile.pets,
    interests: dbProfile.interests,
    idealFirstDate: dbProfile.ideal_first_date,
    nonNegotiables: dbProfile.non_negotiables,
    worstJob: dbProfile.worst_job,
    dreamJob: dbProfile.dream_job,
    nightclubOrHome: dbProfile.nightclub_or_home,
    petPeeves: dbProfile.pet_peeves,
    afterWork: dbProfile.after_work,
    wayToHeart: dbProfile.way_to_heart,
    craziestTravelStory: dbProfile.craziest_travel_story,
    weirdestGift: dbProfile.weirdest_gift,
    pastEvent: dbProfile.past_event,
    socialLink1: dbProfile.social_link_1,
    socialLink2: dbProfile.social_link_2,
    profileImageUrl: dbProfile.profile_image_url,
    isVerified: dbProfile.is_verified,
    verifiedAt: dbProfile.verified_at,
    verificationSelfieUrl: dbProfile.verification_selfie_url,
    isPhotoVerified: dbProfile.is_photo_verified,
    photoVerifiedAt: dbProfile.photo_verified_at,
    isIdVerified: dbProfile.is_id_verified,
    idVerifiedAt: dbProfile.id_verified_at,
    idDocumentUrl: dbProfile.id_document_url,
    profileCompletionStep: dbProfile.profile_completion_step,
    profileCompletionSkipped: dbProfile.profile_completion_skipped,
    profileCompletionPreferNot: dbProfile.profile_completion_prefer_not,
    profileCompletedAt: dbProfile.profile_completed_at,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

/**
 * Convert AppProfile partial to DbProfileUpdate (for updates)
 */
export function appProfileToDbUpdate(appProfile: Partial<AppProfile>): DbProfileUpdate {
  const update: DbProfileUpdate = {};
  
  if (appProfile.firstName !== undefined) update.first_name = appProfile.firstName;
  if (appProfile.lastName !== undefined) update.last_name = appProfile.lastName;
  if (appProfile.dateOfBirth !== undefined) update.date_of_birth = appProfile.dateOfBirth;
  if (appProfile.gender !== undefined) update.gender = appProfile.gender;
  if (appProfile.lookingFor !== undefined) update.looking_for = appProfile.lookingFor;
  if (appProfile.zodiacSign !== undefined) update.zodiac_sign = appProfile.zodiacSign;
  if (appProfile.bio !== undefined) update.bio = appProfile.bio;
  if (appProfile.lookingForDescription !== undefined) update.looking_for_description = appProfile.lookingForDescription;
  if (appProfile.heightInches !== undefined) update.height_inches = appProfile.heightInches;
  if (appProfile.bodyType !== undefined) update.body_type = appProfile.bodyType;
  if (appProfile.ethnicity !== undefined) update.ethnicity = appProfile.ethnicity;
  if (appProfile.city !== undefined) update.city = appProfile.city;
  if (appProfile.state !== undefined) update.state = appProfile.state;
  if (appProfile.country !== undefined) update.country = appProfile.country;
  if (appProfile.zipCode !== undefined) update.zip_code = appProfile.zipCode;
  if (appProfile.latitude !== undefined) update.latitude = appProfile.latitude;
  if (appProfile.longitude !== undefined) update.longitude = appProfile.longitude;
  if (appProfile.maritalStatus !== undefined) update.marital_status = appProfile.maritalStatus;
  if (appProfile.religion !== undefined) update.religion = appProfile.religion;
  if (appProfile.politicalViews !== undefined) update.political_views = appProfile.politicalViews;
  if (appProfile.education !== undefined) update.education = appProfile.education;
  if (appProfile.occupation !== undefined) update.occupation = appProfile.occupation;
  if (appProfile.company !== undefined) update.company = appProfile.company;
  if (appProfile.schools !== undefined) update.schools = appProfile.schools;
  if (appProfile.languages !== undefined) update.languages = appProfile.languages;
  if (appProfile.smoking !== undefined) update.smoking = appProfile.smoking;
  if (appProfile.drinking !== undefined) update.drinking = appProfile.drinking;
  if (appProfile.marijuana !== undefined) update.marijuana = appProfile.marijuana;
  if (appProfile.exercise !== undefined) update.exercise = appProfile.exercise;
  if (appProfile.hasKids !== undefined) update.has_kids = appProfile.hasKids;
  if (appProfile.wantsKids !== undefined) update.wants_kids = appProfile.wantsKids;
  if (appProfile.pets !== undefined) update.pets = appProfile.pets;
  if (appProfile.interests !== undefined) update.interests = appProfile.interests;
  if (appProfile.idealFirstDate !== undefined) update.ideal_first_date = appProfile.idealFirstDate;
  if (appProfile.nonNegotiables !== undefined) update.non_negotiables = appProfile.nonNegotiables;
  if (appProfile.worstJob !== undefined) update.worst_job = appProfile.worstJob;
  if (appProfile.dreamJob !== undefined) update.dream_job = appProfile.dreamJob;
  if (appProfile.nightclubOrHome !== undefined) update.nightclub_or_home = appProfile.nightclubOrHome;
  if (appProfile.petPeeves !== undefined) update.pet_peeves = appProfile.petPeeves;
  if (appProfile.afterWork !== undefined) update.after_work = appProfile.afterWork;
  if (appProfile.wayToHeart !== undefined) update.way_to_heart = appProfile.wayToHeart;
  if (appProfile.craziestTravelStory !== undefined) update.craziest_travel_story = appProfile.craziestTravelStory;
  if (appProfile.weirdestGift !== undefined) update.weirdest_gift = appProfile.weirdestGift;
  if (appProfile.pastEvent !== undefined) update.past_event = appProfile.pastEvent;
  if (appProfile.socialLink1 !== undefined) update.social_link_1 = appProfile.socialLink1;
  if (appProfile.socialLink2 !== undefined) update.social_link_2 = appProfile.socialLink2;
  if (appProfile.profileImageUrl !== undefined) update.profile_image_url = appProfile.profileImageUrl;
  if (appProfile.profileCompletionStep !== undefined) update.profile_completion_step = appProfile.profileCompletionStep;
  if (appProfile.profileCompletionSkipped !== undefined) update.profile_completion_skipped = appProfile.profileCompletionSkipped;
  if (appProfile.profileCompletionPreferNot !== undefined) update.profile_completion_prefer_not = appProfile.profileCompletionPreferNot;
  if (appProfile.profileCompletedAt !== undefined) update.profile_completed_at = appProfile.profileCompletedAt;
  
  return update;
}

/**
 * Convert DbUserGallery to AppUserGallery
 */
export function dbUserGalleryToApp(dbGallery: DbUserGallery): AppUserGallery {
  return {
    id: dbGallery.id,
    userId: dbGallery.user_id,
    mediaType: dbGallery.media_type,
    mediaUrl: dbGallery.media_url,
    thumbnailUrl: dbGallery.thumbnail_url,
    isLivePhoto: dbGallery.is_live_photo,
    isPrimary: dbGallery.is_primary,
    displayOrder: dbGallery.display_order,
    createdAt: dbGallery.created_at,
  };
}

/**
 * Convert DbEvent to AppEvent
 */
export function dbEventToApp(dbEvent: DbEvent): AppEvent {
  return {
    id: dbEvent.id,
    createdBy: dbEvent.created_by,
    title: dbEvent.title,
    description: dbEvent.description,
    eventType: dbEvent.event_type,
    imageUrl: dbEvent.image_url,
    venueName: dbEvent.venue_name,
    address: dbEvent.address,
    city: dbEvent.city,
    state: dbEvent.state,
    latitude: dbEvent.latitude,
    longitude: dbEvent.longitude,
    startDatetime: dbEvent.start_datetime,
    endDatetime: dbEvent.end_datetime,
    timezone: dbEvent.timezone,
    maxAttendees: dbEvent.max_attendees,
    currentAttendees: dbEvent.current_attendees,
    isPublic: dbEvent.is_public,
    requiresApproval: dbEvent.requires_approval,
    status: dbEvent.status,
    createdAt: dbEvent.created_at,
    updatedAt: dbEvent.updated_at,
  };
}

/**
 * Convert DbNotification to AppNotification
 */
export function dbNotificationToApp(dbNotification: DbNotification): AppNotification {
  return {
    id: dbNotification.id,
    userId: dbNotification.user_id,
    type: dbNotification.type,
    title: dbNotification.title,
    body: dbNotification.body,
    data: dbNotification.data as Record<string, unknown> | null,
    isRead: dbNotification.is_read,
    readAt: dbNotification.read_at,
    createdAt: dbNotification.created_at,
  };
}

/**
 * Convert DbProduct to AppProduct
 */
export function dbProductToApp(dbProduct: DbProduct): AppProduct {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    imageUrl: dbProduct.image_url,
    pointsCost: dbProduct.points_cost,
    retailValue: dbProduct.retail_value,
    category: dbProduct.category,
    stockQuantity: dbProduct.stock_quantity,
    isActive: dbProduct.is_active,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
  };
}

// =============================================================================
// ADDITIONAL DATABASE TYPES
// =============================================================================

export type DbLifeGoalDefinition = Tables<"life_goal_definitions">;
export type DbPromptDefinition = Tables<"prompt_definitions">;
export type DbUserProfilePrompt = Tables<"user_profile_prompts">;

// =============================================================================
// ADDITIONAL APPLICATION-LEVEL TYPES
// =============================================================================

/**
 * Match type for application use (camelCase)
 */
export interface AppMatch {
  id: string;
  userId: string | null;
  targetUserId: string | null;
  action: string;
  createdAt: string | null;
}

/**
 * Review type for application use (camelCase)
 */
export interface AppReview {
  id: string;
  reviewerId: string | null;
  reviewedUserId: string | null;
  relationship: string | null;
  rating: number | null;
  reviewText: string | null;
  isApproved: boolean | null;
  approvedBy: string | null;
  approvedAt: string | null;
  pointsAwarded: number | null;
  createdAt: string | null;
}

/**
 * Order type for application use (camelCase)
 */
export interface AppOrder {
  id: string;
  userId: string | null;
  productId: string | null;
  pointsSpent: number;
  status: string | null;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  trackingNumber: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Referral type for application use (camelCase)
 */
export interface AppReferral {
  id: string;
  referrerId: string | null;
  referredUserId: string | null;
  status: string | null;
  pointsAwarded: number | null;
  createdAt: string | null;
  completedAt: string | null;
}

/**
 * Block type for application use (camelCase)
 */
export interface AppBlock {
  id: string;
  blockerId: string | null;
  blockedId: string | null;
  createdAt: string | null;
}

/**
 * Favorite type for application use (camelCase)
 */
export interface AppFavorite {
  id: string;
  userId: string | null;
  favoriteUserId: string | null;
  createdAt: string | null;
}

/**
 * Speed Dating Session type for application use (camelCase)
 */
export interface AppSpeedDatingSession {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  scheduledDatetime: string;
  durationMinutes: number | null;
  roundDurationSeconds: number | null;
  minParticipants: number | null;
  maxParticipants: number | null;
  genderPreference: string | null;
  ageMin: number | null;
  ageMax: number | null;
  status: string | null;
  agoraChannelPrefix: string | null;
  createdAt: string | null;
}

/**
 * Event Attendee type for application use (camelCase)
 */
export interface AppEventAttendee {
  id: string;
  eventId: string | null;
  userId: string | null;
  status: string | null;
  registeredAt: string | null;
}

/**
 * Life Goal Definition type for application use (camelCase)
 */
export interface AppLifeGoalDefinition {
  id: string;
  key: string;
  label: string;
  category: string;
  description: string | null;
  icon: string | null;
  isActive: boolean | null;
  displayOrder: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Prompt Definition type for application use (camelCase)
 */
export interface AppPromptDefinition {
  id: string;
  key: string;
  promptText: string;
  placeholderText: string | null;
  category: string;
  maxLength: number | null;
  isActive: boolean | null;
  isRequired: boolean | null;
  displayOrder: number | null;
  icon: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * User Profile Prompt type for application use (camelCase)
 */
export interface AppUserProfilePrompt {
  id: string;
  userId: string;
  promptKey: string;
  response: string;
  displayOrder: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// =============================================================================
// ADDITIONAL CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert DbMatch to AppMatch
 */
export function dbMatchToApp(dbMatch: DbMatch): AppMatch {
  return {
    id: dbMatch.id,
    userId: dbMatch.user_id,
    targetUserId: dbMatch.target_user_id,
    action: dbMatch.action,
    createdAt: dbMatch.created_at,
  };
}

/**
 * Convert DbReview to AppReview
 */
export function dbReviewToApp(dbReview: DbReview): AppReview {
  return {
    id: dbReview.id,
    reviewerId: dbReview.reviewer_id,
    reviewedUserId: dbReview.reviewed_user_id,
    relationship: dbReview.relationship,
    rating: dbReview.rating,
    reviewText: dbReview.review_text,
    isApproved: dbReview.is_approved,
    approvedBy: dbReview.approved_by,
    approvedAt: dbReview.approved_at,
    pointsAwarded: dbReview.points_awarded,
    createdAt: dbReview.created_at,
  };
}

/**
 * Convert DbOrder to AppOrder
 */
export function dbOrderToApp(dbOrder: DbOrder): AppOrder {
  return {
    id: dbOrder.id,
    userId: dbOrder.user_id,
    productId: dbOrder.product_id,
    pointsSpent: dbOrder.points_spent,
    status: dbOrder.status,
    shippingName: dbOrder.shipping_name,
    shippingAddress: dbOrder.shipping_address,
    shippingCity: dbOrder.shipping_city,
    shippingState: dbOrder.shipping_state,
    shippingZip: dbOrder.shipping_zip,
    shippingCountry: dbOrder.shipping_country,
    trackingNumber: dbOrder.tracking_number,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
  };
}

/**
 * Convert DbReferral to AppReferral
 */
export function dbReferralToApp(dbReferral: DbReferral): AppReferral {
  return {
    id: dbReferral.id,
    referrerId: dbReferral.referrer_id,
    referredUserId: dbReferral.referred_user_id,
    status: dbReferral.status,
    pointsAwarded: dbReferral.points_awarded,
    createdAt: dbReferral.created_at,
    completedAt: dbReferral.completed_at,
  };
}

/**
 * Convert DbBlock to AppBlock
 */
export function dbBlockToApp(dbBlock: DbBlock): AppBlock {
  return {
    id: dbBlock.id,
    blockerId: dbBlock.blocker_id,
    blockedId: dbBlock.blocked_id,
    createdAt: dbBlock.created_at,
  };
}

/**
 * Convert DbVirtualSpeedDating to AppSpeedDatingSession
 */
export function dbSpeedDatingToApp(dbSession: DbVirtualSpeedDating): AppSpeedDatingSession {
  return {
    id: dbSession.id,
    title: dbSession.title,
    description: dbSession.description,
    imageUrl: dbSession.image_url,
    scheduledDatetime: dbSession.scheduled_datetime,
    durationMinutes: dbSession.duration_minutes,
    roundDurationSeconds: dbSession.round_duration_seconds,
    minParticipants: dbSession.min_participants,
    maxParticipants: dbSession.max_participants,
    genderPreference: dbSession.gender_preference,
    ageMin: dbSession.age_min,
    ageMax: dbSession.age_max,
    status: dbSession.status,
    agoraChannelPrefix: dbSession.agora_channel_prefix,
    createdAt: dbSession.created_at,
  };
}

/**
 * Convert DbLifeGoalDefinition to AppLifeGoalDefinition
 */
export function dbLifeGoalToApp(dbGoal: DbLifeGoalDefinition): AppLifeGoalDefinition {
  return {
    id: dbGoal.id,
    key: dbGoal.key,
    label: dbGoal.label,
    category: dbGoal.category,
    description: dbGoal.description,
    icon: dbGoal.icon,
    isActive: dbGoal.is_active,
    displayOrder: dbGoal.display_order,
    createdAt: dbGoal.created_at,
    updatedAt: dbGoal.updated_at,
  };
}

/**
 * Convert DbPromptDefinition to AppPromptDefinition
 */
export function dbPromptToApp(dbPrompt: DbPromptDefinition): AppPromptDefinition {
  return {
    id: dbPrompt.id,
    key: dbPrompt.key,
    promptText: dbPrompt.prompt_text,
    placeholderText: dbPrompt.placeholder_text,
    category: dbPrompt.category,
    maxLength: dbPrompt.max_length,
    isActive: dbPrompt.is_active,
    isRequired: dbPrompt.is_required,
    displayOrder: dbPrompt.display_order,
    icon: dbPrompt.icon,
    createdAt: dbPrompt.created_at,
    updatedAt: dbPrompt.updated_at,
  };
}

// =============================================================================
// RE-EXPORT DATABASE TYPES FOR CONVENIENCE
// =============================================================================

export type { Database, Tables, TablesInsert, TablesUpdate } from "./database.types";
