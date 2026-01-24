-- Migration: Add Voice and Video Prompts
-- Created: 2026-01-24
-- Description: Adds voice_prompt_url and video_intro_url fields to profiles (Hinge/Raya model)

-- ============================================
-- ADD VOICE AND VIDEO PROMPT FIELDS TO PROFILES
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS voice_prompt_url TEXT,
ADD COLUMN IF NOT EXISTS video_intro_url TEXT,
ADD COLUMN IF NOT EXISTS voice_prompt_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS video_intro_duration_seconds INTEGER;

-- Add constraints for duration limits
-- Voice prompts: max 30 seconds (Hinge model)
-- Video intros: max 60 seconds
ALTER TABLE profiles
ADD CONSTRAINT check_voice_prompt_duration 
  CHECK (voice_prompt_duration_seconds IS NULL OR (voice_prompt_duration_seconds >= 1 AND voice_prompt_duration_seconds <= 30)),
ADD CONSTRAINT check_video_intro_duration 
  CHECK (video_intro_duration_seconds IS NULL OR (video_intro_duration_seconds >= 1 AND video_intro_duration_seconds <= 60));

COMMENT ON COLUMN profiles.voice_prompt_url IS 'URL to 30-second voice intro (Hinge model)';
COMMENT ON COLUMN profiles.video_intro_url IS 'URL to 30-60 second video intro';
COMMENT ON COLUMN profiles.voice_prompt_duration_seconds IS 'Duration of voice prompt in seconds (max 30)';
COMMENT ON COLUMN profiles.video_intro_duration_seconds IS 'Duration of video intro in seconds (max 60)';

-- ============================================
-- UPDATE STORAGE BUCKET POLICY FOR VOICE/VIDEO
-- ============================================

-- Note: Voice prompts and video intros should be stored in the 'gallery' bucket
-- with specific prefixes like 'voice/' and 'video_intro/' for organization
-- The existing gallery bucket policies should handle this

-- ============================================
-- INDEX FOR PROFILES WITH VOICE/VIDEO (Optional filtering)
-- ============================================

-- Index for finding profiles that have voice prompts
CREATE INDEX IF NOT EXISTS idx_profiles_has_voice_prompt 
  ON profiles((voice_prompt_url IS NOT NULL))
  WHERE voice_prompt_url IS NOT NULL;

-- Index for finding profiles that have video intros
CREATE INDEX IF NOT EXISTS idx_profiles_has_video_intro 
  ON profiles((video_intro_url IS NOT NULL))
  WHERE video_intro_url IS NOT NULL;
