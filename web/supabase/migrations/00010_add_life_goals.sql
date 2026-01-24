-- Migration: Add Life Goals System (The League model)
-- Created: 2026-01-24
-- Description: Adds life_goals field to profiles and creates admin-manageable life_goal_definitions table

-- ============================================
-- LIFE GOAL DEFINITIONS TABLE (Admin-Managed)
-- ============================================

CREATE TABLE IF NOT EXISTS life_goal_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Optional icon name for UI
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active goals
CREATE INDEX IF NOT EXISTS idx_life_goal_definitions_active ON life_goal_definitions(is_active, category, display_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_life_goal_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_life_goal_definitions_updated_at
  BEFORE UPDATE ON life_goal_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_life_goal_definitions_updated_at();

-- ============================================
-- ADD LIFE GOALS TO PROFILES
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS life_goals TEXT[];

-- Create index for filtering by life goals
CREATE INDEX IF NOT EXISTS idx_profiles_life_goals ON profiles USING GIN(life_goals);

COMMENT ON COLUMN profiles.life_goals IS 'Array of life goal keys (from life_goal_definitions) selected by user - max 10';

-- ============================================
-- SEED INITIAL LIFE GOALS (The League model)
-- ============================================

INSERT INTO life_goal_definitions (key, label, category, description, display_order) VALUES
  -- Career & Achievement
  ('start_company', 'Start my own company', 'career', 'Build and run your own business', 1),
  ('executive_level', 'Get promoted to executive level', 'career', 'Reach C-suite or senior leadership', 2),
  ('write_book', 'Write a book', 'career', 'Author a published book', 3),
  ('graduate_degree', 'Get a graduate degree', 'career', 'Complete Masters, MBA, PhD, JD, or MD', 4),
  ('thought_leader', 'Become a thought leader', 'career', 'Be recognized as an expert in your field', 5),
  ('build_nonprofit', 'Build a nonprofit', 'career', 'Create an organization for social good', 6),
  ('patent_invention', 'Patent an invention', 'career', 'Create something new and protect it', 7),
  ('ted_talk', 'Give a TED talk', 'career', 'Share ideas on a global stage', 8),
  
  -- Adventure & Travel
  ('every_continent', 'Visit every continent', 'adventure', 'Travel to all 7 continents', 10),
  ('new_language', 'Learn a new language', 'adventure', 'Become fluent in another language', 11),
  ('climb_mountain', 'Climb a major mountain', 'adventure', 'Summit a famous peak', 12),
  ('run_marathon', 'Run a marathon', 'adventure', 'Complete a 26.2 mile race', 13),
  ('safari', 'Go on a safari', 'adventure', 'See wildlife in their natural habitat', 14),
  ('live_abroad', 'Live abroad for a year', 'adventure', 'Experience life in another country', 15),
  ('skydive', 'Go skydiving', 'adventure', 'Jump from a plane', 16),
  ('scuba_certification', 'Get scuba certified', 'adventure', 'Explore the underwater world', 17),
  ('road_trip', 'Epic cross-country road trip', 'adventure', 'Drive across the country', 18),
  
  -- Personal & Lifestyle
  ('buy_home', 'Buy a home', 'personal', 'Own your own place', 20),
  ('start_family', 'Start a family', 'personal', 'Have or adopt children', 21),
  ('financial_independence', 'Achieve financial independence', 'personal', 'Retire early or have passive income', 22),
  ('learn_cooking', 'Learn professional-level cooking', 'personal', 'Master culinary skills', 23),
  ('master_instrument', 'Master an instrument', 'personal', 'Play music at an advanced level', 24),
  ('dream_home', 'Build a dream home', 'personal', 'Design and construct your ideal house', 25),
  ('get_fit', 'Get in the best shape of my life', 'personal', 'Achieve peak fitness', 26),
  ('meditation_practice', 'Develop a meditation practice', 'personal', 'Build mindfulness into daily life', 27),
  ('learn_art', 'Learn to paint or draw', 'personal', 'Develop artistic skills', 28),
  
  -- Impact & Legacy
  ('mentor_others', 'Mentor the next generation', 'impact', 'Guide and support younger professionals', 30),
  ('volunteer_regularly', 'Volunteer regularly', 'impact', 'Give back to the community', 31),
  ('sustainability', 'Live more sustainably', 'impact', 'Reduce environmental footprint', 32),
  ('political_involvement', 'Get involved in politics', 'impact', 'Make a difference in government', 33),
  ('teach_class', 'Teach a class', 'impact', 'Share knowledge with others', 34)
  
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Life goal definitions are readable by all authenticated users
ALTER TABLE life_goal_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Life goal definitions are viewable by authenticated users"
  ON life_goal_definitions FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Life goal definitions are manageable by admins"
  ON life_goal_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- Grant usage
GRANT SELECT ON life_goal_definitions TO authenticated;
GRANT ALL ON life_goal_definitions TO service_role;
