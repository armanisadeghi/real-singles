-- RealSingles Database Schema
-- Migration: 00015_revert_gender_prefer_not_to_say
-- Description: Revert gender constraint - gender is REQUIRED for matching algorithm
-- 
-- Gender is a critical field used by the matching algorithm to show users
-- to the correct audience based on their preferences. It cannot be skipped.
-- 
-- Other fields (body_type, smoking, drinking, exercise) remain with prefer_not_to_say
-- option since they are optional lifestyle attributes.

-- ============================================
-- REVERT GENDER CONSTRAINT (REQUIRED FIELD)
-- ============================================

-- First, update any existing rows with invalid gender to NULL
-- These users will need to re-select their gender during next profile edit
UPDATE profiles SET gender = NULL WHERE gender = 'prefer_not_to_say';

-- Drop and recreate constraint without prefer_not_to_say
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_gender_check 
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'non-binary', 'other'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.gender IS 'User gender identity. REQUIRED for matching algorithm - cannot be skipped.';
