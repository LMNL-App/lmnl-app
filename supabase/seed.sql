-- LMNL App Seed Data
-- Sample sponsored posts for initial launch

-- ============================================
-- SAMPLE SPONSORED POSTS
-- ============================================

INSERT INTO sponsored_posts (
  title,
  content,
  image_url,
  sponsor_name,
  sponsor_link,
  cta_text,
  is_active,
  start_date,
  end_date
) VALUES
(
  'Mindful Tech',
  'Take control of your digital life with our wellness app. Join millions finding balance in a connected world.',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
  'Mindful Tech Co.',
  'https://example.com/mindful',
  'Try Free',
  true,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
),
(
  'Digital Detox Retreat',
  'Unplug and reconnect with nature. Weekend retreats designed for the digitally overwhelmed.',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Nature Escapes',
  'https://example.com/retreat',
  'Book Now',
  true,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '60 days'
),
(
  'Focus Journal',
  'The paper journal designed for the digital age. Track your goals without the distractions.',
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800',
  'Focus Studio',
  'https://example.com/journal',
  'Shop Now',
  true,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '45 days'
);
