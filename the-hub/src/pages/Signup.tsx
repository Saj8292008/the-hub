/**
 * Signup Page
 * User registration with email verification
 * Supports referral codes via URL param: /signup?ref=HUB-XXXX-XXXX
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../services/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, clearError } = useAuth();

  // Get referral code from URL
  const refCode = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    referralCode: refCode,
  });

  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);

  // Validate referral code on mount or when it changes
  useEffect(() => {
    if (formData.referralCode) {
      validateReferralCode(formData.referralCode);
    }
  }, []);

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 8) {
      setReferrerName(null);
      return;
    }

    setValidatingCode(true);
    try {
      const response = await fetch(`${API_URL}/api/referrals/validate/${code}`);
      const data = await response.json();
      if (data.valid) {
        setReferrerName(data.referrerName || 'A Hub member');
      } else {
        setReferrerName(null);
      }
    } catch {
      setReferrerName(null);
    }
    setValidatingCode(false);
  };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (serverError) setServerError('');
    clearError();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordCheck = validatePassword(formData.password);
      if (!passwordCheck.valid) {
        newErrors.password = passwordCheck.errors[0];
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        referralCode: formData.referralCode || undefined,
      });

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, referralCode: value }));
    
    // Validate after a short delay
    if (value.length >= 8) {
      validateReferralCode(value);
    } else {
      setReferrerName(null);
    }
  };

  // Success state - show verification message
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

            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent a verification link to <span className="text-purple-400 font-medium">{formData.email}</span>
            </p>

            <div className="bg-[#0A0E27] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300 mb-2">Next steps:</p>
              <ol className="text-sm text-gray-400 space-y-2 text-left list-decimal list-inside">
                <li>Open the email from The Hub</li>
                <li>Click the verification link</li>
                <li>Sign in to your account</li>
              </ol>
            </div>

            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200"
            >
              Go to Login
            </Link>

            <p className="text-gray-500 text-sm mt-4">
              Didn't receive the email? Check your spam folder
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Start tracking the best deals</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1a1f3a] rounded-2xl p-8 shadow-xl border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Server Error */}
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            {/* Name Fields (Side by Side) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#0A0E27] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="John"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#0A0E27] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0A0E27] border ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                placeholder="you@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0A0E27] border ${
                  errors.password ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0A0E27] border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Referral Code Field */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-300 mb-2">
                Referral Code (optional)
              </label>
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleReferralCodeChange}
                className={`w-full px-4 py-3 bg-[#0A0E27] border ${
                  referrerName ? 'border-green-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors uppercase`}
                placeholder="HUB-XXXX-XXXX"
                disabled={loading}
              />
              {validatingCode && (
                <p className="mt-2 text-sm text-gray-400">Validating code...</p>
              )}
              {referrerName && !validatingCode && (
                <p className="mt-2 text-sm text-green-400">
                  ✓ Referred by {referrerName}
                </p>
              )}
              {formData.referralCode && !referrerName && !validatingCode && formData.referralCode.length >= 8 && (
                <p className="mt-2 text-sm text-red-400">
                  Invalid referral code
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
