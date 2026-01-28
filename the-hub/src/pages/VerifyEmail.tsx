/**
 * Verify Email Page
 * Verify email address with token from email
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../services/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token');
      setLoading(false);
      return;
    }

    verifyEmailWithToken();
  }, [token]);

  const verifyEmailWithToken = async () => {
    if (!token) return;

    try {
      await verifyEmail(token);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-[#1a1f3a] rounded-2xl p-8 shadow-xl border border-gray-800 text-center">
            {/* Loading Spinner */}
            <div className="w-16 h-16 mx-auto mb-4">
              <svg className="animate-spin h-16 w-16 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email</h2>
            <p className="text-gray-400">Please wait while we verify your email address...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-[#1a1f3a] rounded-2xl p-8 shadow-xl border border-gray-800 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-gray-400 mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </p>

            <div className="bg-[#0A0E27] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300 mb-2">What's next?</p>
              <ul className="text-sm text-gray-400 space-y-2 text-left list-disc list-inside">
                <li>Track watches, cars, sneakers, and sports gear</li>
                <li>Set price alerts for your favorite items</li>
                <li>Get instant notifications via email or Telegram</li>
                <li>Access premium features</li>
              </ul>
            </div>

            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-[#1a1f3a] rounded-2xl p-8 shadow-xl border border-gray-800 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>

          <div className="bg-[#0A0E27] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300 mb-2">Possible reasons:</p>
            <ul className="text-sm text-gray-400 space-y-2 text-left list-disc list-inside">
              <li>The verification link has expired (24 hours)</li>
              <li>The link has already been used</li>
              <li>The link is invalid or corrupted</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              to="/signup"
              className="block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200"
            >
              Create New Account
            </Link>

            <Link
              to="/login"
              className="block text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
