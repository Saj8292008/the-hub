/**
 * Verify Email Page
 * Verify email address with token from email
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../services/auth';
import AuthNav from '../components/AuthNav';
import AuthFooter from '../components/AuthFooter';

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
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <AuthNav />
        <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12">
          <div className="max-w-md w-full">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-white/10 text-center">
              {/* Loading Spinner */}
              <div className="w-16 h-16 mx-auto mb-6">
                <svg className="animate-spin h-16 w-16 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Verifying Email</h2>
              <p className="text-gray-400 text-lg">Please wait while we verify your email address...</p>
            </div>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <AuthNav />
        <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12">
          <div className="max-w-md w-full">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-white/10 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Email Verified!</h2>
              <p className="text-gray-400 mb-6 text-lg">
                Your email has been successfully verified. You can now log in to your account.
              </p>

              <div className="bg-white/5 rounded-lg p-5 mb-6 border border-white/10">
                <p className="text-sm font-medium text-gray-300 mb-3">What's next?</p>
                <ul className="text-sm text-gray-400 space-y-2 text-left list-disc list-inside">
                  <li>Track watches, cars, sneakers, and sports gear</li>
                  <li>Set price alerts for your favorite items</li>
                  <li>Get instant notifications via email or Telegram</li>
                  <li>Access premium features</li>
                </ul>
              </div>

              <Link
                to="/login"
                className="inline-block border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-black transition-all duration-200"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <AuthNav />
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12">
        <div className="max-w-md w-full">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-white/10 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white mb-3">Verification Failed</h2>
            <p className="text-gray-400 mb-6 text-lg">{error}</p>

            <div className="bg-white/5 rounded-lg p-5 mb-6 border border-white/10">
              <p className="text-sm font-medium text-gray-300 mb-3">Possible reasons:</p>
              <ul className="text-sm text-gray-400 space-y-2 text-left list-disc list-inside">
                <li>The verification link has expired (24 hours)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                to="/signup"
                className="block border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-black transition-all duration-200"
              >
                Create New Account
              </Link>

              <Link
                to="/login"
                className="block text-gray-400 hover:text-white text-sm transition-colors underline"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}
