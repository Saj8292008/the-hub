/**
 * Blog API Endpoints
 * REST API for blog posts, categories, and subscribers
 */

const blogQueries = require('../../db/blogQueries');
const slugify = require('slugify');

class BlogAPI {
  // ============================================
  // BLOG POSTS
  // ============================================

  /**
   * Get all blog posts with filters
   * GET /api/blog/posts?category=watches&page=1&limit=12&search=rolex
   */
  async getPosts(req) {
    const {
      category,
      status = 'published',
      page = 1,
      limit = 12,
      sortBy = 'published_at',
      sortOrder = 'desc',
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await blogQueries.getPosts({
      category,
      status,
      limit: parseInt(limit),
      offset,
      sortBy,
      sortOrder,
      search
    });

    if (result.error) {
      throw new Error(`Failed to fetch posts: ${result.error.message}`);
    }

    // Calculate total pages
    const total = result.count || result.data.length;
    const pages = Math.ceil(total / parseInt(limit));

    return {
      posts: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    };
  }

  /**
   * Get a single blog post by slug
   * GET /api/blog/posts/:slug
   */
  async getPostBySlug(req) {
    const { slug } = req.params;

    const result = await blogQueries.getPostBySlug(slug);

    if (result.error || !result.data) {
      throw new Error('Post not found');
    }

    // Get related posts
    const relatedResult = await blogQueries.getRelatedPosts(
      result.data.id,
      result.data.category,
      result.data.tags || [],
      3
    );

    return {
      post: result.data,
      relatedPosts: relatedResult.data || []
    };
  }

  /**
   * Get a single blog post by ID
   * GET /api/blog/posts/id/:id
   */
  async getPostById(req) {
    const { id } = req.params;

    const result = await blogQueries.getPostById(id);

    if (result.error || !result.data) {
      throw new Error('Post not found');
    }

    return result.data;
  }

  /**
   * Create a new blog post
   * POST /api/blog/posts
   * Requires authentication
   */
  async createPost(req) {
    const postData = req.body;

    // Generate slug if not provided
    if (!postData.slug && postData.title) {
      postData.slug = this.generateSlug(postData.title);
    }

    // Set published_at if status is published and not provided
    if (postData.status === 'published' && !postData.published_at) {
      postData.published_at = new Date().toISOString();
    }

    const result = await blogQueries.createPost(postData);

    if (result.error) {
      throw new Error(`Failed to create post: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Update a blog post
   * PUT /api/blog/posts/:id
   * Requires authentication
   */
  async updatePost(req) {
    const { id } = req.params;
    const updates = req.body;

    // Regenerate slug if title changed
    if (updates.title && !updates.slug) {
      updates.slug = this.generateSlug(updates.title);
    }

    // Set published_at if status is being changed to published
    if (updates.status === 'published' && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }

    const result = await blogQueries.updatePost(id, updates);

    if (result.error) {
      throw new Error(`Failed to update post: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Delete a blog post
   * DELETE /api/blog/posts/:id
   * Requires authentication
   */
  async deletePost(req) {
    const { id } = req.params;

    const result = await blogQueries.deletePost(id);

    if (result.error) {
      throw new Error(`Failed to delete post: ${result.error.message}`);
    }

    return { success: true, message: 'Post deleted successfully' };
  }

  // ============================================
  // CATEGORIES
  // ============================================

  /**
   * Get all blog categories
   * GET /api/blog/categories
   */
  async getCategories(req) {
    const result = await blogQueries.getCategories();

    if (result.error) {
      throw new Error(`Failed to fetch categories: ${result.error.message}`);
    }

    return result.data;
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Track a blog post view
   * POST /api/blog/posts/:id/view
   */
  async trackView(req) {
    const { id } = req.params;

    const viewData = {
      ip: req.ip || req.connection.remoteAddress,
      country: req.headers['cf-ipcountry'] || null, // Cloudflare header
      referrer: req.headers.referer || req.headers.referrer || null,
      userAgent: req.headers['user-agent'] || null
    };

    const result = await blogQueries.trackView(id, viewData);

    if (result.error) {
      // Don't throw error for view tracking failures
      console.error('Failed to track view:', result.error);
    }

    return { success: true };
  }

  /**
   * Get post analytics
   * GET /api/blog/analytics/:id
   * Requires authentication
   */
  async getPostAnalytics(req) {
    const { id } = req.params;

    const result = await blogQueries.getPostAnalytics(id);

    if (result.error) {
      throw new Error(`Failed to fetch analytics: ${result.error.message}`);
    }

    return result.data;
  }

  // ============================================
  // SUBSCRIBERS
  // ============================================

  /**
   * Subscribe to newsletter
   * POST /api/blog/subscribe
   */
  async subscribe(req) {
    const { email, name, source = 'blog' } = req.body;

    if (!email || !this.isValidEmail(email)) {
      throw new Error('Valid email is required');
    }

    const result = await blogQueries.addSubscriber({ email, name, source });

    if (result.error) {
      throw new Error(result.error.message || 'Failed to subscribe');
    }

    return {
      success: true,
      message: 'Successfully subscribed to newsletter!',
      subscriber: result.data
    };
  }

  /**
   * Get all subscribers
   * GET /api/blog/subscribers
   * Requires authentication
   */
  async getSubscribers(req) {
    const { confirmed, unsubscribed } = req.query;

    const result = await blogQueries.getSubscribers({
      confirmed: confirmed !== undefined ? confirmed === 'true' : null,
      unsubscribed: unsubscribed !== undefined ? unsubscribed === 'true' : null
    });

    if (result.error) {
      throw new Error(`Failed to fetch subscribers: ${result.error.message}`);
    }

    return result.data;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Generate URL-friendly slug from title
   * @param {string} title - Post title
   * @returns {string} - URL slug
   */
  generateSlug(title) {
    return slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new BlogAPI();
