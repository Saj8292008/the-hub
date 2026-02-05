/**
 * Authentication Service
 * Handles all API calls for JWT-based authentication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  referralCode?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  notificationPreferences?: {
    email?: boolean;
    telegram?: boolean;
    price_alerts?: boolean;
  };
}

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  telegramChatId: number | null;
  notificationPreferences: {
    email: boolean;
    telegram: boolean;
    price_alerts: boolean;
  };
  tier: 'free' | 'premium' | 'pro' | 'enterprise';
  subscriptionStartsAt: string | null;
  subscriptionEndsAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  user?: T;
  note?: string;
  code?: string;
}

/**
 * Make authenticated API request with credentials
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupData): Promise<ApiResponse> {
  return apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log in user
 */
export async function login(data: LoginData): Promise<ApiResponse<User>> {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log out user
 */
export async function logout(): Promise<ApiResponse> {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<ApiResponse> {
  return apiRequest('/api/auth/refresh', {
    method: 'POST',
  });
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<ApiResponse> {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ApiResponse> {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<ApiResponse> {
  return apiRequest(`/api/auth/verify-email?token=${token}`);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiRequest<{ user: User }>('/api/auth/me');
  return response.user;
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: UpdateProfileData
): Promise<ApiResponse<User>> {
  return apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export type { User, SignupData, LoginData, UpdateProfileData, ApiResponse };
