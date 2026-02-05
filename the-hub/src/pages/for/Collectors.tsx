/**
 * Collector Segment Landing Page
 * Focus: Custom alerts, rare finds, grail hunting
 * SEO Target: "watch alerts", "sneaker price tracker", "grail finder"
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Zap,
  Heart,
  Bell,
  Search,
  Star,
  Sparkles,
  Shield,
  ArrowRight,
  Check,
  Target,
  Clock,
  Eye,
  Crown,
  MessageCircle,
  TrendingDown
} from 'lucide-react';

const TELEGRAM_LINK = 'https://t.me/hubtest123';

const Collectors: React.FC = () => {
  const painPoints = [
    {
      problem: "Your grail pops up at 3am and sells by sunrise",
      solution: "Instant alerts the moment it's listed - we never sleep"
    },
    {
      problem: "Paying above market because you don't know the real price",
      solution: "90-day price history shows what collectors actually pay"
    },
    {
      problem: "Checking 5 marketplaces daily for one specific piece",
      solution: "One search, all platforms - Reddit, Chrono24, GOAT, and more"
    },
    {
      problem: "Getting beat by bots and professional buyers",
      solution: "Level the playing field with sub-60-second alerts"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Grail Alerts",
      description: "Set up alerts for your exact specs - ref number, year, box/papers, condition. We'll find it.",
      example: "e.g., 'Rolex 1680 Red Sub, 1970-1972, original hands'"
    },
    {
      icon: TrendingDown,
      title: "Price Drop Alerts",
      description: "Get notified when any listing drops price. Catch motivated sellers before anyone else.",
      example: "e.g., 'Alert me when any Speedy drops 10%+'"
    },
    {
      icon: Search,
      title: "Rare Find Detection",
      description: "AI spots undervalued listings, misidentified models, and hidden gems others miss.",
      example: "e.g., 'Seller listed as 16710 but photos show GMT-II'"
    },
    {
      icon: Clock,
      title: "Price History",
      description: "See 90 days of actual sales data across platforms. Know when to buy and what to pay.",
      example: "e.g., 'Submariners dip 8% post-holiday - time to buy'"
    }
  ];

  const grailStories = [
    {
      item: "Rolex 1675 Pepsi",
      story: "Hunted for 2 years. Hub found it on r/watchexchange at 2am - had alert set for 'GMT 1675 pepsi faded'. Seller priced $3K under market.",
      name: "Jason R.",
      location: "Austin, TX",
      savings: "Saved $3,200"
    },
    {
      item: "Jordan 1 Chicago 1985 OG",
      story: "Found a pair in my size (13) listed as 'vintage nike basketball shoes' on a smaller platform. Hub's AI flagged it. Paid $800 for $4K shoes.",
      name: "Marcus W.",
      location: "Chicago, IL",
      savings: "Saved $3,200+"
    },
    {
      item: "Omega Speedy 145.022-69",
      story: "Set price target of $5,500 for a transitional Speedmaster. Hub pinged me when one hit $5,200 OBO. Made an offer, got it for $4,800.",
      name: "David K.",
      location: "Seattle, WA",
      savings: "Under target by $700"
    }
  ];

  const collectorFeatures = [
    "Custom alerts with 20+ filters",
    "Reference number search",
    "Box/papers/service filter",
    "Condition grading alerts",
    "Price target notifications",
    "New listing instant alerts",
    "Seller reputation data",
    "Market trend insights"
  ];

  return (
    <>
      <Helmet>
        <title>The Hub for Collectors | Never Miss Your Grail</title>
        <meta name="description" content="Custom alerts for watch collectors, sneakerheads, and enthusiasts. Track rare pieces across every marketplace. Price history, grail alerts, and instant notifications." />
        <meta name="keywords" content="watch collector alerts, sneaker price tracker, grail alerts, Rolex tracker, vintage watch finder, rare sneaker alerts" />
        <link rel="canonical" href="https://thehub.deals/for/collectors" />
        
        {/* Open Graph */}
        <meta property="og:title" content="The Hub for Collectors | Never Miss Your Grail" />
        <meta property="og:description" content="Custom alerts for rare finds. Price history across marketplaces. Finally catch your grail." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thehub.deals/for/collectors" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Hub for Collectors | Never Miss Your Grail" />
        <meta name="twitter:description" content="Custom alerts for rare finds. Price history across marketplaces. Finally catch your grail." />
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
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
                <Heart className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">Built for collectors & enthusiasts</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Never Miss{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Your Grail
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Custom alerts for the exact piece you're hunting. 
                Every marketplace, every listing, delivered instantly.
              </p>

              {/* Collector Stats */}
              <div className="flex justify-center gap-8 mb-10">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400">847</div>
                  <div className="text-sm text-gray-500">Grails found this month</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400">20+</div>
                  <div className="text-sm text-gray-500">Alert filters</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400">24/7</div>
                  <div className="text-sm text-gray-500">Always watching</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  to="/signup?plan=pro"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                >
                  <Bell className="w-5 h-5" /> Set Up Grail Alerts
                </Link>
                <a 
                  href={TELEGRAM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 bg-gray-800 border border-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Join Free Community
                </a>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                7-day free trial • No credit card required
              </p>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                The collector's dilemma
              </h2>
              <p className="text-gray-400 text-lg">
                We know the hunt. Here's how we make it easier.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {painPoints.map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 mb-3 font-medium">{item.problem}</p>
                      <p className="text-purple-400 text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Tools for serious collectors
              </h2>
              <p className="text-gray-400 text-lg">
                Everything you need to find, track, and acquire
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <div 
                  key={feature.title}
                  className="p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-400 mb-4">{feature.description}</p>
                      <div className="px-3 py-2 bg-gray-900/50 rounded-lg text-sm text-gray-500 italic">
                        {feature.example}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Grail Stories */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-sm text-pink-400">Grail stories</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                The hunt ends here
              </h2>
              <p className="text-gray-400 text-lg">
                Real collectors who finally found their grails
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {grailStories.map((story, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-purple-400">{story.item}</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">"{story.story}"</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div>
                      <div className="font-medium text-sm">{story.name}</div>
                      <div className="text-xs text-gray-500">{story.location}</div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                      {story.savings}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature List */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Built for the obsessed
              </h2>
              <p className="text-gray-400 text-lg">
                Features collectors actually asked for
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {collectorFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-12 text-center">
                <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Your grail is out there. Let us find it.
                </h2>
                <p className="text-lg text-purple-100 mb-8 max-w-xl mx-auto">
                  Set up your first alert in 60 seconds. We'll watch every marketplace 
                  while you live your life.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/signup?plan=pro"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105"
                  >
                    <Bell className="w-5 h-5" /> Start Hunting Free
                  </Link>
                  <Link 
                    to="/premium"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-all"
                  >
                    View Plans <ArrowRight className="w-5 h-5" />
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
                <Link to="/for/resellers" className="hover:text-gray-300 transition-colors">For Resellers</Link>
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

export default Collectors;
