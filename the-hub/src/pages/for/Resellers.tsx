/**
 * Reseller Segment Landing Page
 * Focus: Speed, profit margins, competitive edge
 * SEO Target: "reseller deal alerts", "flip tracking software"
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  Bell,
  BarChart3,
  ArrowRight,
  Check,
  Timer,
  Rocket,
  Target,
  ChevronRight,
  Star,
  MessageCircle
} from 'lucide-react';

const TELEGRAM_LINK = 'https://t.me/hubtest123';

const Resellers: React.FC = () => {
  const painPoints = [
    {
      problem: "Deals sell out before you even see them",
      solution: "Get alerts in under 60 seconds - faster than any Discord or Twitter"
    },
    {
      problem: "Spending hours refreshing marketplaces",
      solution: "24/7 automated monitoring while you focus on selling"
    },
    {
      problem: "Leaving money on the table with bad pricing",
      solution: "AI-powered deal scores show exact profit potential"
    },
    {
      problem: "Missing restocks and price drops",
      solution: "Custom alerts on your terms - price thresholds, keywords, sizes"
    }
  ];

  const features = [
    {
      icon: Timer,
      title: "60-Second Alerts",
      description: "Our scrapers run every minute. You'll know about deals before they hit Reddit or Discord.",
      stat: "< 60s",
      statLabel: "Average alert time"
    },
    {
      icon: Target,
      title: "Profit Calculator",
      description: "Instant ROI estimates factoring in fees, shipping, and market prices. Know your margins before you buy.",
      stat: "32%",
      statLabel: "Avg. profit on flagged deals"
    },
    {
      icon: BarChart3,
      title: "Price History",
      description: "90-day price charts across all marketplaces. Spot trends, avoid overpaying, time your sales.",
      stat: "90 days",
      statLabel: "Historical data"
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Telegram, email, or push. Filter by brand, model, price range, and condition.",
      stat: "Unlimited",
      statLabel: "Custom alerts"
    }
  ];

  const testimonials = [
    {
      quote: "I flipped 3 watches in my first week using Hub alerts. The speed advantage is insane.",
      name: "Marcus T.",
      role: "Watch reseller, 2 years",
      profit: "$2,400 profit"
    },
    {
      quote: "Used to spend 4 hours a day on Reddit. Now I just wait for the ping and pull the trigger.",
      name: "DeShawn K.",
      role: "Full-time sneaker reseller",
      profit: "$8K/month volume"
    },
    {
      quote: "The deal scoring is clutch. Tells me exactly what I can flip vs what'll sit in my closet.",
      name: "Ashley M.",
      role: "Side hustle seller",
      profit: "300% ROI avg"
    }
  ];

  const comparisonTable = [
    { feature: "Alert Speed", hub: "< 60 seconds", others: "5-15 minutes" },
    { feature: "Profit Estimates", hub: "✓ Built-in", others: "Manual calc" },
    { feature: "Multi-marketplace", hub: "4 verticals", others: "Usually 1" },
    { feature: "Price History", hub: "90 days", others: "None or 30d" },
    { feature: "Deal Scoring", hub: "AI-powered", others: "None" }
  ];

  return (
    <>
      <Helmet>
        <title>The Hub for Resellers | Find Deals Before They Sell Out</title>
        <meta name="description" content="Get deal alerts in under 60 seconds. AI-powered profit estimates, price history, and smart filters. The fastest way to find and flip watches, sneakers, and more." />
        <meta name="keywords" content="reseller tools, flip tracker, deal alerts, sneaker reselling, watch flipping, profit calculator, resale software" />
        <link rel="canonical" href="https://thehub.deals/for/resellers" />
        
        {/* Open Graph */}
        <meta property="og:title" content="The Hub for Resellers | Find Deals Before They Sell Out" />
        <meta property="og:description" content="60-second deal alerts. AI profit estimates. The unfair advantage resellers need." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thehub.deals/for/resellers" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Hub for Resellers | Find Deals Before They Sell Out" />
        <meta name="twitter:description" content="60-second deal alerts. AI profit estimates. The unfair advantage resellers need." />
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Nav */}
        <nav className="border-b border-gray-800/50 backdrop-blur-sm fixed top-0 w-full z-50 bg-gray-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold">The Hub</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link 
                  to="/premium" 
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Segment Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-8">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Built for resellers & flippers</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Find Deals{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Before They Sell Out
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Get alerts in under 60 seconds. See instant profit estimates. 
                Stop refreshing and start selling.
              </p>

              {/* Speed Stat */}
              <div className="flex justify-center gap-8 mb-10">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">&lt;60s</div>
                  <div className="text-sm text-gray-500">Alert Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">32%</div>
                  <div className="text-sm text-gray-500">Avg. Profit Margin</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">10K+</div>
                  <div className="text-sm text-gray-500">Deals/Week</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  to="/signup?plan=pro"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                >
                  <Rocket className="w-5 h-5" /> Start 7-Day Free Trial
                </Link>
                <a 
                  href={TELEGRAM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 bg-gray-800 border border-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Try Free Alerts First
                </a>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* Pain Points → Solutions */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Sound familiar?
              </h2>
              <p className="text-gray-400 text-lg">
                Every reseller's been there. Here's how The Hub fixes it.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {painPoints.map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-red-400">✗</span>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-3">{item.problem}</p>
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-green-400" />
                        <p className="text-green-400 font-medium">{item.solution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Your unfair advantage
              </h2>
              <p className="text-gray-400 text-lg">
                Everything you need to find, evaluate, and flip faster
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div 
                  key={feature.title}
                  className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-green-500/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-2xl font-bold text-green-400">{feature.stat}</div>
                    <div className="text-xs text-gray-500">{feature.statLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Real resellers, real profits
              </h2>
              <p className="text-gray-400 text-lg">
                Join hundreds making money with The Hub
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6">"{t.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.role}</div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                      {t.profit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Why resellers choose The Hub
              </h2>
              <p className="text-gray-400 text-lg">
                Speed and data that free tools can't match
              </p>
            </div>

            <div className="rounded-2xl bg-gray-800/50 border border-gray-700/50 overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800 font-medium">
                <div>Feature</div>
                <div className="text-green-400">The Hub</div>
                <div className="text-gray-500">Others</div>
              </div>
              {comparisonTable.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 p-4 border-t border-gray-700/50">
                  <div className="text-gray-400">{row.feature}</div>
                  <div className="text-green-400 font-medium">{row.hub}</div>
                  <div className="text-gray-500">{row.others}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Stop missing deals. Start stacking profits.
                </h2>
                <p className="text-lg text-green-100 mb-8 max-w-xl mx-auto">
                  Join resellers making <span className="font-bold">$2K-$10K/month</span> with Hub alerts. 
                  7-day free trial, no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/signup?plan=pro"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105"
                  >
                    <Rocket className="w-5 h-5" /> Start Free Trial
                  </Link>
                  <Link 
                    to="/premium"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-all"
                  >
                    View Pricing <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-semibold">The Hub</span>
              </Link>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link to="/for/collectors" className="hover:text-gray-300 transition-colors">For Collectors</Link>
                <Link to="/for/dealers" className="hover:text-gray-300 transition-colors">For Dealers</Link>
                <Link to="/premium" className="hover:text-gray-300 transition-colors">Pricing</Link>
              </div>
              <div className="text-sm text-gray-500">
                © 2026 The Hub. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Resellers;
