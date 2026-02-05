/**
 * Dealer Segment Landing Page
 * Focus: API, bulk tools, data, inventory sourcing
 * SEO Target: "dealer inventory tools", "watch sourcing API", "bulk price data"
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Zap,
  Building2,
  Database,
  Code,
  ArrowRight,
  Check,
  Download,
  BarChart3,
  Layers,
  Shield,
  Cpu,
  FileJson,
  RefreshCw,
  Clock,
  DollarSign,
  MessageCircle,
  Users
} from 'lucide-react';

const TELEGRAM_LINK = 'https://t.me/hubtest123';

const Dealers: React.FC = () => {
  const painPoints = [
    {
      problem: "Manually checking dozens of sources daily",
      solution: "One dashboard, all marketplaces. Real-time aggregation."
    },
    {
      problem: "Pricing inventory based on gut feeling",
      solution: "Data-driven pricing with 90-day market trends across platforms"
    },
    {
      problem: "Missing good sourcing opportunities",
      solution: "Bulk alerts for inventory that matches your buy criteria"
    },
    {
      problem: "No API access to marketplace data",
      solution: "Full REST API with webhooks for custom integrations"
    }
  ];

  const features = [
    {
      icon: Code,
      title: "REST API Access",
      description: "Full programmatic access to listing data, price history, and alerts. Build custom tools on top of our data.",
      endpoints: "listings, prices, alerts, webhooks"
    },
    {
      icon: Database,
      title: "Bulk Data Export",
      description: "Download CSV/JSON exports of historical data for analysis. Perfect for pricing models and market research.",
      endpoints: "90-day history, all categories"
    },
    {
      icon: RefreshCw,
      title: "Webhook Notifications",
      description: "Push notifications to your systems when inventory matches your criteria. Integrate with your CRM or inventory system.",
      endpoints: "Slack, Discord, custom endpoints"
    },
    {
      icon: BarChart3,
      title: "Market Analytics",
      description: "Aggregate market data across platforms. Track price trends, sell-through rates, and inventory velocity.",
      endpoints: "Trends, velocity, pricing insights"
    }
  ];

  const apiExample = `// Example: Set up a webhook for inventory alerts
const response = await fetch('https://api.thehub.deals/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event: 'listing.match',
    criteria: {
      brand: 'Rolex',
      maxPrice: 8000,
      condition: ['excellent', 'mint']
    },
    url: 'https://yoursite.com/webhooks/hub'
  })
});`;

  const useCases = [
    {
      title: "Watch Dealers",
      description: "Source pre-owned inventory smarter. Get alerts when pieces match your buy box, export data for pricing, integrate with your inventory system.",
      stat: "40+ dealers",
      icon: Clock
    },
    {
      title: "Sneaker Stores",
      description: "Track resale prices to inform retail pricing. Monitor secondary market to understand demand. Source deadstock from individuals.",
      stat: "12 stores",
      icon: Layers
    },
    {
      title: "Consignment Shops",
      description: "Price consigned items accurately with market data. Alert customers when their items hit price targets. Automate sourcing.",
      stat: "25 shops",
      icon: DollarSign
    }
  ];

  const enterpriseFeatures = [
    { feature: "API calls/month", value: "100K+" },
    { feature: "Webhook endpoints", value: "Unlimited" },
    { feature: "Data retention", value: "1 year" },
    { feature: "Export formats", value: "CSV, JSON, Excel" },
    { feature: "Rate limits", value: "100/min" },
    { feature: "Support", value: "Priority + Slack" }
  ];

  const integrations = [
    "Shopify", "WooCommerce", "Lightspeed", "Slack", "Discord", 
    "Airtable", "Google Sheets", "Zapier", "Custom Webhooks"
  ];

  return (
    <>
      <Helmet>
        <title>The Hub for Dealers | Source Inventory Smarter</title>
        <meta name="description" content="API access, bulk data exports, and market analytics for watch dealers, sneaker stores, and consignment shops. Source inventory smarter with real-time marketplace data." />
        <meta name="keywords" content="dealer inventory tools, watch sourcing API, bulk price data, market analytics, inventory sourcing, dealer software" />
        <link rel="canonical" href="https://thehub.deals/for/dealers" />
        
        {/* Open Graph */}
        <meta property="og:title" content="The Hub for Dealers | Source Inventory Smarter" />
        <meta property="og:description" content="API access, bulk exports, and market analytics for dealers. Source inventory with data, not guesswork." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thehub.deals/for/dealers" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Hub for Dealers | Source Inventory Smarter" />
        <meta name="twitter:description" content="API access, bulk exports, and market analytics for dealers. Source inventory with data, not guesswork." />
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
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Get API Access
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">Built for dealers & businesses</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Source Inventory{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Smarter
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                API access, bulk data exports, and market analytics. 
                Stop guessing, start sourcing with data.
              </p>

              {/* Business Stats */}
              <div className="flex justify-center gap-8 mb-10">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400">100K+</div>
                  <div className="text-sm text-gray-500">API calls/month</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400">80+</div>
                  <div className="text-sm text-gray-500">Business accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400">$2M+</div>
                  <div className="text-sm text-gray-500">Inventory sourced/mo</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  to="/signup?plan=premium"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <Code className="w-5 h-5" /> Get API Access
                </Link>
                <a 
                  href="mailto:enterprise@thehub.deals"
                  className="w-full sm:w-auto px-8 py-4 bg-gray-800 border border-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" /> Talk to Sales
                </a>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                14-day free trial • No credit card for trial
              </p>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                The dealer's challenge
              </h2>
              <p className="text-gray-400 text-lg">
                Running a business on manual research doesn't scale
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {painPoints.map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 mb-3 font-medium">{item.problem}</p>
                      <p className="text-blue-400 text-sm flex items-center gap-2">
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
                Enterprise-grade tools
              </h2>
              <p className="text-gray-400 text-lg">
                Build your sourcing workflow with our infrastructure
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <div 
                  key={feature.title}
                  className="p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-400 mb-4">{feature.description}</p>
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <FileJson className="w-4 h-4" />
                        <span>{feature.endpoints}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Example */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Simple, powerful API
              </h2>
              <p className="text-gray-400 text-lg">
                Integrate in minutes, not weeks
              </p>
            </div>

            <div className="rounded-2xl bg-gray-900 border border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-sm text-gray-400 font-mono">webhook-example.js</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm">
                <code className="text-gray-300 font-mono whitespace-pre">{apiExample}</code>
              </pre>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link 
                to="/docs/api"
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" /> View API Docs
              </Link>
              <a 
                href="https://github.com/thehub/examples"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center gap-2"
              >
                <Code className="w-4 h-4" /> Code Examples
              </a>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Built for your business
              </h2>
              <p className="text-gray-400 text-lg">
                Dealers across verticals trust The Hub
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {useCases.map((useCase, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    <useCase.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{useCase.description}</p>
                  <div className="text-blue-400 text-sm font-medium">{useCase.stat} using Hub</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Integrates with your stack
            </h2>
            <p className="text-gray-400 text-lg mb-12">
              Connect The Hub to the tools you already use
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {integrations.map((integration, i) => (
                <div 
                  key={i}
                  className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 text-sm"
                >
                  {integration}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise Features Table */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Premium plan includes
              </h2>
              <p className="text-gray-400 text-lg">
                Everything you need to scale your sourcing
              </p>
            </div>

            <div className="rounded-2xl bg-gray-800/50 border border-gray-700/50 overflow-hidden">
              {enterpriseFeatures.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex justify-between items-center p-4 ${i !== enterpriseFeatures.length - 1 ? 'border-b border-gray-700/50' : ''}`}
                >
                  <span className="text-gray-400">{item.feature}</span>
                  <span className="text-blue-400 font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm mb-4">
                Need more? We offer custom enterprise plans.
              </p>
              <a 
                href="mailto:enterprise@thehub.deals"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Contact us for enterprise pricing →
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to scale your sourcing?
                </h2>
                <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
                  Join 80+ dealers using The Hub to source <span className="font-bold">$2M+ in inventory</span> every month.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/signup?plan=premium"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105"
                  >
                    <Code className="w-5 h-5" /> Start Free Trial
                  </Link>
                  <a 
                    href="mailto:enterprise@thehub.deals"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all"
                  >
                    Talk to Sales <ArrowRight className="w-5 h-5" />
                  </a>
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
                <Link to="/for/collectors" className="hover:text-gray-300 transition-colors">For Collectors</Link>
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

export default Dealers;
