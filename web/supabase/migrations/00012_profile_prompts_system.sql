-- Migration: Profile Prompts System with Admin Control
-- Created: 2026-01-24
-- Description: Creates admin-manageable prompt definitions and user response tables
-- This allows adding/editing prompts via admin interface without code changes

-- ============================================
-- PROMPT DEFINITIONS TABLE (Admin-Managed)
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  prompt_text TEXT NOT NULL,
  placeholder_text TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  max_length INTEGER DEFAULT 200,
  is_active BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  icon TEXT, -- Optional icon name for UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompt_definitions_active ON prompt_definitions(is_active, category, display_order);
CREATE INDEX IF NOT EXISTS idx_prompt_definitions_key ON prompt_definitions(key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_prompt_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prompt_definitions_updated_at
  BEFORE UPDATE ON prompt_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_definitions_updated_at();

-- ============================================
-- USER PROFILE PROMPTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_profile_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_key TEXT NOT NULL,
  response TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_prompts_user ON user_profile_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_prompts_key ON user_profile_prompts(prompt_key);

-- Add updated_at trigger
CREATE TRIGGER trigger_user_profile_prompts_updated_at
  BEFORE UPDATE ON user_profile_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_definitions_updated_at();

-- ============================================
-- SEED INITIAL PROMPTS (Based on competitor analysis)
-- ============================================

INSERT INTO prompt_definitions (key, prompt_text, placeholder_text, category, max_length, display_order, is_required) VALUES
  -- About Me (first 3 shown by default)
  ('ideal_first_date', 'My ideal first date', 'Describe your perfect first date...', 'about_me', 200, 1, FALSE),
  ('non_negotiables', 'My non-negotiables in a partner', 'What are your must-haves?', 'about_me', 200, 2, FALSE),
  ('way_to_heart', 'The way to my heart', 'What makes you fall for someone?', 'about_me', 200, 3, FALSE),
  
  -- Conversation Starters
  ('known_for', 'I''m known for', 'What do friends say about you?', 'conversation', 200, 10, FALSE),
  ('geek_out', 'I geek out on', 'What are you passionate about?', 'conversation', 200, 11, FALSE),
  ('wont_shut_up', 'I won''t shut up about', 'What topic could you talk about forever?', 'conversation', 200, 12, FALSE),
  ('controversial_opinion', 'My controversial opinion', 'What''s an unpopular take you have?', 'conversation', 200, 13, FALSE),
  
  -- Life & Experiences
  ('craziest_travel_story', 'My craziest travel story', 'Share an adventure...', 'experiences', 200, 20, FALSE),
  ('spontaneous_thing', 'Most spontaneous thing I''ve done', 'What''s your wildest impulse decision?', 'experiences', 200, 21, FALSE),
  ('biggest_risk', 'Biggest risk I''ve taken', 'What leap of faith changed your life?', 'experiences', 200, 22, FALSE),
  ('happy_place', 'My happy place', 'Where do you feel most at peace?', 'experiences', 200, 23, FALSE),
  
  -- Work & Career
  ('worst_job', 'Worst job I ever had', 'What job taught you the most?', 'work', 200, 30, FALSE),
  ('dream_job', 'My dream job would be', 'If you could do anything...', 'work', 200, 31, FALSE),
  ('after_work', 'After work you can find me', 'How do you unwind?', 'work', 200, 32, FALSE),
  
  -- Fun & Quirky
  ('weirdest_gift', 'Weirdest gift I''ve ever received', 'What made you laugh or cringe?', 'fun', 200, 40, FALSE),
  ('pet_peeves', 'My pet peeves', 'What grinds your gears?', 'fun', 200, 41, FALSE),
  ('nightclub_or_home', 'Friday night: out or staying in?', 'Are you a party person or homebody?', 'fun', 200, 42, FALSE),
  ('past_event', 'If I could attend any event in history', 'Past, present, or future - where would you go?', 'fun', 200, 43, FALSE),
  
  -- Looking For
  ('love_language', 'My love language is', 'How do you give and receive love?', 'looking_for', 200, 50, FALSE),
  ('green_flags', 'Green flags I look for', 'What makes someone attractive to you?', 'looking_for', 200, 51, FALSE),
  ('ill_fall_for_you', 'I''ll fall for you if', 'What makes you swoon?', 'looking_for', 200, 52, FALSE),
  ('feel_supported', 'I feel most supported when', 'How can a partner be there for you?', 'looking_for', 200, 53, FALSE)
  
ON CONFLICT (key) DO UPDATE SET
  prompt_text = EXCLUDED.prompt_text,
  placeholder_text = EXCLUDED.placeholder_text,
  category = EXCLUDED.category,
  max_length = EXCLUDED.max_length,
  display_order = EXCLUDED.display_order;

-- ============================================
-- MIGRATE EXISTING PROMPTS FROM PROFILES TABLE
-- ============================================

-- This migrates data from the legacy prompt columns in profiles table
-- to the new user_profile_prompts table (one-time migration)

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'ideal_first_date',
  p.ideal_first_date,
  1
FROM profiles p
WHERE p.ideal_first_date IS NOT NULL AND p.ideal_first_date != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'non_negotiables',
  p.non_negotiables,
  2
FROM profiles p
WHERE p.non_negotiables IS NOT NULL AND p.non_negotiables != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'way_to_heart',
  p.way_to_heart,
  3
FROM profiles p
WHERE p.way_to_heart IS NOT NULL AND p.way_to_heart != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'worst_job',
  p.worst_job,
  30
FROM profiles p
WHERE p.worst_job IS NOT NULL AND p.worst_job != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'dream_job',
  p.dream_job,
  31
FROM profiles p
WHERE p.dream_job IS NOT NULL AND p.dream_job != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'after_work',
  p.after_work,
  32
FROM profiles p
WHERE p.after_work IS NOT NULL AND p.after_work != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'craziest_travel_story',
  p.craziest_travel_story,
  20
FROM profiles p
WHERE p.craziest_travel_story IS NOT NULL AND p.craziest_travel_story != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'weirdest_gift',
  p.weirdest_gift,
  40
FROM profiles p
WHERE p.weirdest_gift IS NOT NULL AND p.weirdest_gift != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'pet_peeves',
  p.pet_peeves,
  41
FROM profiles p
WHERE p.pet_peeves IS NOT NULL AND p.pet_peeves != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'nightclub_or_home',
  p.nightclub_or_home,
  42
FROM profiles p
WHERE p.nightclub_or_home IS NOT NULL AND p.nightclub_or_home != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

INSERT INTO user_profile_prompts (user_id, prompt_key, response, display_order)
SELECT 
  p.user_id,
  'past_event',
  p.past_event,
  43
FROM profiles p
WHERE p.past_event IS NOT NULL AND p.past_event != ''
ON CONFLICT (user_id, prompt_key) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Prompt definitions are readable by all authenticated users
ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt definitions are viewable by authenticated users"
  ON prompt_definitions FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Prompt definitions are manageable by admins"
  ON prompt_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- User profile prompts - users can manage their own
ALTER TABLE user_profile_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile prompts"
  ON user_profile_prompts FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can insert their own prompts"
  ON user_profile_prompts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prompts"
  ON user_profile_prompts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own prompts"
  ON user_profile_prompts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Grant usage
GRANT SELECT ON prompt_definitions TO authenticated;
GRANT ALL ON prompt_definitions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profile_prompts TO authenticated;
GRANT ALL ON user_profile_prompts TO service_role;

-- ============================================
-- NOTE: Legacy columns in profiles table are kept for backward compatibility
-- They can be removed in a future migration after all clients are updated
-- ============================================
