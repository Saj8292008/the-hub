/**
 * Blog API Service
 * Client for blog REST API endpoints
 */

import type {
  BlogPost,
  BlogPostSummary,
  BlogPostsResponse,
  BlogPostWithRelated,
  BlogCategoryInfo,
  BlogFilters,
  CreatePostInput,
  UpdatePostInput,
  SubscribeInput,
  BlogSubscriber,
  BlogPostAnalytics
} from '../types/blog';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class BlogService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Generic request handler
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Blog API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ============================================
  // BLOG POSTS
  // ============================================

  /**
   * Get all blog posts with optional filters
   */
  async getPosts(filters?: BlogFilters): Promise<BlogPostsResponse> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const endpoint = `/api/blog/posts${queryString ? `?${queryString}` : ''}`;

    return this.request<BlogPostsResponse>(endpoint);
  }

  /**
   * Get a single blog post by slug
   */
  async getPostBySlug(slug: string): Promise<BlogPostWithRelated> {
    return this.request<BlogPostWithRelated>(`/api/blog/posts/${slug}`);
  }

  /**
   * Get a single blog post by ID
   */
  async getPostById(id: string): Promise<BlogPost> {
    return this.request<BlogPost>(`/api/blog/posts/id/${id}`);
  }

  /**
   * Create a new blog post (requires authentication)
   */
  async createPost(postData: CreatePostInput): Promise<BlogPost> {
    return this.request<BlogPost>('/api/blog/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  /**
   * Update a blog post (requires authentication)
   */
  async updatePost(id: string, updates: Partial<CreatePostInput>): Promise<BlogPost> {
    return this.request<BlogPost>(`/api/blog/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a blog post (requires authentication)
   */
  async deletePost(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/blog/posts/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // CATEGORIES
  // ============================================

  /**
   * Get all blog categories
   */
  async getCategories(): Promise<BlogCategoryInfo[]> {
    return this.request<BlogCategoryInfo[]>('/api/blog/categories');
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Track a blog post view
   */
  async trackView(postId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/blog/posts/${postId}/view`, {
      method: 'POST',
    });
  }

  /**
   * Get post analytics (requires authentication)
   */
  async getPostAnalytics(postId: string): Promise<BlogPostAnalytics> {
    return this.request<BlogPostAnalytics>(`/api/blog/analytics/${postId}`);
  }

  // ============================================
  // SUBSCRIBERS
  // ============================================

  /**
   * Subscribe to newsletter
   */
  async subscribe(data: SubscribeInput): Promise<{ success: boolean; message: string; subscriber: BlogSubscriber }> {
    return this.request<{ success: boolean; message: string; subscriber: BlogSubscriber }>('/api/blog/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all subscribers (requires authentication)
   */
  async getSubscribers(options?: { confirmed?: boolean; unsubscribed?: boolean }): Promise<BlogSubscriber[]> {
    const params = new URLSearchParams();

    if (options?.confirmed !== undefined) params.append('confirmed', options.confirmed.toString());
    if (options?.unsubscribed !== undefined) params.append('unsubscribed', options.unsubscribed.toString());

    const queryString = params.toString();
    const endpoint = `/api/blog/subscribers${queryString ? `?${queryString}` : ''}`;

    return this.request<BlogSubscriber[]>(endpoint);
  }
}

export const blogService = new BlogService();
export default blogService;
