/**
 * Auth Context — Clerk-backed compatibility layer
 * Maps Clerk auth to the legacy useAuth() interface so existing components work unchanged.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.firstName || '',
    role: (clerkUser.publicMetadata?.role as string) || 'user',
  } : null;

  async function login() {
    // Clerk handles login via <SignIn /> component
  }

  async function signup() {
    // Clerk handles signup via <SignUp /> component
  }

  async function logout() {
    await signOut();
  }

  async function refreshUser() {
    // Clerk handles this automatically
  }

  function clearError() {
    // No-op with Clerk
  }

  const value: AuthContextType = {
    user,
    loading: !isLoaded,
    error: null,
    isAuthenticated: !!isSignedIn,
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
