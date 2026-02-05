/**
 * Referrals Page
 * Full referral program dashboard
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReferralDashboard from '../components/referrals/ReferralDashboard';

export default function Referrals() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Helmet>
          <title>Referral Program | The Hub</title>
        </Helmet>
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-3xl font-bold text-white mb-4">Referral Program</h1>
          <p className="text-gray-400 mb-8">
            Sign in to access your referral dashboard and start earning free Pro months!
          </p>
          <button
            onClick={() => navigate('/login?redirect=/referrals')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>Referral Program | The Hub</title>
        <meta name="description" content="Refer friends to The Hub and earn free Pro months! Get 1 free month for every 3 paid referrals." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Referral Program</h1>
          <p className="text-gray-400">
            Share The Hub with friends and earn free Pro months
          </p>
        </div>

        <ReferralDashboard />
      </div>
    </div>
  );
}
