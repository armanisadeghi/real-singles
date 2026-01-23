-- Migration: Storage Bucket RLS Policies
-- Description: Set up security policies for storage buckets (avatars, gallery, events)
-- 
-- Bucket configuration (set in Supabase Dashboard):
--   - avatars: public (profile pictures viewable by anyone)
--   - gallery: private (user photos require authentication to view)
--   - events: public (event images viewable by anyone)
--
-- Note: Buckets must be created in Supabase Dashboard before running these policies
-- The buckets have already been created by the user.

-- ===========================================
-- AVATARS BUCKET POLICIES (public bucket)
-- ===========================================

-- Allow authenticated users to upload their own avatar
-- Path format: {user_id}/avatar.{ext}
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ===========================================
-- GALLERY BUCKET POLICIES (private bucket)
-- ===========================================

-- Allow authenticated users to view any gallery images
-- This is needed for dating app functionality (viewing other profiles)
CREATE POLICY "Authenticated users can view gallery"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'gallery');

-- Allow users to upload to their own gallery folder
-- Path format: {user_id}/{filename}
CREATE POLICY "Users can upload to own gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own gallery items
CREATE POLICY "Users can update own gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'gallery' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own gallery items
CREATE POLICY "Users can delete own gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ===========================================
-- EVENTS BUCKET POLICIES (public bucket)
-- ===========================================

-- Allow admins to upload event images
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update event images
CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete event images
CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ===========================================
-- ADDITIONAL: Allow event creators to upload images
-- ===========================================

-- Event creators can upload images for their own events
-- Path format: {event_id}/{filename}
CREATE POLICY "Event creators can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = (storage.foldername(name))[1]::uuid
    AND created_by = auth.uid()
  )
);
