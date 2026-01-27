-- RealSingles Database Schema
-- Migration: 00014_add_prefer_not_to_say
-- Description: Add 'prefer_not_to_say' option to remaining sensitive profile fields
-- 
-- This migration completes the work started in 00006000_prefer_not_to_say.sql
-- which only updated has_kids, wants_kids, and marijuana.
-- 
-- Fields being updated: gender, body_type, smoking, drinking, exercise

-- ============================================
-- UPDATE CONSTRAINTS FOR PREFER NOT TO SAY
-- ============================================

-- Gender - allows users to keep their gender private
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_gender_check 
  CHECK (gender IN ('male', 'female', 'non-binary', 'other', 'prefer_not_to_say'));

-- Body Type - sensitive physical attribute
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_body_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_body_type_check 
  CHECK (body_type IN ('slim', 'athletic', 'average', 'muscular', 'curvy', 'plus_size', 'prefer_not_to_say'));

-- Smoking - lifestyle habit that users may prefer to discuss later
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_smoking_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_smoking_check 
  CHECK (smoking IN ('no', 'occasionally', 'daily', 'trying_to_quit', 'prefer_not_to_say'));

-- Drinking - lifestyle habit that users may prefer to discuss later
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_drinking_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_drinking_check 
  CHECK (drinking IN ('never', 'social', 'moderate', 'regular', 'prefer_not_to_say'));

-- Exercise - lifestyle habit
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_exercise_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_exercise_check 
  CHECK (exercise IN ('never', 'sometimes', 'regularly', 'daily', 'prefer_not_to_say'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.gender IS 'User gender identity. "prefer_not_to_say" for privacy.';
COMMENT ON COLUMN profiles.body_type IS 'User body type. "prefer_not_to_say" for privacy.';
COMMENT ON COLUMN profiles.smoking IS 'Smoking habits. "prefer_not_to_say" for privacy.';
COMMENT ON COLUMN profiles.drinking IS 'Drinking habits. "prefer_not_to_say" for privacy.';
COMMENT ON COLUMN profiles.exercise IS 'Exercise habits. "prefer_not_to_say" for privacy.';
