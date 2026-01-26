-- Migration 009: Exclude own posts from feed view limits
-- Ensure viewing your own posts does not count against daily feed limits.

-- ============================================
-- FUNCTION: Get Feed Posts (without incrementing)
-- ============================================
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
  is_liked BOOLEAN
) AS $$
DECLARE
  current_viewed INTEGER;
  remaining_posts INTEGER;
BEGIN
  -- Get count of non-self posts viewed today
  SELECT COUNT(*) INTO current_viewed
  FROM viewed_posts vp
  JOIN posts p ON p.id = vp.post_id
  WHERE vp.user_id = p_user_id
    AND vp.viewed_at = CURRENT_DATE
    AND p.user_id <> p_user_id;

  -- Calculate remaining (max 10 per day)
  remaining_posts := GREATEST(0, 10 - COALESCE(current_viewed, 0));

  -- If at limit, return empty
  IF remaining_posts <= 0 THEN
    RETURN;
  END IF;

  -- Limit the requested amount
  p_limit := LEAST(p_limit, remaining_posts);

  -- Return posts (excluding already viewed today)
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
  WHERE p.is_sponsored = FALSE
    AND (
      p.user_id = p_user_id
      OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = p_user_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM viewed_posts vp
      WHERE vp.post_id = p.id AND vp.user_id = p_user_id AND vp.viewed_at = CURRENT_DATE
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Mark Posts as Viewed (exclude self)
-- ============================================
CREATE OR REPLACE FUNCTION mark_posts_viewed(p_user_id UUID, p_post_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Insert viewed posts for non-self posts (ignore duplicates)
  WITH candidate_posts AS (
    SELECT p.id
    FROM posts p
    WHERE p.id = ANY(p_post_ids)
      AND p.user_id <> p_user_id
  ),
  inserted AS (
    INSERT INTO viewed_posts (user_id, post_id, viewed_at)
    SELECT p_user_id, id, CURRENT_DATE
    FROM candidate_posts
    ON CONFLICT (user_id, post_id, viewed_at) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;

  -- Update daily_usage count
  INSERT INTO daily_usage (user_id, date, posts_viewed)
  VALUES (p_user_id, CURRENT_DATE, inserted_count)
  ON CONFLICT (user_id, date) DO UPDATE
  SET posts_viewed = daily_usage.posts_viewed + inserted_count,
      updated_at = NOW();

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Remaining Feed Count (exclude self)
-- ============================================
CREATE OR REPLACE FUNCTION get_remaining_feed_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  viewed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO viewed_count
  FROM viewed_posts vp
  JOIN posts p ON p.id = vp.post_id
  WHERE vp.user_id = p_user_id
    AND vp.viewed_at = CURRENT_DATE
    AND p.user_id <> p_user_id;

  RETURN GREATEST(0, 10 - COALESCE(viewed_count, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

