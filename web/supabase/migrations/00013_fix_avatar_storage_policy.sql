-- Migration: Fix Avatar Storage and Gallery RLS Policies
-- Created: 2026-01-24
-- Description: Adds missing SELECT policy for avatars bucket and block check for gallery
-- Note: All operations are idempotent (safe to run multiple times)

-- ===========================================
-- FIX: Add SELECT policy for avatars bucket
-- ===========================================
-- The avatars bucket was missing a SELECT policy, which prevented
-- users from viewing other users' profile pictures even though
-- the bucket is configured as public in the Dashboard.

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Allow anyone (including anonymous) to view avatars
-- This is needed because profile pictures should be publicly viewable
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ===========================================
-- FIX: Add SELECT policy for events bucket
-- ===========================================
-- Events should also be publicly viewable

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;

CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- ===========================================
-- FIX: Add block check to user_gallery SELECT policy
-- ===========================================
-- Drop the existing policy and recreate with block check
-- This ensures blocked users cannot see each other's gallery items

DROP POLICY IF EXISTS "Users can read galleries" ON user_gallery;

CREATE POLICY "Users can read galleries" ON user_gallery
  FOR SELECT USING (
    -- Gallery owner must be active
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_gallery.user_id 
      AND users.status = 'active'
    )
    -- No mutual blocks between viewer and gallery owner
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocks.blocker_id = auth.uid() AND blocks.blocked_id = user_gallery.user_id)
         OR (blocks.blocker_id = user_gallery.user_id AND blocks.blocked_id = auth.uid())
    )
  );
