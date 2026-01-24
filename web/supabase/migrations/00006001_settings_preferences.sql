-- Migration: Add notification and privacy preferences
-- Date: 2026-01-24
-- Description: Add JSONB columns for user preferences and privacy settings

-- Add notification preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "matches": true,
    "messages": true,
    "events": true,
    "likes": true
  }'::jsonb;

-- Add privacy settings to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  privacy_settings JSONB DEFAULT '{
    "showProfile": true,
    "showOnlineStatus": true,
    "showDistance": true,
    "showLastActive": true,
    "whoCanMessage": "everyone"
  }'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences ON users USING GIN (notification_preferences);
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_settings ON profiles USING GIN (privacy_settings);

-- Add comment for documentation
COMMENT ON COLUMN users.notification_preferences IS 'User notification preferences stored as JSONB';
COMMENT ON COLUMN profiles.privacy_settings IS 'User privacy settings stored as JSONB';
