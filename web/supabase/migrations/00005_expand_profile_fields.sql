-- RealSingles Database Schema
-- Migration: 00005_expand_profile_fields
-- Description: Add missing profile fields from business logic, expand options, fix constraints

-- ============================================
-- USERS TABLE ADDITIONS
-- ============================================

-- Add username column (separate from display_name per business logic)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- ============================================
-- PROFILES TABLE - NEW COLUMNS
-- ============================================

-- Additional Info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS schools TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Social Links
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_link_1 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_link_2 TEXT;

-- Profile Prompts (per business logic "Structured Storytelling")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ideal_first_date TEXT;      -- "My ideal first date starts with... and ends with..."
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS non_negotiables TEXT;       -- "My top 5 non-negotiables"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worst_job TEXT;             -- "The worst job I ever had"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dream_job TEXT;             -- "The job I'd do for no money"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nightclub_or_home TEXT;     -- "Nightclub or night at home?"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pet_peeves TEXT;            -- "My pet peeves"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS after_work TEXT;            -- "After work, you can find me..."
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS way_to_heart TEXT;          -- "The way to my heart is through..."
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS craziest_travel_story TEXT; -- "Craziest travel story"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weirdest_gift TEXT;         -- "Weirdest gift I have received"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS past_event TEXT;            -- Past event you'd attend

-- Verification Tiers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_photo_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Profile Completion Tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completion_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completion_skipped TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completion_prefer_not TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- ============================================
-- PROFILES TABLE - TYPE CHANGES
-- ============================================

-- Change has_kids from BOOLEAN to TEXT for richer options
-- Per business logic: "No, Yes (Live at home), Yes (Live away)"
ALTER TABLE profiles ALTER COLUMN has_kids TYPE TEXT USING 
  CASE 
    WHEN has_kids = true THEN 'yes_live_at_home'
    WHEN has_kids = false THEN 'no'
    ELSE NULL
  END;

-- Change ethnicity from TEXT to TEXT[] for mixed heritage support
-- First, migrate existing data to array format
ALTER TABLE profiles ALTER COLUMN ethnicity TYPE TEXT[] USING 
  CASE 
    WHEN ethnicity IS NOT NULL THEN ARRAY[ethnicity]
    ELSE NULL
  END;

-- ============================================
-- DROP OLD CONSTRAINTS
-- ============================================

-- Drop old body_type constraint (we'll add expanded one)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_body_type_check;

-- Drop old smoking constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_smoking_check;

-- Drop old drinking constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_drinking_check;

-- Drop old marijuana constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_marijuana_check;

-- Drop old wants_kids constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_wants_kids_check;

-- ============================================
-- ADD NEW CONSTRAINTS (Expanded Options)
-- ============================================

-- Body type: Add 'muscular' option per business logic
ALTER TABLE profiles ADD CONSTRAINT profiles_body_type_check 
  CHECK (body_type IN ('slim', 'athletic', 'average', 'muscular', 'curvy', 'plus_size'));

-- Smoking: Expanded options per business logic
-- "No, Yes (Occasionally), Yes (Daily), Trying to quit"
ALTER TABLE profiles ADD CONSTRAINT profiles_smoking_check 
  CHECK (smoking IN ('no', 'occasionally', 'daily', 'trying_to_quit'));

-- Drinking: Expanded options per business logic
-- "Never, Social, Moderately, Regular"
ALTER TABLE profiles ADD CONSTRAINT profiles_drinking_check 
  CHECK (drinking IN ('never', 'social', 'moderate', 'regular'));

-- Marijuana: Updated options
ALTER TABLE profiles ADD CONSTRAINT profiles_marijuana_check 
  CHECK (marijuana IN ('no', 'yes', 'occasionally'));

-- Wants kids: Updated options per business logic
-- "No, Definitely, Someday, No (but OK if partner has)"
ALTER TABLE profiles ADD CONSTRAINT profiles_wants_kids_check 
  CHECK (wants_kids IN ('no', 'definitely', 'someday', 'ok_if_partner_has'));

-- Has kids: New options per business logic
-- "No, Yes (Live at home), Yes (Live away)"
ALTER TABLE profiles ADD CONSTRAINT profiles_has_kids_check 
  CHECK (has_kids IN ('no', 'yes_live_at_home', 'yes_live_away'));

-- Marital status: Per business logic
ALTER TABLE profiles ADD CONSTRAINT profiles_marital_status_check 
  CHECK (marital_status IN ('never_married', 'separated', 'divorced', 'widowed', 'prefer_not_to_say'));

-- ============================================
-- DATA MIGRATION FOR EXISTING VALUES
-- ============================================

-- Migrate old smoking values to new format
UPDATE profiles SET smoking = 'no' WHERE smoking = 'never';
UPDATE profiles SET smoking = 'daily' WHERE smoking = 'regularly';
-- 'occasionally' stays the same

-- Migrate old drinking values to new format
UPDATE profiles SET drinking = 'social' WHERE drinking = 'socially';
UPDATE profiles SET drinking = 'regular' WHERE drinking = 'regularly';
-- 'never' stays the same

-- Migrate old marijuana values to new format
UPDATE profiles SET marijuana = 'no' WHERE marijuana = 'never';
UPDATE profiles SET marijuana = 'yes' WHERE marijuana = 'regularly';
-- 'occasionally' stays the same

-- Migrate old wants_kids values to new format
UPDATE profiles SET wants_kids = 'definitely' WHERE wants_kids = 'yes';
UPDATE profiles SET wants_kids = 'someday' WHERE wants_kids = 'maybe';
UPDATE profiles SET wants_kids = 'ok_if_partner_has' WHERE wants_kids = 'have_and_want_more';
-- 'no' stays the same

-- Migrate old body_type values
UPDATE profiles SET body_type = 'plus_size' WHERE body_type = 'plus-size';

-- ============================================
-- INDEXES FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_marital_status ON profiles(marital_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_photo_verified ON profiles(is_photo_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_is_id_verified ON profiles(is_id_verified);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN profiles.ideal_first_date IS 'Profile prompt: "My ideal first date starts with... and ends with..."';
COMMENT ON COLUMN profiles.non_negotiables IS 'Profile prompt: "My top 5 non-negotiables"';
COMMENT ON COLUMN profiles.worst_job IS 'Profile prompt: "The worst job I ever had"';
COMMENT ON COLUMN profiles.dream_job IS 'Profile prompt: "The job I''d do for no money"';
COMMENT ON COLUMN profiles.nightclub_or_home IS 'Profile prompt: "Nightclub or night at home?"';
COMMENT ON COLUMN profiles.pet_peeves IS 'Profile prompt: "My pet peeves"';
COMMENT ON COLUMN profiles.after_work IS 'Profile prompt: "After work, you can find me..."';
COMMENT ON COLUMN profiles.way_to_heart IS 'Profile prompt: "The way to my heart is through..."';
COMMENT ON COLUMN profiles.craziest_travel_story IS 'Profile prompt: "Craziest travel story"';
COMMENT ON COLUMN profiles.weirdest_gift IS 'Profile prompt: "Weirdest gift I have received"';

COMMENT ON COLUMN profiles.is_photo_verified IS 'User has completed live photo verification (required for matching)';
COMMENT ON COLUMN profiles.is_id_verified IS 'User has completed optional government ID verification (premium tier)';

COMMENT ON COLUMN profiles.profile_completion_skipped IS 'Fields the user explicitly skipped during onboarding';
COMMENT ON COLUMN profiles.profile_completion_prefer_not IS 'Fields where user selected "prefer not to share"';
