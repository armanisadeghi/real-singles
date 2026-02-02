-- Migration: Update Dating Intentions and Religion Options
-- Created: 2026-02-02
-- 
-- Dating Intentions Changes:
--   - Remove 'life_partner' (migrate to 'long_term')
--   - Add 'short_term_open' and 'short_term'
--   - Label change: 'figuring_out' -> "Still figuring it out"
--
-- Religion Changes:
--   - Remove: 'catholic', 'christian', 'lds', 'protestant'
--   - Add: 'christian_catholic', 'christian_lds', 'christian_protestant', 'christian_orthodox', 'prefer_not_to_say'
--   - Migrate existing data to new values

-- ============================================
-- DATING INTENTIONS UPDATES
-- ============================================

-- 1. Migrate 'life_partner' to 'long_term' before dropping constraint
UPDATE profiles 
SET dating_intentions = 'long_term' 
WHERE dating_intentions = 'life_partner';

-- 2. Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_dating_intentions_check;

-- 3. Add new constraint with updated values
ALTER TABLE profiles ADD CONSTRAINT profiles_dating_intentions_check 
  CHECK (dating_intentions IS NULL OR dating_intentions IN (
    'long_term', 
    'long_term_open', 
    'short_term_open', 
    'short_term', 
    'figuring_out'
  ));

-- ============================================
-- RELIGION UPDATES
-- ============================================
-- Note: religion has no CHECK constraint, only data migration needed

-- 4. Migrate 'catholic' to 'christian_catholic'
UPDATE profiles 
SET religion = 'christian_catholic' 
WHERE religion = 'catholic';

-- 5. Migrate 'christian' and 'protestant' to 'christian_protestant'
UPDATE profiles 
SET religion = 'christian_protestant' 
WHERE religion IN ('christian', 'protestant');

-- 6. Migrate 'lds' to 'christian_lds'
UPDATE profiles 
SET religion = 'christian_lds' 
WHERE religion = 'lds';

-- ============================================
-- USER_FILTERS TABLE - RELIGION ARRAY
-- ============================================
-- The user_filters table has a 'religions' TEXT[] column for filter preferences
-- We need to update any existing filter arrays to use new values

-- 7. Update filter arrays: catholic -> christian_catholic
UPDATE user_filters 
SET religions = array_replace(religions, 'catholic', 'christian_catholic')
WHERE religions @> ARRAY['catholic'];

-- 8. Update filter arrays: christian -> christian_protestant
UPDATE user_filters 
SET religions = array_replace(religions, 'christian', 'christian_protestant')
WHERE religions @> ARRAY['christian'];

-- 9. Update filter arrays: protestant -> christian_protestant (avoid duplicates)
UPDATE user_filters 
SET religions = array_remove(religions, 'protestant')
WHERE religions @> ARRAY['protestant'] AND religions @> ARRAY['christian_protestant'];

UPDATE user_filters 
SET religions = array_replace(religions, 'protestant', 'christian_protestant')
WHERE religions @> ARRAY['protestant'];

-- 10. Update filter arrays: lds -> christian_lds
UPDATE user_filters 
SET religions = array_replace(religions, 'lds', 'christian_lds')
WHERE religions @> ARRAY['lds'];
