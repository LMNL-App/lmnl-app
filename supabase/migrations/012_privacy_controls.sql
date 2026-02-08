-- Migration 012: Privacy controls
-- Adds support for private accounts, blocking, and muting

-- Add privacy columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id),
  CHECK (user_id != blocked_user_id)
);

-- Create muted_users table
CREATE TABLE IF NOT EXISTS muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  muted_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muted_user_id),
  CHECK (user_id != muted_user_id)
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_users ENABLE ROW LEVEL SECURITY;

-- Blocked users policies
CREATE POLICY "Users can view own blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can block others" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock others" ON blocked_users
  FOR DELETE USING (auth.uid() = user_id);

-- Muted users policies
CREATE POLICY "Users can view own mutes" ON muted_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mute others" ON muted_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmute others" ON muted_users
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_user_id ON muted_users(user_id);
