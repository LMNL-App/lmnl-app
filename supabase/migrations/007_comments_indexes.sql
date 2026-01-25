-- Migration 007: Optimize comments and add missing indexes
-- Ensure proper indexing for comment queries

-- Index for fetching comments by post
CREATE INDEX IF NOT EXISTS idx_interactions_post_type ON interactions(post_id, type);

-- Index for fetching comments by user
CREATE INDEX IF NOT EXISTS idx_interactions_user_type ON interactions(user_id, type);

-- Index for fetching comments with created_at ordering
CREATE INDEX IF NOT EXISTS idx_interactions_post_type_created ON interactions(post_id, type, created_at);

-- Ensure RLS policy allows inserting comments
DROP POLICY IF EXISTS "Users can create interactions" ON interactions;
CREATE POLICY "Users can create interactions" ON interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
DROP POLICY IF EXISTS "Users can update own comments" ON interactions;
CREATE POLICY "Users can update own comments" ON interactions
  FOR UPDATE USING (auth.uid() = user_id AND type = 'comment');

-- ============================================
-- FUNCTION: Get post with comment count
-- ============================================
CREATE OR REPLACE FUNCTION get_post_with_stats(p_post_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  image_url TEXT,
  is_sponsored BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  likes_count BIGINT,
  comments_count BIGINT,
  is_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.is_sponsored,
    p.created_at,
    p.updated_at,
    pr.full_name,
    pr.username,
    pr.avatar_url,
    (SELECT COUNT(*) FROM interactions i WHERE i.post_id = p.id AND i.type = 'like') as likes_count,
    (SELECT COUNT(*) FROM interactions i WHERE i.post_id = p.id AND i.type = 'comment') as comments_count,
    EXISTS(SELECT 1 FROM interactions i WHERE i.post_id = p.id AND i.user_id = p_user_id AND i.type = 'like') as is_liked
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE p.id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_post_with_stats(UUID, UUID) TO authenticated;

-- ============================================
-- FUNCTION: Get comments for a post
-- ============================================
CREATE OR REPLACE FUNCTION get_post_comments(p_post_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  post_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.user_id,
    i.post_id,
    i.content,
    i.created_at,
    pr.username,
    pr.full_name,
    pr.avatar_url
  FROM interactions i
  JOIN profiles pr ON i.user_id = pr.id
  WHERE i.post_id = p_post_id AND i.type = 'comment'
  ORDER BY i.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_post_comments(UUID, INTEGER, INTEGER) TO authenticated;
