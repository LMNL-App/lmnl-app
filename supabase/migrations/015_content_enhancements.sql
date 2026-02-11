-- Migration 015: Content enhancements
-- Adds support for hashtags, post editing, and drafts

-- Hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post-hashtag relationship
CREATE TABLE IF NOT EXISTS post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(post_id, hashtag_id)
);

-- Drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add edited flag to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Hashtags are readable by everyone
CREATE POLICY "Hashtags are viewable by everyone" ON hashtags
  FOR SELECT USING (true);

CREATE POLICY "System can manage hashtags" ON hashtags
  FOR ALL USING (true);

-- Post hashtags
CREATE POLICY "Post hashtags are viewable by everyone" ON post_hashtags
  FOR SELECT USING (true);

CREATE POLICY "Users can tag own posts" ON post_hashtags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
  );

-- Drafts
CREATE POLICY "Users can view own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id, updated_at DESC);

-- Function to extract and link hashtags from post content
CREATE OR REPLACE FUNCTION process_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  tag TEXT;
  tag_id UUID;
BEGIN
  IF NEW.content IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extract hashtags from content
  FOR tag IN
    SELECT DISTINCT lower(regexp_replace(m[1], '^#', ''))
    FROM regexp_matches(NEW.content, '#([a-zA-Z0-9_]+)', 'g') AS m
  LOOP
    -- Insert or get hashtag
    INSERT INTO hashtags (name)
    VALUES (tag)
    ON CONFLICT (name) DO UPDATE SET posts_count = hashtags.posts_count + 1
    RETURNING id INTO tag_id;

    -- Link post to hashtag
    INSERT INTO post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to process hashtags on post creation
DROP TRIGGER IF EXISTS trigger_process_hashtags ON posts;
CREATE TRIGGER trigger_process_hashtags
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION process_post_hashtags();
