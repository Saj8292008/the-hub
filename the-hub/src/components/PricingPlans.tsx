import React, { useState } from 'react'
import { Check, X, Crown, Zap, Sparkles, ArrowRight, Star, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface PricingFeature {
  text: string
  free: boolean
  pro: boolean
}

const features: PricingFeature[] = [
  { text: 'Basic deal feed', free: true, pro: true },
  { text: 'Email digest (weekly)', free: true, pro: true },
  { text: 'Community access', free: true, pro: true },
  { text: '3 tracked searches', free: true, pro: false },
  { text: '25 tracked searches', free: false, pro: true },
  { text: 'Real-time Telegram alerts', free: false, pro: true },
  { text: 'Price history charts', free: false, pro: true },
  { text: 'Advanced AI deal scoring', free: false, pro: true },
  { text: 'Early access to deals', free: false, pro: true },
  { text: 'Export data (CSV)', free: false, pro: true },
  { text: 'Ad-free experience', free: false, pro: true },
  { text: 'Priority support', free: false, pro: true },
]

const PRO_MONTHLY = 9
const PRO_YEARLY = 99
const PRO_YEARLY_MONTHLY = +(PRO_YEARLY / 12).toFixed(2) // ~8.25
const SAVINGS_PERCENT = Math.round((1 - PRO_YEARLY / (PRO_MONTHLY * 12)) * 100) // ~8%

export const PricingPlans: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    try {
      setLoading(true)

      // Use the appropriate price ID based on billing period
      const priceId = billingPeriod === 'yearly'
        ? 'price_1Sy1BjCaz620S5FSDGlVkwJ4'  // yearly
        : 'price_1Sy1BjCaz620S5FSO8c5KhF9'   // monthly

      const response = await api.createCheckoutSession({
        priceId,
        tier: 'pro',
        billingPeriod
      })

      if (response.url) {
        window.location.href = response.url
      }
    } catch (error: any) {
      console.error('Checkout failed:', error)
      if (error.message?.includes('Already subscribed')) {
        // Redirect to billing portal
        try {
          const portal = await api.createPortalSession()
          if (portal.url) window.location.href = portal.url
        } catch {
          alert('Please manage your subscription in Settings.')
        }
      } else {
        alert('Failed to start checkout. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const isCurrentPro = user?.tier === 'pro'
  const currentPrice = billingPeriod === 'yearly' ? PRO_YEARLY : PRO_MONTHLY
  const monthlyEquivalent = billingPeriod === 'yearly' ? PRO_YEARLY_MONTHLY : PRO_MONTHLY

  return (
    <div className="relative">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold mb-4">
          <Sparkles size={16} />
          <span>Simple Pricing</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-4">
          Upgrade to Pro
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Get real-time alerts, price history, and advanced deal scoring. Cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="mt-8 inline-flex items-center gap-4 p-1.5 rounded-2xl bg-gray-900/50 border border-gray-800">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
              Save {SAVINGS_PERCENT}%
            </span>
          </button>
        </div>
      </div>

      {/* Two-column pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

        {/* FREE TIER */}
        <div className="relative rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 overflow-hidden">
          <div className="p-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 mb-6 shadow-lg">
              <Star className="text-white" size={28} />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <p className="text-gray-400 text-sm mb-6">Perfect for getting started</p>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-gray-400">/forever</span>
              </div>
            </div>

            <button
              disabled
              className="w-full py-3.5 px-6 rounded-xl font-semibold bg-gray-800 text-gray-500 cursor-not-allowed"
            >
              {user?.tier === 'free' || !user ? 'Current Plan' : 'Free Tier'}
            </button>

            <div className="mt-8 space-y-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                What's included:
              </div>
              {features.filter(f => f.free).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mt-0.5">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{feature.text}</span>
                </div>
              ))}
              {features.filter(f => !f.free && f.pro).slice(0, 3).map((feature, idx) => (
                <div key={`no-${idx}`} className="flex items-start gap-3 opacity-40">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center mt-0.5">
                    <X size={12} className="text-gray-500" strokeWidth={3} />
                  </div>
                  <span className="text-gray-500 text-sm leading-relaxed line-through">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PRO TIER */}
        <div className="relative rounded-2xl border border-blue-500/50 bg-gradient-to-br from-gray-900 to-gray-900/50 shadow-2xl shadow-blue-500/20 overflow-hidden md:-mt-4 md:scale-105">
          {/* Popular badge */}
          <div className="absolute -top-0 left-0 right-0 flex justify-center z-10 translate-y-[-50%]">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold shadow-lg">
              <Zap size={14} fill="white" />
              Most Popular
            </div>
          </div>

          <div className="p-8 pt-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 mb-6 shadow-lg">
              <Crown className="text-white" size={28} />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <p className="text-gray-400 text-sm mb-6">For serious deal hunters</p>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">
                  ${currentPrice}
                </span>
                <span className="text-gray-400">
                  /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-emerald-400 mt-2">
                  ${monthlyEquivalent}/month billed annually — save {SAVINGS_PERCENT}%
                </p>
              )}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={isCurrentPro || loading}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isCurrentPro
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105'
              }`}
            >
              {loading ? 'Loading...' : isCurrentPro ? 'Current Plan' : 'Upgrade to Pro'}
              {!isCurrentPro && !loading && (
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>

            <div className="mt-8 space-y-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Everything in Free, plus:
              </div>
              {features.filter(f => f.pro && !f.free).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mt-0.5">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-16 text-center">
        <div className="flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="text-emerald-400" size={18} />
            <span className="text-sm">Secure payments via Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Check className="text-emerald-400" size={18} />
            <span className="text-sm">Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Check className="text-emerald-400" size={18} />
            <span className="text-sm">30-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  )
}
