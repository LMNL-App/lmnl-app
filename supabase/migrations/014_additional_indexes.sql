-- Migration 014: Additional performance indexes
-- Optimizes common query patterns across the app

-- Composite index for interactions by type (speeds up like/comment count queries)
CREATE INDEX IF NOT EXISTS idx_interactions_post_type ON interactions(post_id, type);
CREATE INDEX IF NOT EXISTS idx_interactions_user_type ON interactions(user_id, type);

-- Index for unread notifications (speeds up notification badge count)
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Index for active sponsored posts date range
CREATE INDEX IF NOT EXISTS idx_sponsored_date_range ON sponsored_posts(start_date, end_date) WHERE is_active = TRUE;

-- Index for saved posts lookups
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id);

-- Index for follows count queries
CREATE INDEX IF NOT EXISTS idx_follows_created ON follows(created_at DESC);

-- Index for post filtering by non-sponsored
CREATE INDEX IF NOT EXISTS idx_posts_user_nonspon ON posts(user_id, created_at DESC) WHERE is_sponsored = FALSE;

-- Index for daily usage date lookups
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date);

-- Index for profile search (ilike queries)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_lower ON profiles(lower(full_name));

-- Index for blocked and muted user lookups
CREATE INDEX IF NOT EXISTS idx_blocked_composite ON blocked_users(user_id, blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_muted_composite ON muted_users(user_id, muted_user_id);
