-- Migration 011: Saved posts feature

-- ============================================
-- 1. SAVED_POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Indexes for saved posts lookups
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_created_at ON saved_posts(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saved posts viewable by owner"
  ON saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATE FEED FUNCTION TO INCLUDE SAVED STATUS
-- ============================================
DROP FUNCTION IF EXISTS get_feed_posts(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_feed_posts(p_user_id UUID, p_limit INTEGER DEFAULT 10)
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
  is_liked BOOLEAN,
  is_saved BOOLEAN
) AS $$
DECLARE
  current_viewed INTEGER;
  remaining_posts INTEGER;
BEGIN
  -- Get current posts viewed count
  SELECT COALESCE(du.posts_viewed, 0) INTO current_viewed
  FROM daily_usage du
  WHERE du.user_id = p_user_id AND du.date = CURRENT_DATE;

  -- Calculate how many more posts can be viewed (max 10 per day)
  remaining_posts := GREATEST(0, 10 - COALESCE(current_viewed, 0));

  -- If at limit, return empty
  IF remaining_posts <= 0 THEN
    RETURN;
  END IF;

  -- Limit the requested amount to remaining posts
  p_limit := LEAST(p_limit, remaining_posts);

  -- Return posts from followed users + own posts
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
    EXISTS(SELECT 1 FROM interactions i WHERE i.post_id = p.id AND i.user_id = p_user_id AND i.type = 'like') as is_liked,
    EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = p_user_id) as is_saved
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE p.is_sponsored = FALSE
    AND (
      p.user_id = p_user_id
      OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = p_user_id)
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit;

  -- Update posts viewed count
  UPDATE daily_usage
  SET posts_viewed = posts_viewed + p_limit, updated_at = NOW()
  WHERE daily_usage.user_id = p_user_id AND date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
