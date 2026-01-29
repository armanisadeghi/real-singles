-- RealSingles Database Schema
-- Migration: 00020_add_can_start_matching
-- Description: Add computed can_start_matching boolean to profiles table with automatic triggers

-- ============================================
-- ADD COLUMN
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_start_matching BOOLEAN DEFAULT FALSE;

-- ============================================
-- FUNCTION TO CALCULATE CAN_START_MATCHING
-- ============================================

CREATE OR REPLACE FUNCTION calculate_can_start_matching(profile_record profiles)
RETURNS BOOLEAN AS $$
DECLARE
  min_photos_required INTEGER;
  photo_count INTEGER;
  has_minimum_photos BOOLEAN;
BEGIN
  -- Get minimum photos requirement from environment (default to 1)
  min_photos_required := COALESCE(current_setting('app.min_photos_required', true)::INTEGER, 1);
  
  -- Count photos for this user
  SELECT COUNT(*) INTO photo_count
  FROM user_gallery
  WHERE user_id = profile_record.user_id
    AND media_type = 'image';
  
  -- Check if photo requirement is met
  has_minimum_photos := (min_photos_required <= 0 OR photo_count >= min_photos_required);
  
  -- Check all required fields are filled AND photo requirement is met
  RETURN (
    profile_record.first_name IS NOT NULL AND profile_record.first_name != '' AND
    profile_record.date_of_birth IS NOT NULL AND
    profile_record.gender IS NOT NULL AND profile_record.gender != '' AND
    profile_record.looking_for IS NOT NULL AND array_length(profile_record.looking_for, 1) > 0 AND
    profile_record.profile_image_url IS NOT NULL AND profile_record.profile_image_url != '' AND
    has_minimum_photos
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGER FUNCTION FOR PROFILES TABLE
-- ============================================

CREATE OR REPLACE FUNCTION update_can_start_matching_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  NEW.can_start_matching = calculate_can_start_matching(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_can_start_matching_on_profile ON profiles;

-- Create trigger for profiles table (runs before INSERT or UPDATE)
CREATE TRIGGER trigger_update_can_start_matching_on_profile
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_can_start_matching_on_profile();

-- ============================================
-- TRIGGER FUNCTION FOR USER_GALLERY TABLE
-- ============================================

CREATE OR REPLACE FUNCTION update_can_start_matching_on_gallery_change()
RETURNS TRIGGER AS $$
DECLARE
  affected_user_id UUID;
  profile_record profiles;
  should_update BOOLEAN;
BEGIN
  -- Check if this is an image media type (only images count for matching)
  should_update := FALSE;
  
  IF (TG_OP = 'INSERT' AND NEW.media_type = 'image') THEN
    should_update := TRUE;
    affected_user_id := NEW.user_id;
  ELSIF (TG_OP = 'UPDATE' AND (NEW.media_type = 'image' OR OLD.media_type = 'image')) THEN
    should_update := TRUE;
    affected_user_id := NEW.user_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.media_type = 'image') THEN
    should_update := TRUE;
    affected_user_id := OLD.user_id;
  END IF;
  
  -- Only update if this affects image count
  IF should_update THEN
    -- Get the profile record
    SELECT * INTO profile_record
    FROM profiles
    WHERE user_id = affected_user_id;
    
    -- Update can_start_matching if profile exists
    IF FOUND THEN
      UPDATE profiles
      SET can_start_matching = calculate_can_start_matching(profile_record)
      WHERE user_id = affected_user_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_can_start_matching_on_gallery ON user_gallery;

-- Create trigger for user_gallery table (runs after INSERT, UPDATE, or DELETE)
CREATE TRIGGER trigger_update_can_start_matching_on_gallery
  AFTER INSERT OR UPDATE OR DELETE ON user_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_can_start_matching_on_gallery_change();

-- ============================================
-- BACKFILL EXISTING DATA
-- ============================================

-- Update all existing profiles with correct can_start_matching value
UPDATE profiles
SET can_start_matching = calculate_can_start_matching(profiles.*);

-- ============================================
-- ADD INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_can_start_matching ON profiles(can_start_matching);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN profiles.can_start_matching IS 'Computed boolean indicating if user has completed minimum requirements (required fields + minimum photos) to start matching. Automatically maintained by triggers.';
COMMENT ON FUNCTION calculate_can_start_matching IS 'Calculates if a profile meets minimum requirements for matching (first_name, date_of_birth, gender, looking_for, profile_image_url, minimum photos)';
