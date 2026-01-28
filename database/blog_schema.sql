-- The Hub Blog Platform + AI Features Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- BLOG TABLES
-- ============================================

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  hero_image_url TEXT,
  thumbnail_url TEXT,

  -- SEO Fields
  meta_title VARCHAR(300),
  meta_description VARCHAR(500),
  keywords TEXT[],

  -- Categorization
  category VARCHAR(50) NOT NULL CHECK (category IN ('watches', 'cars', 'sneakers', 'sports', 'general')),
  tags TEXT[],

  -- Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,

  -- Author Info
  author_id UUID,
  author_name VARCHAR(100),
  author_avatar_url TEXT,

  -- Metadata
  read_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- AI Generation Info
  ai_generated BOOLEAN DEFAULT false,
  ai_model VARCHAR(50),
  ai_prompt TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
  ) STORED
);

-- Indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Blog Post Views (Analytics)
CREATE TABLE IF NOT EXISTS blog_post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45),
  viewer_country VARCHAR(2),
  referrer TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_views_post ON blog_post_views(post_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_views_viewed_at ON blog_post_views(viewed_at DESC);

-- Email Subscribers
CREATE TABLE IF NOT EXISTS blog_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  source VARCHAR(50),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT false,
  confirmation_token VARCHAR(100),
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirmed ON blog_subscribers(confirmed);

-- Related Posts (many-to-many)
CREATE TABLE IF NOT EXISTS blog_post_relations (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 1.0,
  PRIMARY KEY (post_id, related_post_id)
);

-- Blog Categories Metadata
CREATE TABLE IF NOT EXISTS blog_categories (
  slug VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  icon VARCHAR(50),
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO blog_categories (slug, name, description, color, icon) VALUES
  ('watches', 'Watches', 'Luxury watch market insights and price tracking', '#D4AF37', 'Watch'),
  ('cars', 'Cars', 'Exotic car market trends and valuations', '#FF8C42', 'Car'),
  ('sneakers', 'Sneakers', 'Sneaker resale market analysis and trends', '#00D4FF', 'Shirt'),
  ('sports', 'Sports', 'Sports betting insights and team analytics', '#10B981', 'Trophy'),
  ('general', 'General', 'Market insights and investment strategies', '#8B5CF6', 'Lightbulb')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- AI FEATURES - DEAL SCORING
-- ============================================

-- Add deal scoring columns to watch_listings table
ALTER TABLE watch_listings
  ADD COLUMN IF NOT EXISTS deal_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB;

CREATE INDEX IF NOT EXISTS idx_watch_listings_deal_score ON watch_listings(deal_score DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on blog tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT
  USING (status = 'published' AND (published_at IS NULL OR published_at <= NOW()));

-- Authenticated users can manage all posts (admin)
CREATE POLICY "Authenticated users can manage posts" ON blog_posts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe" ON blog_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view subscribers
CREATE POLICY "Authenticated users can view subscribers" ON blog_subscribers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Anyone can create view records
CREATE POLICY "Anyone can track views" ON blog_post_views
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view analytics
CREATE POLICY "Authenticated users can view analytics" ON blog_post_views
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update blog post updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_updated_at();

-- Function to update category post counts
CREATE OR REPLACE FUNCTION update_blog_category_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for new category
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE blog_categories
    SET post_count = (
      SELECT COUNT(*)
      FROM blog_posts
      WHERE category = NEW.category
        AND status = 'published'
    )
    WHERE slug = NEW.category;
  END IF;

  -- Update count for old category on update/delete
  IF TG_OP = 'UPDATE' AND OLD.category != NEW.category THEN
    UPDATE blog_categories
    SET post_count = (
      SELECT COUNT(*)
      FROM blog_posts
      WHERE category = OLD.category
        AND status = 'published'
    )
    WHERE slug = OLD.category;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE blog_categories
    SET post_count = (
      SELECT COUNT(*)
      FROM blog_posts
      WHERE category = OLD.category
        AND status = 'published'
    )
    WHERE slug = OLD.category;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_category_count();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_post_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_views_trigger
  AFTER INSERT ON blog_post_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_blog_post_views();

-- ============================================
-- STORAGE BUCKETS (for blog images)
-- ============================================

-- Create storage bucket for blog images (run in Supabase Storage UI or via SQL)
-- This creates a public bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view blog images
CREATE POLICY "Public can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

-- Storage policy: Authenticated users can upload blog images
CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

-- Storage policy: Authenticated users can update blog images
CREATE POLICY "Authenticated users can update blog images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

-- Storage policy: Authenticated users can delete blog images
CREATE POLICY "Authenticated users can delete blog images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'blog%'
ORDER BY table_name;

-- Verify categories were inserted
SELECT * FROM blog_categories ORDER BY slug;

-- Verify indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename LIKE 'blog%'
ORDER BY tablename, indexname;
