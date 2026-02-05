/**
 * Referral Dashboard Component
 * Shows referral stats, progress towards free months, and shareable link
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ReferralStats {
  code: string;
  referralLink: string;
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
  freeMonthsEarned: number;
  progressToNextMonth: number;
  referralsNeededForNextMonth: number;
  requiredPaidReferrals: number;
  totalDaysEarned: number;
  milestonesAchieved: number[];
  nextMilestone: number | null;
  referrals: Array<{
    id: string;
    status: string;
    isPaid: boolean;
    paidAt: string | null;
    joinedAt: string;
    referredUser: {
      firstName: string;
      email: string | null;
      joinedAt: string;
    } | null;
  }>;
  rewardHistory: Array<{
    id: string;
    reward_type: string;
    reward_value: number;
    trigger_referral_count: number;
    applied: boolean;
    created_at: string;
  }>;
}

export default function ReferralDashboard() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/referrals/stats`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load referral stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading referral stats:', error);
      toast.error('Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!stats?.referralLink) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      toast.success('Referral link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
    setTimeout(() => setCopying(false), 1000);
  };

  const copyCode = async () => {
    if (!stats?.code) return;

    try {
      await navigator.clipboard.writeText(stats.code);
      toast.success('Code copied!');
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const shareLink = () => {
    if (!stats?.referralLink) return;

    if (navigator.share) {
      navigator.share({
        title: 'Join The Hub',
        text: 'Check out The Hub - the best deal tracking platform!',
        url: stats.referralLink,
      });
    } else {
      copyLink();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#1a1f3a] rounded-xl p-6 border border-gray-800">
        <p className="text-gray-400 text-center">
          Please log in to view your referral dashboard.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#1a1f3a] rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-[#1a1f3a] rounded-xl p-6 border border-gray-800">
        <p className="text-gray-400 text-center">
          Failed to load referral stats. Please try again.
        </p>
        <button
          onClick={loadStats}
          className="mt-4 mx-auto block text-purple-400 hover:text-purple-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(
    (stats.progressToNextMonth / stats.requiredPaidReferrals) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header Card - Referral Link */}
      <div className="bg-gradient-to-br from-purple-900/50 to-[#1a1f3a] rounded-xl p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold text-white mb-2">🎁 Refer Friends, Get Free Pro</h2>
        <p className="text-gray-400 mb-4">
          For every 3 friends who subscribe to Pro, you get 1 free month!
        </p>

        {/* Referral Code */}
        <div className="bg-[#0A0E27] rounded-lg p-4 mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Your Referral Code</label>
          <div className="flex items-center gap-3">
            <code className="text-2xl font-mono text-purple-400 tracking-wider flex-grow">
              {stats.code}
            </code>
            <button
              onClick={copyCode}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Copy code"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={copyLink}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-lg font-medium transition-all ${
              copying
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {copying ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button
            onClick={shareLink}
            className="flex-1 min-w-[140px] py-3 px-4 bg-[#0A0E27] hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            📤 Share
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="Total Referrals"
          value={stats.totalReferrals}
          color="blue"
        />
        <StatCard
          icon="💰"
          label="Paid Signups"
          value={stats.paidReferrals}
          color="green"
        />
        <StatCard
          icon="🎁"
          label="Free Months Earned"
          value={stats.freeMonthsEarned}
          color="purple"
        />
        <StatCard
          icon="📅"
          label="Total Days Earned"
          value={stats.totalDaysEarned}
          color="yellow"
        />
      </div>

      {/* Progress Card */}
      <div className="bg-[#1a1f3a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Progress to Next Free Month</h3>
        
        <div className="relative">
          {/* Progress Bar */}
          <div className="h-4 bg-[#0A0E27] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Markers */}
          <div className="flex justify-between mt-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    num <= stats.progressToNextMonth
                      ? 'bg-purple-500'
                      : 'bg-gray-600'
                  }`}
                />
                <span className="text-xs text-gray-400 mt-1">{num}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center mt-4 text-gray-400">
          {stats.referralsNeededForNextMonth === 0 ? (
            <span className="text-green-400">🎉 You've earned a free month!</span>
          ) : (
            <>
              <span className="text-white font-bold">{stats.progressToNextMonth}</span>
              {' / '}
              {stats.requiredPaidReferrals} paid referrals
              {' • '}
              <span className="text-purple-400">{stats.referralsNeededForNextMonth} more to go!</span>
            </>
          )}
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-[#1a1f3a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <StepCard
            step={1}
            icon="📤"
            title="Share Your Link"
            description="Send your unique referral link to friends"
          />
          <StepCard
            step={2}
            icon="👤"
            title="They Sign Up & Subscribe"
            description="When they subscribe to Pro, it counts toward your reward"
          />
          <StepCard
            step={3}
            icon="🎁"
            title="Get Free Pro"
            description="Every 3 paid signups = 1 free month of Pro for you!"
          />
        </div>
      </div>

      {/* Referral History */}
      {stats.referrals.length > 0 && (
        <div className="bg-[#1a1f3a] rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {stats.referrals.slice(0, 10).map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-[#0A0E27] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    referral.isPaid ? 'bg-green-500/20' : 'bg-gray-700'
                  }`}>
                    {referral.isPaid ? '💰' : '👤'}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {referral.referredUser?.firstName || 'User'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Joined {new Date(referral.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {referral.isPaid ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                      Subscribed ✓
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-700 text-gray-400 text-sm rounded-full">
                      Free Tier
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {stats.totalReferrals > 10 && (
            <p className="text-center text-gray-400 text-sm mt-4">
              Showing 10 of {stats.totalReferrals} referrals
            </p>
          )}
        </div>
      )}

      {/* Milestones */}
      {stats.milestonesAchieved.length > 0 && (
        <div className="bg-[#1a1f3a] rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">🏆 Milestones</h3>
          <div className="flex flex-wrap gap-3">
            {[5, 10, 25, 50, 100].map((milestone) => (
              <div
                key={milestone}
                className={`px-4 py-2 rounded-lg ${
                  stats.milestonesAchieved.includes(milestone)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {milestone} Referrals
                {stats.milestonesAchieved.includes(milestone) && ' ✓'}
              </div>
            ))}
          </div>
          {stats.nextMilestone && (
            <p className="text-gray-400 text-sm mt-4">
              Next milestone: {stats.nextMilestone} referrals (
              {stats.nextMilestone - stats.totalReferrals} more to go)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const colorClasses = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/30',
    green: 'from-green-600/20 to-green-600/5 border-green-500/30',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30',
    yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-4">
      <div className="w-12 h-12 mx-auto mb-3 bg-purple-600/20 rounded-full flex items-center justify-center">
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-xs text-purple-400 mb-1">Step {step}</div>
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
