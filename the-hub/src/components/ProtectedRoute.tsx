/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export default function ProtectedRoute({ children, requireVerified = false }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireVerified && user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-[#1a1f3a] rounded-2xl p-8 shadow-xl border border-gray-800 text-center">
            {/* Warning Icon */}
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Email Verification Required</h2>
            <p className="text-gray-400 mb-6">
              Please verify your email address to access this feature.
            </p>

            <div className="bg-[#0A0E27] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">
                We sent a verification email to <span className="text-purple-400 font-medium">{user.email}</span>
              </p>
            </div>

            <p className="text-sm text-gray-500">
              Check your inbox and click the verification link. Don't forget to check your spam folder!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated (and verified if required)
  return <>{children}</>;
}
