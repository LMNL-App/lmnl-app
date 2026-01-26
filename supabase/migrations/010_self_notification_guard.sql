-- Migration 010: Prevent self-notifications for interactions and follows

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
    -- Don't notify yourself
    IF NEW.following_id != NEW.follower_id THEN
      INSERT INTO notifications (user_id, actor_id, type)
      VALUES (NEW.following_id, NEW.follower_id, 'follow');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

