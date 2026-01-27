-- Add profile_hidden flag to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_hidden BOOLEAN DEFAULT FALSE;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_hidden 
ON profiles(profile_hidden) WHERE profile_hidden = FALSE;

-- Auto-set profile_hidden for existing admins/moderators
UPDATE profiles p
SET profile_hidden = TRUE
FROM users u
WHERE p.user_id = u.id 
AND u.role IN ('admin', 'moderator');

-- Comment for documentation
COMMENT ON COLUMN profiles.profile_hidden IS 
'When true, user is hidden from discovery, matches, and search. Used for admin accounts and user-initiated pausing.';
