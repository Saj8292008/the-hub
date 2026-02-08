import React, { useState } from 'react'
import { Check, Crown, Zap, Sparkles, ArrowRight, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Plan {
  name: string
  tier: 'free' | 'pro' | 'premium'
  price: {
    monthly: number
    yearly: number
  }
  stripePriceId: {
    monthly: string
    yearly: string
  }
  description: string
  features: string[]
  popular?: boolean
  icon: React.ElementType
  gradient: string
  glowColor: string
}

const plans: Plan[] = [
  {
    name: 'Free',
    tier: 'free',
    price: { monthly: 0, yearly: 0 },
    stripePriceId: { monthly: '', yearly: '' },
    description: 'Perfect for getting started',
    features: [
      'Access to 100 deals per month',
      'Basic price alerts',
      'Email notifications',
      'Community access',
    ],
    icon: Star,
    gradient: 'from-gray-600 to-gray-700',
    glowColor: 'gray-500'
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: { monthly: 9, yearly: 90 },
    stripePriceId: {
      monthly: 'price_1Sy1BjCaz620S5FSO8c5KhF9',
      yearly: 'price_1Sy1BjCaz620S5FSDGlVkwJ4'
    },
    description: 'For serious collectors and flippers',
    features: [
      'Unlimited deals access',
      'Advanced price tracking',
      'Instant Telegram alerts',
      'Priority deal notifications',
      'Custom watchlists (up to 50 items)',
      'Deal scoring insights',
      'API access (basic)',
    ],
    popular: true,
    icon: Zap,
    gradient: 'from-blue-600 to-blue-700',
    glowColor: 'blue-500'
  },
  {
    name: 'Premium',
    tier: 'premium',
    price: { monthly: 29, yearly: 290 },
    stripePriceId: {
      monthly: 'price_1Sy1BkCaz620S5FSZceyouEG',
      yearly: 'price_1Sy1BkCaz620S5FSHiGZvodz'
    },
    description: 'For power users and businesses',
    features: [
      'Everything in Pro',
      'Unlimited custom watchlists',
      'Advanced analytics dashboard',
      'Historical price data',
      'Multi-channel alerts (SMS, Email, Telegram)',
      'API access (unlimited)',
      'Early access to new features',
      'Priority support',
      'Custom deal filters',
    ],
    icon: Crown,
    gradient: 'from-purple-600 to-purple-700',
    glowColor: 'purple-500'
  }
]

export const PricingPlans: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (plan: Plan) => {
    if (plan.tier === 'free') return
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    try {
      setLoading(plan.tier)
      const priceId = plan.stripePriceId[billingPeriod]
      
      // Call your backend to create checkout session
      const response = await api.createCheckoutSession({
        priceId,
        tier: plan.tier,
        billingPeriod
      })

      if (response.url) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const isCurrentPlan = (tier: string) => {
    return user?.tier === tier
  }

  const getButtonText = (plan: Plan) => {
    if (plan.tier === 'free') return 'Current Plan'
    if (loading === plan.tier) return 'Loading...'
    if (isCurrentPlan(plan.tier)) return 'Current Plan'
    return 'Upgrade Now'
  }

  const getSavingsPercent = () => {
    return Math.round((1 - (10 / 12)) * 100) // ~17% savings
  }

  return (
    <div className="relative">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-semibold mb-4">
          <Sparkles size={16} />
          <span>Pricing Plans</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-4">
          Choose Your Plan
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Start free, upgrade when you need more power. All plans include our AI-powered deal discovery.
        </p>

        {/* Billing Toggle */}
        <div className="mt-8 inline-flex items-center gap-4 p-1.5 rounded-2xl bg-gray-900/50 border border-gray-800">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
              Save {getSavingsPercent()}%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, index) => {
          const Icon = plan.icon
          const isPopular = plan.popular
          const isCurrent = isCurrentPlan(plan.tier)
          const isDisabled = plan.tier === 'free' || isCurrent || loading !== null

          return (
            <div
              key={plan.name}
              className={`relative group ${
                isPopular ? 'md:-mt-4 md:scale-105' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold shadow-lg">
                    <Star size={14} fill="white" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isPopular
                    ? 'border-blue-500/50 bg-gradient-to-br from-gray-900 to-gray-900/50 shadow-2xl shadow-blue-500/20'
                    : 'border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 hover:border-gray-700'
                } ${!isDisabled ? 'hover:scale-[1.02] hover:shadow-2xl' : ''}`}
              >
                {/* Glow effect */}
                {isPopular && (
                  <div className={`absolute -inset-1 bg-gradient-to-r from-${plan.glowColor}/20 to-${plan.glowColor}/10 opacity-50 blur-xl -z-10`}></div>
                )}

                {/* Content */}
                <div className="p-8">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} mb-6 shadow-lg`}>
                    <Icon className="text-white" size={28} />
                  </div>

                  {/* Plan name */}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">
                        ${plan.price[billingPeriod]}
                      </span>
                      <span className="text-gray-400">
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && plan.tier !== 'free' && (
                      <p className="text-sm text-emerald-400 mt-2">
                        ${(plan.price.yearly / 12).toFixed(2)}/month billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isDisabled}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : plan.tier === 'free'
                        ? 'bg-gray-800 text-gray-300 cursor-default'
                        : isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105'
                        : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105'
                    }`}
                  >
                    {getButtonText(plan)}
                    {!isDisabled && plan.tier !== 'free' && (
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>

                  {/* Features */}
                  <div className="mt-8 space-y-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      What's included:
                    </div>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center mt-0.5`}>
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust badges */}
      <div className="mt-16 text-center">
        <p className="text-gray-500 text-sm mb-6">Trusted by collectors and flippers worldwide</p>
        <div className="flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center gap-2 text-gray-400">
            <Check className="text-emerald-400" size={18} />
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
