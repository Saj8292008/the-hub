const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Stats
  async getStats() {
    return this.request<{
      watches: number;
      cars: number;
      sneakers: number;
      sports: number;
      aiModels: number;
    }>('/stats');
  }

  // Alerts
  async getAlerts() {
    return this.request<any[]>('/alerts');
  }

  // Watches
  async getWatches() {
    return this.request<any[]>('/watches');
  }

  async getWatch(id: string) {
    return this.request<any>(`/watches/${id}`);
  }

  async addWatch(data: any) {
    return this.request('/watches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWatch(id: string, data: any) {
    return this.request(`/watches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWatch(id: string) {
    return this.request(`/watches/${id}`, {
      method: 'DELETE',
    });
  }

  // Cars
  async getCars() {
    return this.request<any[]>('/cars');
  }

  async getCar(id: string) {
    return this.request<any>(`/cars/${id}`);
  }

  async addCar(data: any) {
    return this.request('/cars', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCar(id: string, data: any) {
    return this.request(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCar(id: string) {
    return this.request(`/cars/${id}`, {
      method: 'DELETE',
    });
  }

  // Sneakers
  async getSneakers() {
    return this.request<any[]>('/sneakers');
  }

  async getSneaker(id: string) {
    return this.request<any>(`/sneakers/${id}`);
  }

  async addSneaker(data: any) {
    return this.request('/sneakers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSneaker(id: string, data: any) {
    return this.request(`/sneakers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSneaker(id: string) {
    return this.request(`/sneakers/${id}`, {
      method: 'DELETE',
    });
  }

  // Sports
  async getScores(league?: string) {
    const query = league ? `?league=${league}` : '';
    return this.request<any>(`/sports/scores${query}`);
  }

  async getSchedule(league?: string) {
    const query = league ? `?league=${league}` : '';
    return this.request<any>(`/sports/schedule${query}`);
  }

  async getTeams() {
    return this.request<any[]>('/sports/teams');
  }

  async addTeam(data: any) {
    return this.request('/sports/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(id: string) {
    return this.request(`/sports/teams/${id}`, {
      method: 'DELETE',
    });
  }

  // AI
  async getAINews() {
    return this.request<any>('/ai/news');
  }

  async getAISummary() {
    return this.request<any>('/ai/summary');
  }

  // Price History
  async getPriceHistory(type: string, id: string, limit: number = 30) {
    return this.request<any[]>(`/${type}/${id}/history?limit=${limit}`);
  }

  // Health Check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Scraper Methods
  async getScraperListings(params?: {
    source?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.source) query.append('source', params.source);
    if (params?.brand) query.append('brand', params.brand);
    if (params?.minPrice) query.append('minPrice', params.minPrice);
    if (params?.maxPrice) query.append('maxPrice', params.maxPrice);
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    return this.request<any[]>(`/scraper/listings${queryString ? '?' + queryString : ''}`);
  }

  async triggerScrape(source?: string) {
    return this.request('/scraper/scheduler/run', {
      method: 'POST',
      body: JSON.stringify({ source: source || undefined }),
    });
  }

  async searchWatches(brand: string, model: string, options?: any) {
    return this.request<any>('/scraper/search', {
      method: 'POST',
      body: JSON.stringify({ brand, model, options }),
    });
  }

  async getScraperStats() {
    return this.request<any>('/scraper/stats');
  }

  async getScraperSchedulerStatus() {
    return this.request<any>('/scraper/scheduler/status');
  }

  async addToWatchlist(brand: string, model: string, options?: any) {
    return this.request('/scraper/watchlist', {
      method: 'POST',
      body: JSON.stringify({ brand, model, options }),
    });
  }

  async removeFromWatchlist(brand: string, model: string) {
    return this.request('/scraper/watchlist', {
      method: 'DELETE',
      body: JSON.stringify({ brand, model }),
    });
  }

  async getScraperSources() {
    return this.request<{ sources: string[]; count: number }>('/scraper/sources');
  }

  // Billing & Subscriptions
  async createCheckoutSession(data: {
    priceId: string;
    tier: string;
    billingPeriod: 'monthly' | 'yearly';
  }) {
    return this.request<{ url: string }>('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubscriptionStatus() {
    return this.request<any>('/api/stripe/subscription-status');
  }

  async createPortalSession() {
    return this.request<{ url: string }>('/api/stripe/create-portal-session', {
      method: 'POST',
    });
  }

  async getStripePrices() {
    return this.request<any>('/api/stripe/prices');
  }

  async changePlan() {
    return this.request<{ url: string }>('/api/stripe/change-plan', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
export default api;
