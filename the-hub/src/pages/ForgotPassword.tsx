/**
 * Forgot Password Page
 * Request password reset email
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, validateEmail } from '../services/auth';
import AuthNav from '../components/AuthNav';
import AuthFooter from '../components/AuthFooter';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({});
    if (serverError) setServerError('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <AuthNav />
        <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12">
          <div className="max-w-md w-full">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-white/10 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Check Your Email</h2>
              <p className="text-gray-400 mb-6 text-lg">
                If an account exists with <span className="text-white font-medium">{email}</span>, we've sent password reset instructions.
              </p>

              <div className="bg-white/5 rounded-lg p-5 mb-6 border border-white/10">
                <p className="text-sm font-medium text-gray-300 mb-3">Next steps:</p>
                <ol className="text-sm text-gray-400 space-y-2 text-left list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the reset link (valid for 1 hour)</li>
                  <li>Create a new password</li>
                </ol>
              </div>

              <Link
                to="/login"
                className="inline-block border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-black transition-all duration-200"
              >
                Back to Login
              </Link>

              <p className="text-gray-500 text-sm mt-4">
                Didn't receive the email? Check your spam folder
              </p>
            </div>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <AuthNav />
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Forgot Password?</h1>
            <p className="text-gray-400 text-lg">No worries, we'll send you reset instructions</p>
          </div>

          {/* Form Card */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Server Error */}
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{serverError}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black/40 border ${
                    errors.email ? 'border-red-500/50' : 'border-white/10'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors`}
                  placeholder="you@example.com"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to login
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}
