-- LMNL App Storage Setup
-- Migration 003: Storage Buckets and Policies

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Note: Buckets need to be created via Supabase Dashboard or API
-- These policies assume buckets named 'avatars' and 'posts' exist

-- ============================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================

-- Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- STORAGE POLICIES FOR POSTS BUCKET
-- ============================================

-- Anyone can view post images
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Users can upload images for their posts
CREATE POLICY "Users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- INSTRUCTIONS FOR MANUAL SETUP
-- ============================================
/*
To complete storage setup in Supabase Dashboard:

1. Go to Storage in your Supabase project
2. Create bucket: 'avatars' (public)
3. Create bucket: 'posts' (public)

Or via Supabase CLI:
supabase storage create avatars --public
supabase storage create posts --public
*/
