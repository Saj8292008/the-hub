/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  login as loginService,
  logout as logoutService,
  signup as signupService,
  getCurrentUser,
  refreshToken,
  type User,
  type LoginData,
  type SignupData,
} from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;

    // Refresh token every 14 minutes (before 15 min expiry)
    const interval = setInterval(async () => {
      try {
        await refreshToken();
        console.log('Token refreshed successfully');
      } catch (err) {
        console.error('Token refresh failed:', err);
        // If refresh fails, user needs to log in again
        setUser(null);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      // Not authenticated or token expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(data: LoginData) {
    try {
      setError(null);
      setLoading(true);

      const response = await loginService(data);

      if (response.user) {
        setUser(response.user);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signup(data: SignupData) {
    try {
      setError(null);
      setLoading(true);

      await signupService(data);
      // Don't set user - they need to verify email first
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setError(null);
      await logoutService();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setUser(null);
    }
  }

  function clearError() {
    setError(null);
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
