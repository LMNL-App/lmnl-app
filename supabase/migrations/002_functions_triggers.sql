-- LMNL App Database Functions & Triggers
-- Migration 002: Business Logic Enforcement

-- ============================================
-- FUNCTION: Get or Create Daily Usage Record
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_daily_usage(p_user_id UUID)
RETURNS daily_usage AS $$
DECLARE
  usage_record daily_usage;
BEGIN
  -- Try to get existing record
  SELECT * INTO usage_record
  FROM daily_usage
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  -- If not found, create one
  IF NOT FOUND THEN
    INSERT INTO daily_usage (user_id, date)
    VALUES (p_user_id, CURRENT_DATE)
    RETURNING * INTO usage_record;
  END IF;

  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check and Enforce Daily Limits
-- ============================================
CREATE OR REPLACE FUNCTION check_daily_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
  user_verified BOOLEAN;
  user_role TEXT;
BEGIN
  -- Get user info
  SELECT is_verified, role INTO user_verified, user_role
  FROM profiles WHERE id = NEW.user_id;

  -- Ensure daily usage record exists
  PERFORM get_or_create_daily_usage(NEW.user_id);

  -- Handle different table types
  IF TG_TABLE_NAME = 'posts' THEN
    -- Skip limit check for sponsored posts
    IF NEW.is_sponsored = TRUE THEN
      RETURN NEW;
    END IF;

    SELECT posts_count INTO current_count
    FROM daily_usage
    WHERE user_id = NEW.user_id AND date = CURRENT_DATE;

    -- Educational verified accounts get 2 posts, others get 5
    IF user_role = 'educational_institute' AND user_verified THEN
      max_limit := 2;
    ELSE
      max_limit := 5;
    END IF;

    IF current_count >= max_limit THEN
      RAISE EXCEPTION 'LIMIT_REACHED:posts:Daily post limit reached (% of % posts)', current_count, max_limit;
    END IF;

    -- Increment counter
    UPDATE daily_usage
    SET posts_count = posts_count + 1, updated_at = NOW()
    WHERE user_id = NEW.user_id AND date = CURRENT_DATE;

  ELSIF TG_TABLE_NAME = 'interactions' THEN
    IF NEW.type = 'like' THEN
      SELECT likes_count INTO current_count
      FROM daily_usage
      WHERE user_id = NEW.user_id AND date = CURRENT_DATE;

      max_limit := 5;

      IF current_count >= max_limit THEN
        RAISE EXCEPTION 'LIMIT_REACHED:likes:Daily like limit reached (% of % likes)', current_count, max_limit;
      END IF;

      UPDATE daily_usage
      SET likes_count = likes_count + 1, updated_at = NOW()
      WHERE user_id = NEW.user_id AND date = CURRENT_DATE;

    ELSIF NEW.type = 'comment' THEN
      SELECT comments_count INTO current_count
      FROM daily_usage
      WHERE user_id = NEW.user_id AND date = CURRENT_DATE;

      max_limit := 5;

      IF current_count >= max_limit THEN
        RAISE EXCEPTION 'LIMIT_REACHED:comments:Daily comment limit reached (% of % comments)', current_count, max_limit;
      END IF;

      UPDATE daily_usage
      SET comments_count = comments_count + 1, updated_at = NOW()
      WHERE user_id = NEW.user_id AND date = CURRENT_DATE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Decrement Usage on Delete
-- ============================================
CREATE OR REPLACE FUNCTION decrement_usage_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    -- Only decrement for non-sponsored posts deleted today
    IF OLD.is_sponsored = FALSE AND OLD.created_at::DATE = CURRENT_DATE THEN
      UPDATE daily_usage
      SET posts_count = GREATEST(0, posts_count - 1), updated_at = NOW()
      WHERE user_id = OLD.user_id AND date = CURRENT_DATE;
    END IF;

  ELSIF TG_TABLE_NAME = 'interactions' THEN
    -- Only decrement for interactions created today
    IF OLD.created_at::DATE = CURRENT_DATE THEN
      IF OLD.type = 'like' THEN
        UPDATE daily_usage
        SET likes_count = GREATEST(0, likes_count - 1), updated_at = NOW()
        WHERE user_id = OLD.user_id AND date = CURRENT_DATE;
      ELSIF OLD.type = 'comment' THEN
        UPDATE daily_usage
        SET comments_count = GREATEST(0, comments_count - 1), updated_at = NOW()
        WHERE user_id = OLD.user_id AND date = CURRENT_DATE;
      END IF;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Create Notification
-- ============================================
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'interactions' THEN
    -- Get post owner
    SELECT user_id INTO post_owner_id
    FROM posts WHERE id = NEW.post_id;

    -- Don't notify yourself
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, post_id, content)
      VALUES (
        post_owner_id,
        NEW.user_id,
        NEW.type,
        NEW.post_id,
        CASE WHEN NEW.type = 'comment' THEN NEW.content ELSE NULL END
      );
    END IF;

  ELSIF TG_TABLE_NAME = 'follows' THEN
    INSERT INTO notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Handle New User Signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from metadata or generate from email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );

  -- Clean username (alphanumeric and underscores only)
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');

  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user_' || SUBSTR(NEW.id::TEXT, 1, 8);
  END IF;

  -- Find unique username
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  -- Create profile
  INSERT INTO profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    final_username
  );

  -- Create initial daily usage record
  INSERT INTO daily_usage (user_id, date)
  VALUES (NEW.id, CURRENT_DATE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Increment Sponsored Post Impression
-- ============================================
CREATE OR REPLACE FUNCTION increment_ad_impression(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sponsored_posts
  SET impressions = impressions + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Increment Sponsored Post Click
-- ============================================
CREATE OR REPLACE FUNCTION increment_ad_click(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sponsored_posts
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Feed Posts (with limit enforcement)
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
    EXISTS(SELECT 1 FROM interactions i WHERE i.post_id = p.id AND i.user_id = p_user_id AND i.type = 'like') as is_liked
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

-- ============================================
-- FUNCTION: Get Active Sponsored Post
-- ============================================
CREATE OR REPLACE FUNCTION get_sponsored_post()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  sponsor_name TEXT,
  sponsor_link TEXT,
  cta_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.title,
    sp.content,
    sp.image_url,
    sp.sponsor_name,
    sp.sponsor_link,
    sp.cta_text
  FROM sponsored_posts sp
  WHERE sp.is_active = TRUE
    AND CURRENT_DATE BETWEEN sp.start_date AND sp.end_date
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Trigger for enforcing post limits
DROP TRIGGER IF EXISTS enforce_post_limit ON posts;
CREATE TRIGGER enforce_post_limit
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_limit();

-- Trigger for enforcing interaction limits
DROP TRIGGER IF EXISTS enforce_interaction_limit ON interactions;
CREATE TRIGGER enforce_interaction_limit
  BEFORE INSERT ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_limit();

-- Trigger for decrementing on post delete
DROP TRIGGER IF EXISTS decrement_post_usage ON posts;
CREATE TRIGGER decrement_post_usage
  AFTER DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_usage_on_delete();

-- Trigger for decrementing on interaction delete
DROP TRIGGER IF EXISTS decrement_interaction_usage ON interactions;
CREATE TRIGGER decrement_interaction_usage
  AFTER DELETE ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION decrement_usage_on_delete();

-- Trigger for creating notifications on interactions
DROP TRIGGER IF EXISTS on_interaction_notify ON interactions;
CREATE TRIGGER on_interaction_notify
  AFTER INSERT ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION create_notification();

-- Trigger for creating notifications on follows
DROP TRIGGER IF EXISTS on_follow_notify ON follows;
CREATE TRIGGER on_follow_notify
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_notification();

-- Trigger for auto-creating profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View for user stats
CREATE OR REPLACE VIEW user_stats AS
SELECT
  p.id as user_id,
  (SELECT COUNT(*) FROM posts WHERE user_id = p.id AND is_sponsored = FALSE) as posts_count,
  (SELECT COUNT(*) FROM follows WHERE following_id = p.id) as followers_count,
  (SELECT COUNT(*) FROM follows WHERE follower_id = p.id) as following_count
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON user_stats TO authenticated;
