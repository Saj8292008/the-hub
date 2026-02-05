/**
 * Premium Subscription Page
 * Multi-tier pricing with Pro ($9/mo) and Premium ($19/mo)
 * 
 * Aligned with freemium research:
 * - Pro: Speed/early access for engaged users
 * - Premium: Power features for resellers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  AlertCircle,
  Rocket,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TierInfo {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  features: string[];
  limits: {
    tracks: number | string;
    alertsPerDay: number | string;
    priceHistory: boolean;
    realTimeAlerts: boolean;
    prioritySupport: boolean;
    aiFeatures: string;
    exportData: boolean;
    earlyAccess: boolean;
  };
  badge: string | null;
}

export default function Premium() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  useEffect(() => {
    // Fetch tier pricing from API
    fetchPricing();

    // Show message if canceled
    if (searchParams.get('canceled') === 'true') {
      toast.error('Checkout canceled. No charges were made.');
    }
  }, [searchParams]);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stripe/prices`);
      const data = await res.json();
      setTiers(data.tiers || []);
      setStripeConfigured(data.stripeConfigured);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const handleUpgrade = async (tier: TierInfo) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/premium');
      return;
    }

    const priceId = billingPeriod === 'monthly' 
      ? tier.stripePriceIdMonthly 
      : tier.stripePriceIdYearly;

    if (!priceId) {
      toast.error('This plan is not available yet. Please contact support.');
      return;
    }

    setLoading(tier.id);

    try {
      const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.usePortal) {
          // User already has subscription - redirect to billing portal
          toast('Redirecting to billing portal to change your plan...', { icon: '🔄' });
          const portalRes = await fetch(`${API_URL}/api/stripe/change-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          const portalData = await portalRes.json();
          if (portalData.url) {
            window.location.href = portalData.url;
            return;
          }
        }
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const freeTier = tiers.find(t => t.id === 'free');
  const proTier = tiers.find(t => t.id === 'pro');
  const premiumTier = tiers.find(t => t.id === 'premium');

  const getYearlySavings = (monthly: number, yearly: number) => {
    const yearlyFromMonthly = monthly * 12;
    return yearlyFromMonthly - yearly;
  };

  const renderTierCard = (tier: TierInfo, highlighted: boolean = false) => {
    const isCurrentPlan = user?.tier === tier.id;
    const price = billingPeriod === 'monthly' ? tier.priceMonthly : Math.floor(tier.priceYearly / 12);
    const priceId = billingPeriod === 'monthly' ? tier.stripePriceIdMonthly : tier.stripePriceIdYearly;
    const yearlySavings = getYearlySavings(tier.priceMonthly, tier.priceYearly);
    const isDowngrade = user?.tier === 'premium' && tier.id === 'pro';
    const isUpgrade = user?.tier === 'pro' && tier.id === 'premium';

    return (
      <div
        className={`relative rounded-2xl p-8 ${
          highlighted
            ? 'bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-2 border-purple-500'
            : 'bg-gray-800/30 border border-gray-700'
        } backdrop-blur-sm`}
      >
        {/* Badge */}
        {tier.badge && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
              tier.id === 'premium' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                : 'bg-gradient-to-r from-blue-600 to-blue-700'
            }`}>
              {tier.id === 'premium' ? <Crown size={16} /> : <Zap size={16} />}
              <span className="text-sm font-medium">{tier.badge}</span>
            </div>
          </div>
        )}

        <div className={`mb-6 ${tier.badge ? 'mt-4' : ''}`}>
          <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
          <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
          
          {tier.priceMonthly > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-green-400 mt-2">
                  Save ${yearlySavings}/year (billed as ${tier.priceYearly})
                </p>
              )}
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-gray-400">/month</span>
            </div>
          )}
        </div>

        <ul className="space-y-4 mb-8">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className={`flex-shrink-0 mt-1 ${
                highlighted ? 'text-purple-400' : 'text-green-400'
              }`} size={20} />
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>

        {tier.id === 'free' ? (
          <button
            disabled={isCurrentPlan}
            className="w-full py-3 rounded-lg bg-gray-700 text-gray-300 font-medium disabled:opacity-50 cursor-not-allowed"
          >
            {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
          </button>
        ) : (
          <button
            onClick={() => handleUpgrade(tier)}
            disabled={loading !== null || isCurrentPlan || !priceId}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
              highlighted
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/25'
            } text-white`}
          >
            {loading === tier.id ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : isCurrentPlan ? (
              'Current Plan'
            ) : !priceId ? (
              'Coming Soon'
            ) : isDowngrade ? (
              'Downgrade to Pro'
            ) : isUpgrade ? (
              'Upgrade to Premium'
            ) : (
              `Get ${tier.name}`
            )}
          </button>
        )}

        {!priceId && tier.id !== 'free' && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-yellow-200">
                Stripe is not configured yet. Contact support to enable payments.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <Sparkles className="text-purple-400" size={16} />
            <span className="text-sm text-purple-300">Choose Your Plan</span>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Never Miss Another Deal
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time alerts, price history, and AI-powered insights to help you find the best deals
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
                2 mo free
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {freeTier && renderTierCard(freeTier)}
          {proTier && renderTierCard(proTier, false)}
          {premiumTier && renderTierCard(premiumTier, true)}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto mb-16 bg-gray-800/30 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold">Compare Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Free</th>
                  <th className="text-center p-4 text-blue-400 font-medium">Pro</th>
                  <th className="text-center p-4 text-purple-400 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700/50">
                  <td className="p-4">Tracked searches</td>
                  <td className="text-center p-4">3</td>
                  <td className="text-center p-4">25</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-4">Daily alerts</td>
                  <td className="text-center p-4">5</td>
                  <td className="text-center p-4">100</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-4">Alert speed</td>
                  <td className="text-center p-4 text-gray-500">15 min delay</td>
                  <td className="text-center p-4 text-green-400">Real-time</td>
                  <td className="text-center p-4 text-green-400">Real-time</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-4">Price history</td>
                  <td className="text-center p-4"><X className="mx-auto text-gray-600" size={20} /></td>
                  <td className="text-center p-4"><Check className="mx-auto text-green-400" size={20} /></td>
                  <td className="text-center p-4"><Check className="mx-auto text-green-400" size={20} /></td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-4">AI deal analysis</td>
                  <td className="text-center p-4 text-gray-500">Basic</td>
                  <td className="text-center p-4 text-blue-400">Advanced</td>
                  <td className="text-center p-4 text-purple-400">Full Suite</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-4">Export data</td>
                  <td className="text-center p-4"><X className="mx-auto text-gray-600" size={20} /></td>
                  <td className="text-center p-4">CSV</td>
                  <td className="text-center p-4">CSV + JSON</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-4">Priority support</td>
                  <td className="text-center p-4"><X className="mx-auto text-gray-600" size={20} /></td>
                  <td className="text-center p-4"><X className="mx-auto text-gray-600" size={20} /></td>
                  <td className="text-center p-4"><Check className="mx-auto text-green-400" size={20} /></td>
                </tr>
                <tr>
                  <td className="p-4">API access</td>
                  <td className="text-center p-4"><X className="mx-auto text-gray-600" size={20} /></td>
                  <td className="text-center p-4"><X className="mx-auto text-gray-600" size={20} /></td>
                  <td className="text-center p-4"><Check className="mx-auto text-green-400" size={20} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <Zap className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Speed Matters</h3>
            <p className="text-gray-400 text-sm">
              Premium members got this deal alert 15 minutes before it sold out. Don't miss the next one.
            </p>
          </div>

          <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Proven ROI</h3>
            <p className="text-gray-400 text-sm">
              Our Pro members average $420/month in savings on tracked items. The subscription pays for itself.
            </p>
          </div>

          <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <Shield className="text-green-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Cancel Anytime</h3>
            <p className="text-gray-400 text-sm">
              No contracts, no commitments. Cancel with one click and keep access until your billing period ends.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">What's the difference between Pro and Premium?</h3>
              <p className="text-gray-400">
                Pro is perfect for deal hunters who want real-time alerts and price history. Premium adds unlimited everything, 
                priority support, API access, and custom alert filters for power users and resellers.
              </p>
            </div>

            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">Can I switch plans later?</h3>
              <p className="text-gray-400">
                Absolutely! You can upgrade or downgrade anytime from your account settings. If you upgrade, you'll be 
                charged the prorated difference. If you downgrade, the change takes effect at your next billing date.
              </p>
            </div>

            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">Is there a refund policy?</h3>
              <p className="text-gray-400">
                Yes! We offer a 7-day money-back guarantee. If you're not satisfied within the first 7 days, 
                contact support for a full refund—no questions asked.
              </p>
            </div>

            <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold mb-2">How do real-time alerts work?</h3>
              <p className="text-gray-400">
                Pro and Premium members get instant Telegram notifications the moment a deal matches their criteria. 
                Free users receive alerts after a 15-minute delay—by which time the best deals are often gone.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            Questions? <a href="/settings" className="text-purple-400 hover:text-purple-300">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
