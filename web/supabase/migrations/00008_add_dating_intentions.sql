-- Migration: Add dating_intentions field
-- This field is critical for serious-dater positioning (industry standard from The League, Hinge, Bumble)

-- Add dating_intentions column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dating_intentions TEXT;

-- Add CHECK constraint for valid values
ALTER TABLE profiles
ADD CONSTRAINT profiles_dating_intentions_check 
CHECK (dating_intentions IS NULL OR dating_intentions IN (
  'life_partner',
  'long_term',
  'long_term_open',
  'figuring_out',
  'prefer_not_to_say'
));

-- Create index for filtering by dating intentions
CREATE INDEX IF NOT EXISTS idx_profiles_dating_intentions ON profiles(dating_intentions);

-- Add comment for documentation
COMMENT ON COLUMN profiles.dating_intentions IS 'User relationship goals: life_partner, long_term, long_term_open, figuring_out, prefer_not_to_say';
