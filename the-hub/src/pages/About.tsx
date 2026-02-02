import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { TrendingUp, Bell, Search, Shield, Users, Zap } from 'lucide-react'

export default function About() {
  return (
    <>
      <Helmet>
        <title>About | The Hub - Premium Deal Aggregator</title>
        <meta name="description" content="The Hub is a premium deal aggregator for luxury watches, sneakers, and collectibles. AI-powered deal scoring helps you find the best prices." />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
          <div className="max-w-5xl mx-auto px-6 py-20 relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Find Better Deals.<br />
              <span className="text-emerald-400">Save More Money.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl">
              The Hub aggregates deals from across the web, scores them with AI, 
              and delivers the best opportunities directly to you.
            </p>
          </div>
        </div>

        {/* What We Do */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-white mb-8">What We Do</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Aggregate Deals</h3>
              <p className="text-gray-400">
                We monitor hundreds of sources 24/7 — authorized dealers, resale platforms, 
                flash sales, and private sellers — so you don't have to.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Deal Scoring</h3>
              <p className="text-gray-400">
                Our algorithm analyzes price history, market trends, seller reputation, 
                and demand to score every deal from 1-10. Higher score = better value.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Instant Alerts</h3>
              <p className="text-gray-400">
                Get notified the moment a great deal drops. Email, Telegram, or in-app — 
                your choice. Never miss a deal again.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-Time Data</h3>
              <p className="text-gray-400">
                Prices change fast. Our scrapers run continuously to ensure you're 
                always seeing the most current information.
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-8">What We Track</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="text-4xl mb-3">⌚</div>
              <h3 className="text-lg font-semibold text-white mb-2">Luxury Watches</h3>
              <p className="text-gray-400 text-sm">
                Rolex, Omega, Tudor, Seiko, and more. New, pre-owned, and vintage.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-4xl mb-3">👟</div>
              <h3 className="text-lg font-semibold text-white mb-2">Sneakers</h3>
              <p className="text-gray-400 text-sm">
                Jordan, Nike, Adidas, New Balance. Retail drops and resale market.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-4xl mb-3">🚗</div>
              <h3 className="text-lg font-semibold text-white mb-2">Cars</h3>
              <p className="text-gray-400 text-sm">
                Enthusiast vehicles, classics, and deals on everyday drivers.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Why Trust Us?</h2>
              <p className="text-gray-400 mb-4">
                We're collectors and enthusiasts ourselves. The Hub was built because we were 
                tired of missing deals and overpaying. We don't sell products — we help you 
                find the best prices from trusted sources.
              </p>
              <p className="text-gray-400">
                Our revenue comes from affiliate partnerships with retailers, which means 
                we only succeed when we help you find great deals. Your purchase price is 
                never affected.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-800">
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Better Deals?</h2>
            <p className="text-gray-400 mb-6">
              Join thousands of collectors who use The Hub to save money on their next purchase.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                to="/signup" 
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition"
              >
                Get Started Free
              </Link>
              <a 
                href="https://t.me/hubtest123" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition"
              >
                Join Telegram
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-5xl mx-auto px-6 py-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm text-center">
            © 2026 The Hub. Built for collectors, by collectors.
          </p>
        </div>
      </div>
    </>
  )
}
