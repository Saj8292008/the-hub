/**
 * Premium Subscription Page
 * Pricing tiers, feature comparison, and upgrade flow
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Check,
  X,
  Crown,
  Zap,
  Shield,
  TrendingUp,
  Bell,
  BarChart3,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Premium() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    // Show message if canceled
    if (searchParams.get('canceled') === 'true') {
      toast.error('Checkout canceled. No charges were made.');
    }
  }, [searchParams]);

  const handleUpgrade = async (priceId: string) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/premium');
      return;
    }

    if (!priceId) {
      toast.error('Stripe is not configured yet. Please contact support.');
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const { url } = await res.json();

      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const features = {
    free: [
      { name: '5 tracked items', included: true },
      { name: '3 price alerts', included: true },
      { name: 'Daily email digest', included: true },
      { name: 'Basic AI features', included: true },
      { name: 'Real-time alerts', included: false },
      { name: 'Unlimited tracking', included: false },
      { name: 'Price history charts', included: false },
      { name: 'Advanced AI features', included: false },
      { name: 'Priority support', included: false }
    ],
    premium: [
      { name: 'Unlimited tracked items', included: true },
      { name: 'Unlimited price alerts', included: true },
      { name: 'Real-time Telegram alerts', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Advanced AI features', included: true },
      { name: 'Price history charts', included: true },
      { name: 'Export data (CSV)', included: true },
      { name: 'Priority support', included: true },
      { name: 'Early access to features', included: true }
    ]
  };

  const monthlyPriceId = import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID;
  const yearlyPriceId = import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID;

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <Sparkles className="text-purple-400" size={16} />
            <span className="text-sm text-purple-300">Upgrade to Premium</span>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Unlock Unlimited Tracking
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Track every deal, get instant alerts, and never miss a price drop again
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 mt-8 p-2 bg-gray-800/50 rounded-xl">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                Save $30
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Tier */}
          <div className="relative bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {features.free.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="text-green-400 flex-shrink-0 mt-1" size={20} />
                  ) : (
                    <X className="text-gray-600 flex-shrink-0 mt-1" size={20} />
                  )}
                  <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <button
              disabled={user?.tier === 'free'}
              className="w-full py-3 rounded-lg bg-gray-700 text-gray-300 font-medium disabled:opacity-50 cursor-not-allowed"
            >
              {user?.tier === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Premium Tier */}
          <div className="relative bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-2xl border-2 border-purple-500 p-8">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
                <Crown size={16} />
                <span className="text-sm font-medium">Most Popular</span>
              </div>
            </div>

            <div className="mb-6 mt-4">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">
                  ${billingPeriod === 'monthly' ? '14.99' : '12.42'}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-purple-300 mt-2">Billed as $149/year</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {features.premium.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="text-purple-400 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">{feature.name}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(billingPeriod === 'monthly' ? monthlyPriceId : yearlyPriceId)}
              disabled={loading || user?.tier === 'premium' || !monthlyPriceId}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : user?.tier === 'premium' ? (
                'Current Plan'
              ) : !monthlyPriceId ? (
                'Coming Soon'
              ) : (
                'Upgrade Now'
              )}
            </button>

            {!monthlyPriceId && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-yellow-200">
                    Stripe is not configured yet. Set up your Stripe account to enable payments.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <Zap className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Real-Time Alerts</h3>
            <p className="text-gray-400 text-sm">
              Get instant Telegram notifications the moment prices drop on your tracked items
            </p>
          </div>

          <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Price History</h3>
            <p className="text-gray-400 text-sm">
              View detailed price charts and trends to make informed purchase decisions
            </p>
          </div>

          <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <Shield className="text-green-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Priority Support</h3>
            <p className="text-gray-400 text-sm">
              Get help faster with dedicated support and early access to new features
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time from your settings. You'll keep Premium access until the end of your billing period.
              </p>
            </div>

            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-400">
                We accept all major credit cards (Visa, Mastercard, American Express) via Stripe, our secure payment processor.
              </p>
            </div>

            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-gray-400">
                Your tracked items and alerts will remain in your account, but you'll be limited to the free tier limits (5 items, 3 alerts) until you upgrade again.
              </p>
            </div>

            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">Is there a refund policy?</h3>
              <p className="text-gray-400">
                Yes, we offer a 7-day money-back guarantee. If you're not satisfied with Premium within the first 7 days, contact support for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            Have questions? <a href="/settings" className="text-purple-400 hover:text-purple-300">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
