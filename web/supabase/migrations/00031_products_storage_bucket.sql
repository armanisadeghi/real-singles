-- Migration: Products Storage Bucket
-- Description: Create storage bucket for product images (rewards shop)
-- 
-- Bucket configuration:
--   - products: public (product images viewable by anyone)
--
-- Only admins can upload/update/delete product images

-- ===========================================
-- CREATE PRODUCTS BUCKET
-- ===========================================

-- Create the products bucket (public for viewing product images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- PRODUCTS BUCKET POLICIES (public bucket)
-- ===========================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Allow admins to upload product images
-- Path format: products/{product_id}/{filename} or products/{timestamp}_{filename}
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update product images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
