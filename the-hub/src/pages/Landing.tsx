/**
 * Landing Page
 * Hero section, features grid, and CTA to sign up
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingDown,
  Bell,
  Search,
  Zap,
  BarChart3,
  Shield,
  Clock,
  Bot,
  Watch,
  Car,
  Footprints,
  Trophy,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: <TrendingDown className="text-green-400" size={28} />,
      title: 'Track Price Drops',
      description: 'Monitor prices across multiple marketplaces and get notified when prices drop on items you\'re watching.'
    },
    {
      icon: <Bell className="text-purple-400" size={28} />,
      title: 'Instant Alerts',
      description: 'Real-time Telegram notifications the moment a deal matches your criteria. Never miss a steal.'
    },
    {
      icon: <Bot className="text-blue-400" size={28} />,
      title: 'AI Deal Scoring',
      description: 'Our AI analyzes every listing and scores it 0-100 so you know immediately if it\'s a good deal.'
    },
    {
      icon: <Search className="text-amber-400" size={28} />,
      title: 'Smart Search',
      description: 'Natural language search across all categories. Just type "Rolex under $5000" and we\'ll find it.'
    },
    {
      icon: <BarChart3 className="text-cyan-400" size={28} />,
      title: 'Price History',
      description: 'See historical pricing trends so you know if now is the right time to buy.'
    },
    {
      icon: <Shield className="text-emerald-400" size={28} />,
      title: 'Verified Sellers',
      description: 'We prioritize listings from trusted sources and flag potential red flags automatically.'
    }
  ];

  const categories = [
    { icon: <Watch size={32} />, name: 'Watches', count: '50K+', color: 'from-amber-500 to-orange-600' },
    { icon: <Car size={32} />, name: 'Cars', count: '25K+', color: 'from-blue-500 to-cyan-600' },
    { icon: <Footprints size={32} />, name: 'Sneakers', count: '30K+', color: 'from-red-500 to-pink-600' },
    { icon: <Trophy size={32} />, name: 'Sports', count: '15K+', color: 'from-green-500 to-emerald-600' }
  ];

  const stats = [
    { value: '120K+', label: 'Listings Tracked' },
    { value: '$2.3M', label: 'Saved by Users' },
    { value: '15K+', label: 'Active Trackers' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E27]/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold">The Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium px-5 py-2 rounded-lg transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Star className="text-purple-400" size={16} />
            <span className="text-sm text-purple-300">Your Personal Deal Hunter</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Never Overpay for{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Anything
            </span>{' '}
            Again
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
            The Hub tracks prices across marketplaces, scores deals with AI, 
            and alerts you instantly when it's time to buy.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/signup"
              className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25"
            >
              Start Tracking Free
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              to="/premium"
              className="flex items-center gap-2 text-gray-300 hover:text-white font-medium text-lg px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-all"
            >
              View Pricing
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-[#0A0E27] flex items-center justify-center text-xs font-medium"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="ml-2">
              Trusted by <strong className="text-white">10,000+</strong> deal hunters
            </span>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="group relative p-6 bg-gray-800/30 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all cursor-pointer overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10">
                  <div className="text-gray-400 group-hover:text-white transition-colors mb-3">
                    {cat.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{cat.name}</h3>
                  <p className="text-2xl font-bold text-purple-400">{cat.count}</p>
                  <p className="text-sm text-gray-500">listings tracked</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Score Deals
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From AI-powered analysis to real-time alerts, we've got your back
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 bg-gray-800/30 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Three simple steps to never miss a deal</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Track What You Want',
                description: 'Add items to your watchlist or set up custom searches. Track watches, cars, sneakers, and more.',
                icon: <Search size={24} />
              },
              {
                step: '2',
                title: 'We Scan 24/7',
                description: 'Our scrapers monitor dozens of marketplaces around the clock, scoring every listing with AI.',
                icon: <Clock size={24} />
              },
              {
                step: '3',
                title: 'Get Instant Alerts',
                description: 'When a deal matches your criteria, you get a Telegram notification in seconds. Snag it before anyone else.',
                icon: <Zap size={24} />
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <div className="pt-8 pl-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-purple-400 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Trust */}
      <section className="py-20 px-4 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-3xl border border-purple-500/20 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Join Thousands of Smart Buyers
                </h2>
                <p className="text-gray-400 mb-6">
                  Whether you're hunting for a Rolex, a classic car, or limited sneakers, 
                  The Hub gives you the edge. Our users save an average of <strong className="text-white">23%</strong> on their purchases.
                </p>
                <ul className="space-y-3">
                  {[
                    'AI-scored deals so you know it\'s legit',
                    'Alerts faster than refresh-spamming',
                    'Price history to time your purchase',
                    'No more FOMO on limited drops'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  $2.3M+
                </div>
                <div className="text-xl text-gray-400">Saved by our users</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Saving?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Create your free account and set up your first tracker in under 60 seconds.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg px-10 py-5 rounded-xl transition-all shadow-lg shadow-purple-500/25"
          >
            Get Started — It's Free
            <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-gray-500 text-sm">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold">The Hub</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link to="/premium" className="hover:text-white transition-colors">Pricing</Link>
              <a href="mailto:support@thehub.deals" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} The Hub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
