-- Migration: Profile Field Updates
-- Description: Add hometown field, update CHECK constraints, migrate data values
-- 
-- Changes:
-- 1. Add hometown TEXT column
-- 2. Update smoking: 'no' -> 'never', remove prefer_not_to_say
-- 3. Update marijuana: 'no' -> 'never', remove prefer_not_to_say
-- 4. Update marital_status: remove prefer_not_to_say
-- 5. Update body_type: remove prefer_not_to_say
-- 6. Update exercise: remove prefer_not_to_say
-- 7. Update has_kids: add 'yes_shared', remove prefer_not_to_say
-- 8. Update wants_kids: restructure to no/no_ok_if_partner_has/yes/not_sure

-- ============================================
-- STEP 1: Add hometown column
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hometown TEXT;

-- ============================================
-- STEP 2: DROP all CHECK constraints FIRST
-- (This allows data migration to work regardless of current values)
-- ============================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_smoking_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_marijuana_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_marital_status_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_body_type_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_exercise_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_has_kids_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_wants_kids_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_drinking_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_dating_intentions_check;

-- ============================================
-- STEP 3: Data migrations (now safe without constraints)
-- ============================================

-- Smoking: 'no' -> 'never'
UPDATE profiles SET smoking = 'never' WHERE smoking = 'no';

-- Marijuana: 'no' -> 'never'
UPDATE profiles SET marijuana = 'never' WHERE marijuana = 'no';

-- wants_kids restructure:
-- 'definitely' -> 'yes'
-- 'someday' -> 'yes'
-- 'ok_if_partner_has' -> 'no_ok_if_partner_has'
-- 'prefer_not_to_say' -> NULL
UPDATE profiles SET wants_kids = 'yes' WHERE wants_kids IN ('definitely', 'someday');
UPDATE profiles SET wants_kids = 'no_ok_if_partner_has' WHERE wants_kids = 'ok_if_partner_has';
UPDATE profiles SET wants_kids = NULL WHERE wants_kids = 'prefer_not_to_say';

-- Clear prefer_not_to_say values for all constrained fields (set to NULL)
UPDATE profiles SET marital_status = NULL WHERE marital_status = 'prefer_not_to_say';
UPDATE profiles SET body_type = NULL WHERE body_type = 'prefer_not_to_say';
UPDATE profiles SET exercise = NULL WHERE exercise = 'prefer_not_to_say';
UPDATE profiles SET smoking = NULL WHERE smoking = 'prefer_not_to_say';
UPDATE profiles SET marijuana = NULL WHERE marijuana = 'prefer_not_to_say';
UPDATE profiles SET has_kids = NULL WHERE has_kids = 'prefer_not_to_say';
UPDATE profiles SET drinking = NULL WHERE drinking = 'prefer_not_to_say';
UPDATE profiles SET dating_intentions = NULL WHERE dating_intentions = 'prefer_not_to_say';

-- ============================================
-- STEP 4: Add new CHECK constraints with updated values
-- ============================================

-- Smoking: 'never' replaces 'no', no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_smoking_check 
  CHECK (smoking IS NULL OR smoking IN ('never', 'occasionally', 'daily', 'trying_to_quit'));

-- Marijuana: 'never' replaces 'no', no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_marijuana_check 
  CHECK (marijuana IS NULL OR marijuana IN ('never', 'yes', 'occasionally'));

-- Marital status: no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_marital_status_check 
  CHECK (marital_status IS NULL OR marital_status IN ('never_married', 'separated', 'divorced', 'widowed'));

-- Body type: no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_body_type_check 
  CHECK (body_type IS NULL OR body_type IN ('slim', 'athletic', 'average', 'muscular', 'curvy', 'plus_size'));

-- Exercise: no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_exercise_check 
  CHECK (exercise IS NULL OR exercise IN ('never', 'sometimes', 'regularly', 'daily'));

-- Has kids: added 'yes_shared', no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_has_kids_check 
  CHECK (has_kids IS NULL OR has_kids IN ('no', 'yes_live_at_home', 'yes_live_away', 'yes_shared'));

-- Wants kids: completely restructured
ALTER TABLE profiles ADD CONSTRAINT profiles_wants_kids_check 
  CHECK (wants_kids IS NULL OR wants_kids IN ('no', 'no_ok_if_partner_has', 'yes', 'not_sure'));

-- Drinking: no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_drinking_check 
  CHECK (drinking IS NULL OR drinking IN ('never', 'social', 'moderate', 'regular'));

-- Dating intentions: no prefer_not_to_say
ALTER TABLE profiles ADD CONSTRAINT profiles_dating_intentions_check 
  CHECK (dating_intentions IS NULL OR dating_intentions IN ('life_partner', 'long_term', 'long_term_open', 'figuring_out'));

-- ============================================
-- Note: The following fields have NO database CHECK constraints
-- (they are TEXT fields validated at application layer only):
-- - education
-- - religion
-- - political_views
-- - pets (TEXT[])
-- 
-- These will be updated in the TypeScript types and constants only.
-- ============================================
