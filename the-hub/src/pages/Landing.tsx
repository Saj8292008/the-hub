import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Watch, 
  Car, 
  Footprints, 
  Trophy, 
  TrendingUp, 
  Bell, 
  Zap, 
  ChevronRight,
  Check,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Users
} from 'lucide-react'
import EmailCapture from '../components/newsletter/EmailCapture'

const TELEGRAM_LINK = 'https://t.me/hubtest123'

const Landing: React.FC = () => {
  const [email, setEmail] = useState('')

  const features = [
    {
      icon: Watch,
      title: 'Watches',
      description: 'Track prices from Reddit, Chrono24, WatchUSeek & more. Never miss a deal on your grail.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Footprints,
      title: 'Sneakers',
      description: 'StockX, GOAT price monitoring. Get alerts when your size drops below target.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Car,
      title: 'Cars',
      description: 'Enthusiast vehicle tracking. Find undervalued listings before anyone else.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Trophy,
      title: 'Sports',
      description: 'Live scores, stats, and memorabilia alerts. All your teams, one dashboard.',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const benefits = [
    'Real-time price alerts',
    'Multi-marketplace tracking',
    'Deal scoring algorithm',
    'Weekly digest newsletter',
    'Telegram notifications',
    'Price history charts'
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800/50 backdrop-blur-sm fixed top-0 w-full z-50 bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">The Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">Your deals dashboard for the culture</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Never miss a{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              deal
            </span>{' '}
            again
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            The Hub monitors watches, sneakers, cars & sports collectibles across every marketplace. 
            Get instant alerts when prices drop.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a 
              href={TELEGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <MessageCircle className="w-5 h-5" /> Join Telegram - Free Alerts
            </a>
            <Link 
              to="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-gray-800 border border-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              Create Account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          {/* Social Proof for Telegram */}
          <p className="text-sm text-gray-500 mb-16">
            <span className="text-blue-400 font-medium">🔥 Get deals 2 hours before Reddit</span> — Join our Telegram for instant alerts
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: '10K+', label: 'Listings tracked' },
              { value: '4', label: 'Marketplaces' },
              { value: '24/7', label: 'Monitoring' },
              { value: '100%', label: 'Free tier' }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Track what you love
            </h2>
            <p className="text-gray-400 text-lg">
              Four verticals, unlimited opportunities
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 transition-all group hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  find deals
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Stop refreshing marketplaces. The Hub does the work for you and alerts you when it matters.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gray-800/80 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Deal Alert</span>
                  <span className="ml-auto text-xs text-gray-500">Just now</span>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Rolex Submariner 114060</span>
                      <span className="text-green-400 text-sm font-medium">-12%</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Price dropped from $9,500 → <span className="text-green-400">$8,350</span>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Jordan 1 Chicago Lost & Found</span>
                      <span className="text-blue-400 text-sm font-medium">Target Hit!</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Your target price of $200 reached on StockX
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Get the weekly digest
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Top deals from the week, market trends, and insider tips. Free forever.
          </p>
          
          <div className="max-w-md mx-auto">
            <EmailCapture 
              source="landing-page"
              variant="inline"
            />
          </div>
        </div>
      </section>

      {/* Telegram CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Free community</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Get deals before everyone else
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
                Our Telegram community gets hot deals <span className="font-bold">2+ hours before they hit Reddit</span>. 
                Real-time alerts. Zero spam.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href={TELEGRAM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" /> Join Telegram Free
                </a>
              </div>
              <p className="text-sm text-blue-100/70 mt-6">
                🔔 Instant alerts • 📊 Price analysis • 💬 Community tips
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-semibold">The Hub</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors flex items-center gap-1">
                <MessageCircle className="w-4 h-4" /> Telegram
              </a>
              <Link to="/blog" className="hover:text-gray-300 transition-colors">
                Blog
              </Link>
              <Link to="/premium" className="hover:text-gray-300 transition-colors">
                Pricing
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 The Hub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Telegram CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 sm:hidden z-50">
        <a 
          href={TELEGRAM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold text-white shadow-lg"
        >
          <MessageCircle className="w-5 h-5" /> Join Telegram - Get Free Alerts
        </a>
      </div>
    </div>
  )
}

export default Landing
