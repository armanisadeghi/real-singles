-- RealSingles Database Schema
-- Migration: 00006_prefer_not_to_say
-- Description: Add 'prefer_not_to_say' option to sensitive profile fields

-- ============================================
-- UPDATE CONSTRAINTS FOR PREFER NOT TO SAY
-- ============================================

-- Drop existing constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_has_kids_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_wants_kids_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_marijuana_check;

-- Add updated constraints with 'prefer_not_to_say' option
ALTER TABLE profiles ADD CONSTRAINT profiles_has_kids_check 
  CHECK (has_kids IN ('no', 'yes_live_at_home', 'yes_live_away', 'prefer_not_to_say'));

ALTER TABLE profiles ADD CONSTRAINT profiles_wants_kids_check 
  CHECK (wants_kids IN ('no', 'definitely', 'someday', 'ok_if_partner_has', 'prefer_not_to_say'));

ALTER TABLE profiles ADD CONSTRAINT profiles_marijuana_check 
  CHECK (marijuana IN ('no', 'yes', 'occasionally', 'prefer_not_to_say'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.has_kids IS 'Whether user has children. "prefer_not_to_say" for privacy.';
COMMENT ON COLUMN profiles.wants_kids IS 'Whether user wants children. "prefer_not_to_say" for privacy.';
COMMENT ON COLUMN profiles.marijuana IS 'Marijuana usage. "prefer_not_to_say" for privacy.';
