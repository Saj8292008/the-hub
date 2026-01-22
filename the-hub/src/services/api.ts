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
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
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

  async addTeam(data: any) {
    return this.request('/sports/teams', {
      method: 'POST',
      body: JSON.stringify(data),
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
}

export const api = new ApiService();
export default api;
