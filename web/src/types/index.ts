// Database Types
// These types should be generated from Supabase once the database is set up
// For now, these are based on the schema defined in project_requirements.md

export interface User {
  id: string;
  email: string;
  phone?: string;
  phone_verified: boolean;
  display_name?: string;
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
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "non-binary" | "other";
  looking_for?: string[];
  height_inches?: number;
  body_type?: "slim" | "athletic" | "average" | "curvy" | "plus-size";
  ethnicity?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  religion?: string;
  political_views?: string;
  education?: string;
  occupation?: string;
  smoking?: "never" | "occasionally" | "regularly";
  drinking?: "never" | "socially" | "regularly";
  marijuana?: "never" | "occasionally" | "regularly";
  exercise?: "never" | "sometimes" | "regularly" | "daily";
  has_kids?: boolean;
  wants_kids?: "yes" | "no" | "maybe" | "have_and_want_more";
  pets?: string[];
  zodiac_sign?: string;
  interests?: string[];
  bio?: string;
  looking_for_description?: string;
  is_verified: boolean;
  verified_at?: string;
  verification_selfie_url?: string;
  profile_image_url?: string;
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
