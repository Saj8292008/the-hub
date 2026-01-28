/**
 * Newsletter API Service
 * Client for newsletter REST API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SubscribeInput {
  email: string;
  name?: string;
  source: string;
  preferences?: {
    categories?: string[];
  };
}

interface Campaign {
  id: string;
  name: string;
  subject_line: string;
  subject_line_variant?: string;
  content_html: string;
  content_markdown?: string;
  status: string;
  campaign_type: string;
  scheduled_for?: string;
  total_recipients?: number;
  total_sent?: number;
  total_failed?: number;
  ai_generated?: boolean;
  created_at: string;
}

interface CampaignAnalytics {
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_unsubscribes: number;
  unique_opens: number;
  unique_clicks: number;
  open_rate: number;
  click_rate: number;
}

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  confirmed: boolean;
  unsubscribed: boolean;
  subscribed_at: string;
  category_preferences?: string[];
}

interface AnalyticsOverview {
  total_subscribers: number;
  active_subscribers: number;
  total_campaigns: number;
  sent_campaigns: number;
  avg_open_rate: number;
  avg_click_rate: number;
  recent_campaigns: Campaign[];
}

class NewsletterService {
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
    } catch (error: any) {
      console.error(`Newsletter API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ============================================
  // SUBSCRIBERS
  // ============================================

  /**
   * Subscribe to newsletter
   */
  async subscribe(data: SubscribeInput): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all subscribers (admin)
   */
  async getSubscribers(options?: {
    confirmed?: boolean;
    unsubscribed?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    subscribers: Subscriber[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const params = new URLSearchParams();

    if (options?.confirmed !== undefined) params.append('confirmed', options.confirmed.toString());
    if (options?.unsubscribed !== undefined) params.append('unsubscribed', options.unsubscribed.toString());
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/newsletter/subscribers${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Export subscribers to CSV
   */
  async exportSubscribers(): Promise<{ success: boolean; csv: string; count: number }> {
    return this.request('/api/newsletter/subscribers/export', {
      method: 'POST',
    });
  }

  // ============================================
  // CAMPAIGNS
  // ============================================

  /**
   * Get all campaigns
   */
  async getCampaigns(options?: {
    status?: string;
    campaign_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    campaigns: Campaign[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const params = new URLSearchParams();

    if (options?.status) params.append('status', options.status);
    if (options?.campaign_type) params.append('campaign_type', options.campaign_type);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/newsletter/campaigns${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Get single campaign with analytics
   */
  async getCampaign(id: string): Promise<{
    campaign: Campaign;
    analytics: CampaignAnalytics;
  }> {
    return this.request(`/api/newsletter/campaigns/${id}`);
  }

  /**
   * Create campaign
   */
  async createCampaign(data: Partial<Campaign>): Promise<{ success: boolean; campaign: Campaign }> {
    return this.request('/api/newsletter/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<{ success: boolean; campaign: Campaign }> {
    return this.request(`/api/newsletter/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/newsletter/campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Send test email
   */
  async sendTestEmail(id: string, recipients: string[]): Promise<{
    success: boolean;
    results: any[];
    sent: number;
    failed: number;
  }> {
    return this.request(`/api/newsletter/campaigns/${id}/send-test`, {
      method: 'POST',
      body: JSON.stringify({ recipients }),
    });
  }

  /**
   * Schedule campaign
   */
  async scheduleCampaign(id: string, scheduledFor: string): Promise<{ success: boolean; campaign: Campaign }> {
    return this.request(`/api/newsletter/campaigns/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduled_for: scheduledFor }),
    });
  }

  /**
   * Send campaign now
   */
  async sendCampaignNow(id: string): Promise<{ success: boolean; message: string; campaign_id: string }> {
    return this.request(`/api/newsletter/campaigns/${id}/send-now`, {
      method: 'POST',
    });
  }

  // ============================================
  // AI GENERATION
  // ============================================

  /**
   * Generate newsletter content with AI
   */
  async generateNewsletter(options?: {
    week_start?: string;
    week_end?: string;
    custom_prompt?: string;
  }): Promise<{
    success: boolean;
    subject_lines: string[];
    content_markdown: string;
    content_html: string;
    deals: any[];
    stats: any;
  }> {
    return this.request('/api/newsletter/generate', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(): Promise<AnalyticsOverview & { success: boolean }> {
    return this.request('/api/newsletter/analytics/overview');
  }

  /**
   * Get growth analytics
   */
  async getGrowthAnalytics(days: number = 30): Promise<{
    success: boolean;
    growth: Array<{ date: string; new: number; unsubscribed: number; net: number }>;
    days: number;
  }> {
    return this.request(`/api/newsletter/analytics/growth?days=${days}`);
  }

  // ============================================
  // SCHEDULER
  // ============================================

  /**
   * Get scheduler status
   */
  async getSchedulerStatus(): Promise<{
    isRunning: boolean;
    lastRun: string | null;
    nextRun: string | null;
    stats: any;
  }> {
    return this.request('/api/newsletter/scheduler/status');
  }

  /**
   * Start scheduler
   */
  async startScheduler(schedule?: string): Promise<{ success: boolean; status: any }> {
    return this.request('/api/newsletter/scheduler/start', {
      method: 'POST',
      body: JSON.stringify({ schedule }),
    });
  }

  /**
   * Stop scheduler
   */
  async stopScheduler(): Promise<{ success: boolean }> {
    return this.request('/api/newsletter/scheduler/stop', {
      method: 'POST',
    });
  }

  /**
   * Manually trigger newsletter send
   */
  async runSchedulerNow(): Promise<{ success: boolean; result: any }> {
    return this.request('/api/newsletter/scheduler/run-now', {
      method: 'POST',
    });
  }
}

export const newsletterService = new NewsletterService();
export default newsletterService;
