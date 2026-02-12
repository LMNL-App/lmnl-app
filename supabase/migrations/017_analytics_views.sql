-- Migration 017: Analytics helper views
-- Provides weekly usage aggregation for the analytics dashboard

CREATE OR REPLACE FUNCTION get_weekly_usage(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  date TEXT,
  posts_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  posts_viewed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    du.date::TEXT,
    du.posts_count,
    du.likes_count,
    du.comments_count,
    du.posts_viewed
  FROM daily_usage du
  WHERE du.user_id = p_user_id
    AND du.date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)::DATE
  ORDER BY du.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_analytics_summary(p_user_id UUID)
RETURNS TABLE (
  total_posts BIGINT,
  total_likes_given BIGINT,
  total_comments BIGINT,
  total_posts_viewed BIGINT,
  days_active BIGINT,
  avg_posts_per_day NUMERIC,
  avg_likes_per_day NUMERIC,
  avg_comments_per_day NUMERIC,
  most_active_day TEXT,
  account_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(du.posts_count), 0)::BIGINT AS total_posts,
    COALESCE(SUM(du.likes_count), 0)::BIGINT AS total_likes_given,
    COALESCE(SUM(du.comments_count), 0)::BIGINT AS total_comments,
    COALESCE(SUM(du.posts_viewed), 0)::BIGINT AS total_posts_viewed,
    COUNT(DISTINCT du.date)::BIGINT AS days_active,
    ROUND(COALESCE(AVG(du.posts_count), 0), 1) AS avg_posts_per_day,
    ROUND(COALESCE(AVG(du.likes_count), 0), 1) AS avg_likes_per_day,
    ROUND(COALESCE(AVG(du.comments_count), 0), 1) AS avg_comments_per_day,
    (SELECT TO_CHAR(d.date, 'Day')
     FROM daily_usage d
     WHERE d.user_id = p_user_id
     GROUP BY TO_CHAR(d.date, 'Day'), EXTRACT(DOW FROM d.date)
     ORDER BY SUM(d.posts_count + d.likes_count + d.comments_count) DESC
     LIMIT 1
    ) AS most_active_day,
    p.created_at AS account_created_at
  FROM profiles p
  LEFT JOIN daily_usage du ON du.user_id = p.id
  WHERE p.id = p_user_id
  GROUP BY p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
