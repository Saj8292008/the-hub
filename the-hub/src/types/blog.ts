/**
 * Blog Type Definitions
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  hero_image_url?: string;
  thumbnail_url?: string;

  // SEO
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];

  // Categorization
  category: BlogCategory;
  tags?: string[];

  // Publishing
  status: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  scheduled_for?: string;

  // Author
  author_id?: string;
  author_name?: string;
  author_avatar_url?: string;

  // Metadata
  read_time_minutes?: number;
  view_count: number;
  share_count: number;

  // AI
  ai_generated: boolean;
  ai_model?: string;
  ai_prompt?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type BlogCategory = 'watches' | 'cars' | 'sneakers' | 'sports' | 'general';

export interface BlogCategoryInfo {
  slug: BlogCategory;
  name: string;
  description: string;
  color: string;
  icon: string;
  post_count: number;
  created_at: string;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  hero_image_url?: string;
  thumbnail_url?: string;
  category: BlogCategory;
  tags?: string[];
  author_name?: string;
  author_avatar_url?: string;
  published_at?: string;
  read_time_minutes?: number;
  view_count: number;
  share_count: number;
  ai_generated: boolean;
  created_at: string;
}

export interface BlogPostsResponse {
  posts: BlogPostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BlogPostWithRelated {
  post: BlogPost;
  relatedPosts: BlogPostSummary[];
}

export interface BlogSubscriber {
  id: string;
  email: string;
  name?: string;
  source: string;
  subscribed_at: string;
  confirmed: boolean;
  confirmation_token?: string;
  unsubscribed: boolean;
  unsubscribed_at?: string;
}

export interface BlogPostView {
  id: string;
  post_id: string;
  viewer_ip?: string;
  viewer_country?: string;
  referrer?: string;
  user_agent?: string;
  viewed_at: string;
}

export interface BlogPostAnalytics {
  post: BlogPost;
  views: BlogPostView[];
  totalViews: number;
  totalShares: number;
}

export interface BlogFilters {
  category?: BlogCategory;
  status?: 'draft' | 'published' | 'scheduled';
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'published_at' | 'created_at' | 'view_count' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  hero_image_url?: string;
  thumbnail_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  category: BlogCategory;
  tags?: string[];
  status?: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  scheduled_for?: string;
  author_name?: string;
  author_avatar_url?: string;
  ai_generated?: boolean;
  ai_model?: string;
  ai_prompt?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string;
}

export interface SubscribeInput {
  email: string;
  name?: string;
  source?: string;
}

export const BLOG_CATEGORY_COLORS: Record<BlogCategory, string> = {
  watches: '#D4AF37',
  cars: '#FF8C42',
  sneakers: '#00D4FF',
  sports: '#10B981',
  general: '#8B5CF6'
};

export const BLOG_CATEGORY_NAMES: Record<BlogCategory, string> = {
  watches: 'Watches',
  cars: 'Cars',
  sneakers: 'Sneakers',
  sports: 'Sports',
  general: 'General'
};
