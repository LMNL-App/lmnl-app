-- LMNL App Storage Buckets Creation
-- Migration 008: Create storage buckets programmatically

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create posts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- ENSURE POLICIES EXIST (idempotent)
-- ============================================

-- Drop and recreate policies to ensure they're correct
-- This handles cases where policies might have been created incorrectly

DO $$
BEGIN
  -- Avatars SELECT policy
  DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
  CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

  -- Avatars INSERT policy
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Avatars UPDATE policy
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Avatars DELETE policy
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
  CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Posts SELECT policy
  DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
  CREATE POLICY "Post images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'posts');

  -- Posts INSERT policy
  DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
  CREATE POLICY "Users can upload post images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'posts'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Posts DELETE policy
  DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
  CREATE POLICY "Users can delete their own post images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'posts'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
END $$;
