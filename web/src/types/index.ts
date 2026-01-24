// Database Types
// These types should be generated from Supabase once the database is set up
// For now, these are based on the schema defined in project_requirements.md

// ============================================
// STANDARDIZED OPTIONS (Must match across all platforms)
// ============================================

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-Binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const BODY_TYPE_OPTIONS = [
  { value: "slim", label: "Slim/Slender" },
  { value: "athletic", label: "Athletic/Fit" },
  { value: "average", label: "Average" },
  { value: "muscular", label: "Muscular" },
  { value: "curvy", label: "Curvy" },
  { value: "plus_size", label: "A few extra pounds" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { value: "never_married", label: "Never Married" },
  { value: "separated", label: "Currently Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widow/Widower" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const HAS_KIDS_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes_live_at_home", label: "Yes (Live at home)" },
  { value: "yes_live_away", label: "Yes (Live away)" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const WANTS_KIDS_OPTIONS = [
  { value: "no", label: "No" },
  { value: "definitely", label: "Definitely" },
  { value: "someday", label: "Someday" },
  { value: "ok_if_partner_has", label: "No (but OK if partner has)" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const SMOKING_OPTIONS = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Yes (Occasionally)" },
  { value: "daily", label: "Yes (Daily)" },
  { value: "trying_to_quit", label: "Trying to quit" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const DRINKING_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "social", label: "Social" },
  { value: "moderate", label: "Moderately" },
  { value: "regular", label: "Regular" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const MARIJUANA_OPTIONS = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "yes", label: "Yes" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const EXERCISE_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "sometimes", label: "Sometimes" },
  { value: "regularly", label: "Regularly" },
  { value: "daily", label: "Daily" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

// Dating intentions - critical for serious-dater positioning (The League, Hinge model)
export const DATING_INTENTIONS_OPTIONS = [
  { value: "life_partner", label: "Life Partner" },
  { value: "long_term", label: "Long-term Relationship" },
  { value: "long_term_open", label: "Long-term, Open to Short" },
  { value: "figuring_out", label: "Figuring Out My Goals" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const EDUCATION_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "some_college", label: "Some College" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "graduate", label: "Graduate Degree" },
  { value: "phd", label: "PhD/Post-doctoral" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const ETHNICITY_OPTIONS = [
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

export const RELIGION_OPTIONS = [
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

export const POLITICAL_OPTIONS = [
  { value: "no_answer", label: "No answer" },
  { value: "undecided", label: "Undecided" },
  { value: "conservative", label: "Conservative" },
  { value: "liberal", label: "Liberal" },
  { value: "libertarian", label: "Libertarian" },
  { value: "moderate", label: "Moderate" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const ZODIAC_OPTIONS = [
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
// ENTITY INTERFACES
// ============================================

export interface User {
  id: string;
  email: string;
  phone?: string;
  phone_verified: boolean;
  display_name?: string;
  username?: string;
  created_at: string;
  updated_at: string;
  last_active_at?: string;
  status: "active" | "suspended" | "deleted";
  role: "user" | "admin" | "moderator";
  agora_user_id?: string;
  points_balance: number;
  referral_code?: string;
  referred_by?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  
  // Basic Info
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "non-binary" | "other";
  looking_for?: string[];
  zodiac_sign?: string;
  bio?: string;
  looking_for_description?: string;
  dating_intentions?: "life_partner" | "long_term" | "long_term_open" | "figuring_out" | "prefer_not_to_say";
  
  // Physical Attributes
  height_inches?: number;
  body_type?: "slim" | "athletic" | "average" | "muscular" | "curvy" | "plus_size";
  ethnicity?: string[]; // Array for mixed heritage
  
  // Location
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  
  // Lifestyle
  marital_status?: "never_married" | "separated" | "divorced" | "widowed" | "prefer_not_to_say";
  religion?: string;
  political_views?: string;
  education?: string;
  occupation?: string;
  company?: string;
  schools?: string[];
  languages?: string[];
  smoking?: "no" | "occasionally" | "daily" | "trying_to_quit";
  drinking?: "never" | "social" | "moderate" | "regular";
  marijuana?: "no" | "yes" | "occasionally";
  exercise?: "never" | "sometimes" | "regularly" | "daily";
  
  // Family
  has_kids?: "no" | "yes_live_at_home" | "yes_live_away";
  wants_kids?: "no" | "definitely" | "someday" | "ok_if_partner_has";
  pets?: string[];
  
  // Interests
  interests?: string[];
  
  // Profile Prompts (Structured Storytelling per business logic)
  ideal_first_date?: string;
  non_negotiables?: string;
  worst_job?: string;
  dream_job?: string;
  nightclub_or_home?: string;
  pet_peeves?: string;
  after_work?: string;
  way_to_heart?: string;
  craziest_travel_story?: string;
  weirdest_gift?: string;
  past_event?: string;
  
  // Social Links
  social_link_1?: string;
  social_link_2?: string;
  
  // Media
  profile_image_url?: string;
  voice_prompt_url?: string;
  video_intro_url?: string;
  voice_prompt_duration_seconds?: number;
  video_intro_duration_seconds?: number;
  
  // Life Goals (The League model)
  life_goals?: string[];
  
  // Verification (Basic - selfie)
  is_verified: boolean;
  verified_at?: string;
  verification_selfie_url?: string;
  
  // Photo Verification (Required for matching)
  is_photo_verified?: boolean;
  photo_verified_at?: string;
  
  // ID Verification (Premium tier)
  is_id_verified?: boolean;
  id_verified_at?: string;
  id_document_url?: string;
  
  // Profile Completion Tracking
  profile_completion_step?: number;
  profile_completion_skipped?: string[];
  profile_completion_prefer_not?: string[];
  profile_completed_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UserGallery {
  id: string;
  user_id: string;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url?: string;
  is_live_photo: boolean;
  is_primary: boolean;
  display_order?: number;
  created_at: string;
}

export interface UserFilters {
  id: string;
  user_id: string;
  min_age: number;
  max_age: number;
  min_height?: number;
  max_height?: number;
  max_distance_miles: number;
  gender?: string[];
  body_types?: string[];
  ethnicities?: string[];
  religions?: string[];
  education_levels?: string[];
  has_kids?: "any" | "yes" | "no";
  wants_kids?: "any" | "yes" | "no" | "maybe";
  smoking?: "any" | "never" | "occasionally" | "regularly";
  drinking?: string;
  marijuana?: string;
  zodiac_signs?: string[];
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  target_user_id: string;
  action: "like" | "pass" | "super_like";
  created_at: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  group_name?: string;
  group_image_url?: string;
  created_by?: string;
  agora_group_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  favorite_user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Event {
  id: string;
  created_by?: string;
  title: string;
  description?: string;
  event_type: "in_person" | "virtual" | "speed_dating";
  image_url?: string;
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  start_datetime: string;
  end_datetime?: string;
  timezone: string;
  max_attendees?: number;
  current_attendees: number;
  is_public: boolean;
  requires_approval: boolean;
  status: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: "interested" | "registered" | "attended" | "cancelled";
  registered_at: string;
}

export interface VirtualSpeedDating {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  scheduled_datetime: string;
  duration_minutes: number;
  round_duration_seconds: number;
  min_participants: number;
  max_participants: number;
  gender_preference?: "mixed" | "men_only" | "women_only";
  age_min?: number;
  age_max?: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  agora_channel_prefix?: string;
  created_at: string;
}

export interface SpeedDatingRegistration {
  id: string;
  session_id: string;
  user_id: string;
  status: "registered" | "checked_in" | "completed" | "no_show";
  registered_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type:
    | "referral"
    | "review"
    | "event_attendance"
    | "redemption"
    | "admin_adjustment";
  description?: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  points_cost: number;
  retail_value?: number;
  category?: "gift_card" | "merchandise" | "experience" | "subscription";
  stock_quantity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string;
  product_id?: string;
  points_spent: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  reviewer_id?: string;
  reviewed_user_id: string;
  relationship?: "friend" | "coworker" | "met_on_app" | "family" | "other";
  rating: number;
  review_text?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  points_awarded: number;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id?: string;
  referred_user_id: string;
  status: "pending" | "completed" | "rewarded";
  points_awarded: number;
  created_at: string;
  completed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "match" | "message" | "event" | "system" | "points";
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  user_id?: string;
  name?: string;
  email: string;
  subject?: string;
  message: string;
  status: "new" | "in_progress" | "resolved";
  responded_at?: string;
  created_at: string;
}

// API Response Types
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

export interface LifeGoalDefinition {
  id: string;
  key: string;
  label: string;
  category: string;
  description: string | null;
  icon: string | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const LIFE_GOAL_CATEGORIES = [
  { value: "career", label: "Career & Achievement" },
  { value: "adventure", label: "Adventure & Travel" },
  { value: "personal", label: "Personal & Lifestyle" },
  { value: "impact", label: "Impact & Legacy" },
] as const;

// ============================================
// PROFILE PROMPTS SYSTEM
// ============================================

export interface PromptDefinition {
  id: string;
  key: string;
  prompt_text: string;
  placeholder_text: string | null;
  category: string;
  max_length: number | null;
  is_active: boolean | null;
  is_required: boolean | null;
  display_order: number | null;
  icon: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserProfilePrompt {
  id: string;
  user_id: string;
  prompt_key: string;
  response: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const PROMPT_CATEGORIES = [
  { value: "about_me", label: "About Me" },
  { value: "conversation", label: "Conversation Starters" },
  { value: "experiences", label: "Life & Experiences" },
  { value: "work", label: "Work & Career" },
  { value: "fun", label: "Fun & Quirky" },
  { value: "looking_for", label: "Looking For" },
] as const;
