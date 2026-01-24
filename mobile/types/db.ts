/**
 * Database Types and Utilities for Mobile
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
 * Convert object keys from snake_case to camelCase (runtime)
 */
export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "object" && item !== null
        ? toCamelCase(item as Record<string, unknown>)
        : item
    ) as unknown as Record<string, unknown>;
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
  return result;
}

/**
 * Convert object keys from camelCase to snake_case (runtime)
 */
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "object" && item !== null
        ? toSnakeCase(item as Record<string, unknown>)
        : item
    ) as unknown as Record<string, unknown>;
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
  return result;
}

// =============================================================================
// RE-EXPORT DATABASE TYPES FOR CONVENIENCE
// =============================================================================

export type { Database, Tables, TablesInsert, TablesUpdate } from "./database.types";
