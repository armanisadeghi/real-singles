-- Fix Users RLS for Discovery
-- Migration: 00007_fix_users_rls_for_discovery
-- Description: Allow authenticated users to read basic user info needed for discovery
--
-- Problem: The profiles RLS policy checks users.status = 'active', but the users
-- table RLS only allowed reading your own record. This caused all profiles to be
-- invisible because the status check failed due to RLS.

-- Add policy to allow authenticated users to read basic user status for discovery
-- This enables the profiles RLS policy to properly check user status
CREATE POLICY "Authenticated users can read user status for discovery" ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always read their own full record
    auth.uid() = id
    OR
    -- Authenticated users can see basic info of active users (for discovery)
    status = 'active'
  );

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Note: The UPDATE policy remains unchanged - users can only update their own data
