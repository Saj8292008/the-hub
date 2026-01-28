-- The Hub Blog Platform Database Schema
-- Blog-specific tables only

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

  -- Full text search
  search_vector TSVECTOR
);

-- Blog Post Views (Analytics)
CREATE TABLE IF NOT EXISTS blog_post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45),
  viewer_country VARCHAR(2),
  referrer TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Subscribers (Newsletter)
CREATE TABLE IF NOT EXISTS blog_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,

  -- Preferences
  frequency VARCHAR(20) DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  categories TEXT[] DEFAULT ARRAY['watches', 'cars', 'sneakers', 'sports', 'general']
);

-- Blog Post Relations (Related Posts)
CREATE TABLE IF NOT EXISTS blog_post_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  related_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 0.5,

  UNIQUE(post_id, related_post_id),
  CHECK (post_id != related_post_id)
);

-- Blog Categories (Metadata)
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon_name VARCHAR(50),
  color VARCHAR(7),
  post_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Blog Posts Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_keywords ON blog_posts USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN(search_vector);

-- Blog Views Indexes
CREATE INDEX IF NOT EXISTS idx_blog_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_viewed_at ON blog_post_views(viewed_at DESC);

-- Blog Subscribers Indexes
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_subscribed_at ON blog_subscribers(subscribed_at DESC);

-- Blog Relations Indexes
CREATE INDEX IF NOT EXISTS idx_blog_relations_post_id ON blog_post_relations(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_relations_related_post_id ON blog_post_relations(related_post_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for blog posts
DROP TRIGGER IF EXISTS trigger_update_blog_post_timestamp ON blog_posts;
CREATE TRIGGER trigger_update_blog_post_timestamp
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_timestamp();

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_blog_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector
DROP TRIGGER IF EXISTS trigger_update_blog_post_search_vector ON blog_posts;
CREATE TRIGGER trigger_update_blog_post_search_vector
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_search_vector();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- Blog Posts Policies
-- Public can read published posts
CREATE POLICY "Public can read published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Authenticated users with admin role can do everything
CREATE POLICY "Admins can do everything with blog posts" ON blog_posts
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Blog Views Policies
-- Anyone can insert views (for analytics)
CREATE POLICY "Anyone can insert blog views" ON blog_post_views
  FOR INSERT WITH CHECK (true);

-- Only admins can read views
CREATE POLICY "Admins can read blog views" ON blog_post_views
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Blog Subscribers Policies
-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe" ON blog_subscribers
  FOR INSERT WITH CHECK (true);

-- Subscribers can update their own preferences
CREATE POLICY "Subscribers can update their preferences" ON blog_subscribers
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admins can read all subscribers
CREATE POLICY "Admins can read subscribers" ON blog_subscribers
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Blog Relations Policies
-- Public can read relations
CREATE POLICY "Public can read blog relations" ON blog_post_relations
  FOR SELECT USING (true);

-- Admins can manage relations
CREATE POLICY "Admins can manage blog relations" ON blog_post_relations
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Blog Categories Policies
-- Public can read categories
CREATE POLICY "Public can read blog categories" ON blog_categories
  FOR SELECT USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can manage blog categories" ON blog_categories
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, icon_name, color) VALUES
  ('Watches', 'watches', 'Luxury timepieces, watch collecting, and watch market insights', 'Watch', '#3b82f6'),
  ('Cars', 'cars', 'Exotic cars, classic automobiles, and automotive market trends', 'Car', '#ef4444'),
  ('Sneakers', 'sneakers', 'Limited edition sneakers, sneaker culture, and resale market', 'Shoe', '#10b981'),
  ('Sports', 'sports', 'Sports memorabilia, trading cards, and collectibles', 'Trophy', '#f59e0b'),
  ('General', 'general', 'Platform updates, investment strategies, and market analysis', 'BookOpen', '#6366f1')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STORAGE BUCKET (Run separately if needed)
-- ============================================
-- This creates a public storage bucket for blog images
-- Run in Supabase dashboard or via API if not created

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('blog-images', 'blog-images', true)
-- ON CONFLICT (id) DO NOTHING;
