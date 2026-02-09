-- Migration 013: Notification preferences
-- Granular per-type notification settings

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_likes BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_comments BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_follows BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_mentions BOOLEAN DEFAULT TRUE;
