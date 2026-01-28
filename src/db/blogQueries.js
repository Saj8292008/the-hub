/**
 * Blog Database Queries
 * Supabase queries for blog posts, subscribers, and analytics
 */

const supabaseClient = require('./supabase');

class BlogQueries {
  constructor() {
    this.client = supabaseClient.client;
  }

  async getSupabaseClient() {
    return this.client;
  }

  // ============================================
  // BLOG POSTS
  // ============================================

  /**
   * Get all blog posts with optional filters
   * @param {Object} options - Filter options
   * @returns {Promise<{data: Array, error: any}>}
   */
  async getPosts(options = {}) {
    const {
      category = null,
      status = 'published',
      limit = 12,
      offset = 0,
      sortBy = 'published_at',
      sortOrder = 'desc',
      search = null
    } = options;

    try {
      const client = await this.getSupabaseClient();
      let query = client
        .from('blog_posts')
        .select('id, title, slug, excerpt, hero_image_url, thumbnail_url, category, tags, author_name, author_avatar_url, published_at, read_time_minutes, view_count, share_count, ai_generated, created_at');

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (category) {
        query = query.eq('category', category);
      }

      // Full-text search
      if (search) {
        query = query.textSearch('search_vector', search);
      }

      // Only show published posts that are not scheduled for future
      if (status === 'published') {
        query = query.lte('published_at', new Date().toISOString());
      }

      // Sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, error: null, count };
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return { data: [], error, count: 0 };
    }
  }

  /**
   * Get a single blog post by slug
   * @param {string} slug - Post slug
   * @returns {Promise<{data: Object, error: any}>}
   */
  async getPostBySlug(slug) {
    try {
      const client = await this.getSupabaseClient();
      const { data, error } = await client
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single blog post by ID
   * @param {string} id - Post ID
   * @returns {Promise<{data: Object, error: any}>}
   */
  async getPostById(id) {
    try {
      const client = await this.getSupabaseClient();
      const { data, error } = await client
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new blog post
   * @param {Object} postData - Post data
   * @returns {Promise<{data: Object, error: any}>}
   */
  async createPost(postData) {
    try {
      const client = await this.getSupabaseClient();

      // Calculate read time if not provided
      if (!postData.read_time_minutes && postData.content) {
        postData.read_time_minutes = this.calculateReadTime(postData.content);
      }

      const { data, error } = await client
        .from('blog_posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating blog post:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a blog post
   * @param {string} id - Post ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: any}>}
   */
  async updatePost(id, updates) {
    try {
      const client = await this.getSupabaseClient();

      // Recalculate read time if content changed
      if (updates.content && !updates.read_time_minutes) {
        updates.read_time_minutes = this.calculateReadTime(updates.content);
      }

      const { data, error } = await client
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating blog post:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a blog post
   * @param {string} id - Post ID
   * @returns {Promise<{success: boolean, error: any}>}
   */
  async deletePost(id) {
    try {
      const client = await this.getSupabaseClient();
      const { error } = await client
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return { success: false, error };
    }
  }

  /**
   * Get related posts based on category and tags
   * @param {string} postId - Current post ID
   * @param {string} category - Post category
   * @param {Array} tags - Post tags
   * @param {number} limit - Number of related posts
   * @returns {Promise<{data: Array, error: any}>}
   */
  async getRelatedPosts(postId, category, tags = [], limit = 3) {
    try {
      const client = await this.getSupabaseClient();
      const { data, error } = await client
        .from('blog_posts')
        .select('id, title, slug, excerpt, thumbnail_url, category, published_at, read_time_minutes')
        .eq('status', 'published')
        .eq('category', category)
        .neq('id', postId)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return { data: [], error };
    }
  }

  // ============================================
  // CATEGORIES
  // ============================================

  /**
   * Get all blog categories with post counts
   * @returns {Promise<{data: Array, error: any}>}
   */
  async getCategories() {
    try {
      const client = await this.getSupabaseClient();
      const { data, error } = await client
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { data: [], error };
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Track a blog post view
   * @param {string} postId - Post ID
   * @param {Object} viewData - Viewer information
   * @returns {Promise<{success: boolean, error: any}>}
   */
  async trackView(postId, viewData = {}) {
    try {
      const client = await this.getSupabaseClient();
      const { error } = await client
        .from('blog_post_views')
        .insert([{
          post_id: postId,
          viewer_ip: viewData.ip || null,
          viewer_country: viewData.country || null,
          referrer: viewData.referrer || null,
          user_agent: viewData.userAgent || null
        }]);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error tracking view:', error);
      return { success: false, error };
    }
  }

  /**
   * Get post analytics
   * @param {string} postId - Post ID
   * @returns {Promise<{data: Object, error: any}>}
   */
  async getPostAnalytics(postId) {
    try {
      const client = await this.getSupabaseClient();

      // Get view count by day (last 30 days)
      const { data: views, error: viewsError } = await client
        .from('blog_post_views')
        .select('viewed_at')
        .eq('post_id', postId)
        .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('viewed_at', { ascending: false });

      if (viewsError) throw viewsError;

      // Get post details
      const { data: post, error: postError } = await this.getPostById(postId);

      if (postError) throw postError;

      return {
        data: {
          post,
          views,
          totalViews: post.view_count || 0,
          totalShares: post.share_count || 0
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { data: null, error };
    }
  }

  // ============================================
  // SUBSCRIBERS
  // ============================================

  /**
   * Add a new subscriber
   * @param {Object} subscriberData - Subscriber information
   * @returns {Promise<{data: Object, error: any}>}
   */
  async addSubscriber(subscriberData) {
    try {
      const client = await this.getSupabaseClient();
      const { data, error } = await client
        .from('blog_subscribers')
        .insert([{
          email: subscriberData.email,
          name: subscriberData.name || null,
          source: subscriberData.source || 'unknown',
          confirmation_token: this.generateConfirmationToken()
        }])
        .select()
        .single();

      if (error) {
        // Check if duplicate email
        if (error.code === '23505') {
          return { data: null, error: { message: 'Email already subscribed' } };
        }
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error adding subscriber:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all subscribers
   * @param {Object} options - Filter options
   * @returns {Promise<{data: Array, error: any}>}
   */
  async getSubscribers(options = {}) {
    const { confirmed = true, unsubscribed = false } = options;

    try {
      const client = await this.getSupabaseClient();
      let query = client
        .from('blog_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (confirmed !== null) {
        query = query.eq('confirmed', confirmed);
      }
      if (unsubscribed !== null) {
        query = query.eq('unsubscribed', unsubscribed);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return { data: [], error };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Calculate estimated reading time
   * @param {string} content - Post content in Markdown
   * @returns {number} - Reading time in minutes
   */
  calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Generate a random confirmation token
   * @returns {string}
   */
  generateConfirmationToken() {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

module.exports = new BlogQueries();
