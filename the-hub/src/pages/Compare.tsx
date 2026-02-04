/**
 * Comparison Pages
 * SEO-optimized pages for "The Hub vs X" searches
 */

import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check, X, Zap, Clock, DollarSign, Bell, TrendingUp, Users } from 'lucide-react';
import EmailCaptureHero from '../components/newsletter/EmailCaptureHero';

// Comparison data for each competitor
const comparisons: Record<string, {
  name: string;
  tagline: string;
  description: string;
  logo?: string;
  category: string;
  features: {
    name: string;
    theHub: boolean | string;
    competitor: boolean | string;
    winner: 'hub' | 'competitor' | 'tie';
  }[];
  hubAdvantages: string[];
  competitorAdvantages: string[];
  bestFor: {
    hub: string;
    competitor: string;
  };
  verdict: string;
}> = {
  'watchcharts': {
    name: 'WatchCharts',
    tagline: 'The Hub vs WatchCharts: Which is better for watch deals?',
    description: 'WatchCharts is great for market data. The Hub finds actual deals before they sell out.',
    category: 'watches',
    features: [
      { name: 'Real-time deal alerts', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Price history data', theHub: true, competitor: true, winner: 'tie' },
      { name: 'Multi-source aggregation', theHub: '50+ sources', competitor: 'Limited', winner: 'hub' },
      { name: 'Instant notifications', theHub: 'Telegram/Email/SMS', competitor: 'Email only', winner: 'hub' },
      { name: 'Market valuations', theHub: true, competitor: true, winner: 'tie' },
      { name: 'Deal scoring (AI)', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Sneakers & Cars', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Free tier', theHub: true, competitor: true, winner: 'tie' },
    ],
    hubAdvantages: [
      'Finds underpriced listings before they sell',
      'AI scores deals so you know what\'s actually good',
      'Alerts in seconds, not hours',
      'Covers sneakers and cars too',
    ],
    competitorAdvantages: [
      'Deeper historical price data',
      'More established brand',
      'Reference number database',
    ],
    bestFor: {
      hub: 'Catching deals fast and making money',
      competitor: 'Research and price checking',
    },
    verdict: 'Use WatchCharts to check if a price is good. Use The Hub to find those prices before anyone else.',
  },
  'slickdeals': {
    name: 'Slickdeals',
    tagline: 'The Hub vs Slickdeals: Reseller deals vs consumer deals',
    description: 'Slickdeals is for TVs and toothpaste. The Hub is for Rolexes and Jordans.',
    category: 'deals',
    features: [
      { name: 'Luxury watch deals', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Sneaker deals', theHub: true, competitor: 'Rare', winner: 'hub' },
      { name: 'Car deals', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Consumer electronics', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Profit potential', theHub: '$1K-$50K+', competitor: '$5-$50', winner: 'hub' },
      { name: 'Deal velocity', theHub: 'Real-time', competitor: 'Delayed', winner: 'hub' },
      { name: 'Community voting', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Reseller focus', theHub: true, competitor: false, winner: 'hub' },
    ],
    hubAdvantages: [
      'Deals worth $1,000s, not $10s',
      'Built for resellers and collectors',
      'Real-time alerts (deals sell fast)',
      'Profit-focused scoring',
    ],
    competitorAdvantages: [
      'Great for everyday shopping',
      'Large community',
      'Coupon codes and cashback',
    ],
    bestFor: {
      hub: 'Making real money flipping watches, sneakers, cars',
      competitor: 'Saving $20 on Amazon purchases',
    },
    verdict: 'Different tools for different goals. Slickdeals saves you money. The Hub makes you money.',
  },
  'stockx': {
    name: 'StockX',
    tagline: 'The Hub vs StockX: Marketplace vs Deal Finder',
    description: 'StockX is a marketplace where you buy at market price. The Hub finds deals BELOW market.',
    category: 'sneakers',
    features: [
      { name: 'Find below-market deals', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Authentication', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Buy directly', theHub: 'Links to source', competitor: true, winner: 'competitor' },
      { name: 'Sell platform', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Price data', theHub: true, competitor: true, winner: 'tie' },
      { name: 'Multi-source search', theHub: '50+ sources', competitor: 'StockX only', winner: 'hub' },
      { name: 'Real-time alerts', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Watches & Cars', theHub: true, competitor: 'Watches only', winner: 'hub' },
    ],
    hubAdvantages: [
      'Finds deals across ALL platforms',
      'Alerts when something\'s underpriced',
      'No 10%+ seller fees',
      'Catch arbitrage opportunities',
    ],
    competitorAdvantages: [
      'Built-in authentication',
      'Easy buying/selling',
      'Price guarantee',
    ],
    bestFor: {
      hub: 'Finding arbitrage and underpriced listings',
      competitor: 'Quick, authenticated purchases',
    },
    verdict: 'Use The Hub to find the deal. Use StockX to verify the price. Buy wherever is cheapest.',
  },
  'chrono24': {
    name: 'Chrono24',
    tagline: 'The Hub vs Chrono24: Aggregator vs Marketplace',
    description: 'Chrono24 lists watches at market price. The Hub alerts you when something\'s mispriced.',
    category: 'watches',
    features: [
      { name: 'Find underpriced listings', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Dealer verification', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Escrow service', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Real-time alerts', theHub: true, competitor: 'Basic', winner: 'hub' },
      { name: 'Multi-platform search', theHub: '50+ sources', competitor: 'Chrono24 only', winner: 'hub' },
      { name: 'AI deal scoring', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Response time', theHub: 'Seconds', competitor: 'Hours', winner: 'hub' },
      { name: 'Buyer protection', theHub: false, competitor: true, winner: 'competitor' },
    ],
    hubAdvantages: [
      'Catches mispriced listings instantly',
      'Searches Chrono24 AND 50+ other sources',
      'AI tells you if it\'s actually a good deal',
      'Speed advantage over other buyers',
    ],
    competitorAdvantages: [
      'Buyer protection and escrow',
      'Verified dealers',
      'Huge inventory',
    ],
    bestFor: {
      hub: 'Finding deals before they sell',
      competitor: 'Safe, verified purchases',
    },
    verdict: 'The Hub monitors Chrono24 for you. When we find something good, we tell you first.',
  },
  'goat': {
    name: 'GOAT',
    tagline: 'The Hub vs GOAT: Deal finder vs Marketplace',
    description: 'GOAT sells sneakers at market price. The Hub finds sneakers below market.',
    category: 'sneakers',
    features: [
      { name: 'Below-market deals', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Authentication', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Multi-source search', theHub: '50+ sources', competitor: 'GOAT only', winner: 'hub' },
      { name: 'Real-time alerts', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Used sneakers', theHub: true, competitor: true, winner: 'tie' },
      { name: 'Apparel', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Sell platform', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Watches', theHub: true, competitor: false, winner: 'hub' },
    ],
    hubAdvantages: [
      'Finds deals GOAT buyers miss',
      'Monitors eBay, Facebook, Reddit, etc.',
      'Alerts in seconds',
      'Also tracks watches and cars',
    ],
    competitorAdvantages: [
      'Easy buying experience',
      'Authentication guarantee',
      'Sell your sneakers',
    ],
    bestFor: {
      hub: 'Finding arbitrage opportunities',
      competitor: 'Guaranteed authentic purchases',
    },
    verdict: 'Check GOAT for market price. Use The Hub to find it cheaper somewhere else.',
  },
  'ebay': {
    name: 'eBay',
    tagline: 'The Hub vs eBay: Curated deals vs endless listings',
    description: 'eBay has everything, but finding the deals is a full-time job. We do that job for you.',
    category: 'deals',
    features: [
      { name: 'Curated deals only', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Total inventory', theHub: 'Best of 50+ sources', competitor: '2.4B listings', winner: 'competitor' },
      { name: 'AI deal scoring', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Real-time alerts', theHub: 'Seconds', competitor: 'Manual search', winner: 'hub' },
      { name: 'Buy directly', theHub: 'Links to eBay', competitor: true, winner: 'tie' },
      { name: 'Seller ratings', theHub: 'Shows in alerts', competitor: true, winner: 'tie' },
      { name: 'Price history', theHub: true, competitor: 'Limited', winner: 'hub' },
      { name: 'Buyer protection', theHub: 'Via eBay', competitor: true, winner: 'tie' },
    ],
    hubAdvantages: [
      'We filter 2.4B listings down to actual deals',
      'AI scores every listing for profit potential',
      'Alerts before deals sell (eBay deals go FAST)',
      'Aggregates with 49 other sources',
    ],
    competitorAdvantages: [
      'Massive selection',
      'Buy directly with protection',
      'Auction format for steals',
    ],
    bestFor: {
      hub: 'Finding eBay deals without the endless scrolling',
      competitor: 'When you know exactly what you want',
    },
    verdict: 'eBay is the ocean. The Hub is your fishing guide — we find the catches worth keeping.',
  },
  'bringatrailer': {
    name: 'Bring a Trailer',
    tagline: 'The Hub vs Bring a Trailer: All cars vs auction finds',
    description: 'BaT has great auctions but limited inventory. We monitor BaT plus dealers, forums, and private sales.',
    category: 'cars',
    features: [
      { name: 'Auction format', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Multi-source search', theHub: 'BaT + dealers + forums', competitor: 'BaT only', winner: 'hub' },
      { name: 'Real-time alerts', theHub: true, competitor: 'Email updates', winner: 'hub' },
      { name: 'Price below market', theHub: 'Focus', competitor: 'Market price', winner: 'hub' },
      { name: 'Detailed listings', theHub: 'Links to source', competitor: true, winner: 'competitor' },
      { name: 'Community comments', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Dealer inventory', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Private sales', theHub: true, competitor: false, winner: 'hub' },
    ],
    hubAdvantages: [
      'Monitors BaT AND dealer lots AND private sales',
      'Finds underpriced cars before auctions',
      'Alerts in seconds, not daily emails',
      'AI scores deal quality',
    ],
    competitorAdvantages: [
      'Premium auction experience',
      'Detailed photography and history',
      'Enthusiast community',
    ],
    bestFor: {
      hub: 'Finding deals across ALL car sources',
      competitor: 'Premium auction experience with full history',
    },
    verdict: 'Use BaT for the experience. Use The Hub to find deals BaT sellers might miss.',
  },
  'grailed': {
    name: 'Grailed',
    tagline: 'The Hub vs Grailed: Sneaker deals vs fashion marketplace',
    description: 'Grailed has streetwear, but deals get buried. We surface the underpriced gems instantly.',
    category: 'sneakers',
    features: [
      { name: 'Find underpriced listings', theHub: true, competitor: 'Manual search', winner: 'hub' },
      { name: 'Streetwear focus', theHub: 'Sneakers only', competitor: true, winner: 'competitor' },
      { name: 'Real-time alerts', theHub: true, competitor: false, winner: 'hub' },
      { name: 'Multi-platform', theHub: '50+ sources', competitor: 'Grailed only', winner: 'hub' },
      { name: 'Sell platform', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Negotiate/offers', theHub: 'Via source', competitor: true, winner: 'competitor' },
      { name: 'Designer clothing', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Deal scoring', theHub: true, competitor: false, winner: 'hub' },
    ],
    hubAdvantages: [
      'Surfaces Grailed deals before they sell',
      'AI scores which listings are actually good',
      'Tracks Grailed + eBay + Reddit + more',
      'Instant alerts vs manual searching',
    ],
    competitorAdvantages: [
      'Full streetwear ecosystem',
      'Negotiate directly with sellers',
      'Sell your own items',
    ],
    bestFor: {
      hub: 'Catching underpriced sneaker listings fast',
      competitor: 'Buying and selling all streetwear',
    },
    verdict: 'Grailed is great for browsing. The Hub is for buying before the deal disappears.',
  },
  'cargurus': {
    name: 'CarGurus',
    tagline: 'The Hub vs CarGurus: Deal alerts vs car search',
    description: 'CarGurus helps you search. The Hub alerts you the moment something underpriced appears.',
    category: 'cars',
    features: [
      { name: 'Proactive alerts', theHub: true, competitor: 'Saved searches', winner: 'hub' },
      { name: 'Dealer inventory', theHub: true, competitor: true, winner: 'tie' },
      { name: 'Private sales', theHub: true, competitor: 'Limited', winner: 'hub' },
      { name: 'Deal ratings', theHub: 'AI scoring', competitor: 'Good/Fair/etc', winner: 'tie' },
      { name: 'Multi-source', theHub: '50+ sources', competitor: 'CarGurus only', winner: 'hub' },
      { name: 'Enthusiast cars', theHub: 'Focus', competitor: 'All cars', winner: 'hub' },
      { name: 'Finance tools', theHub: false, competitor: true, winner: 'competitor' },
      { name: 'Response speed', theHub: 'Seconds', competitor: 'Hours', winner: 'hub' },
    ],
    hubAdvantages: [
      'Alerts for Porsches, BMWs, Ferraris specifically',
      'Monitors CarGurus + BaT + forums + private',
      'Catches deals before other buyers see them',
      'Built for enthusiasts, not Camry shoppers',
    ],
    competitorAdvantages: [
      'Great for any car shopping',
      'Finance and insurance tools',
      'Huge dealer network',
    ],
    bestFor: {
      hub: 'Finding enthusiast car deals fast',
      competitor: 'General car shopping with financing',
    },
    verdict: 'CarGurus is for car shopping. The Hub is for car deal hunting.',
  },
};

export default function Compare() {
  const { competitor } = useParams<{ competitor: string }>();
  const data = competitor ? comparisons[competitor.toLowerCase()] : null;

  // If no competitor specified, show comparison index
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>The Hub Comparisons | vs WatchCharts, StockX, Slickdeals & More</title>
          <meta name="description" content="See how The Hub compares to WatchCharts, StockX, Slickdeals, Chrono24, and GOAT. Find out which deal finder is right for you." />
        </Helmet>
        
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-4">How The Hub Compares</h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            See how we stack up against the alternatives
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(comparisons).map(([slug, comp]) => (
              <Link 
                key={slug}
                to={`/compare/${slug}`}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {comp.name[0]}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">The Hub vs {comp.name}</h2>
                    <span className="text-sm text-gray-500 capitalize">{comp.category}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{comp.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hubWins = data.features.filter(f => f.winner === 'hub').length;
  const competitorWins = data.features.filter(f => f.winner === 'competitor').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>The Hub vs {data.name} (2026) | Honest Comparison</title>
        <meta name="description" content={data.tagline} />
        <meta property="og:title" content={`The Hub vs ${data.name} - Which is Better?`} />
        <meta property="og:description" content={data.description} />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
              H
            </div>
            <span className="text-3xl text-gray-400">vs</span>
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-2xl font-bold text-gray-800">
              {data.name[0]}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The Hub vs {data.name}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {data.tagline}
          </p>
        </div>
      </div>

      {/* Quick verdict */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">Quick Verdict</h2>
              <p className="text-gray-600">{data.verdict}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Feature Comparison</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 p-4 font-semibold">
            <div>Feature</div>
            <div className="text-center">The Hub</div>
            <div className="text-center">{data.name}</div>
          </div>
          
          {data.features.map((feature, i) => (
            <div key={i} className={`grid grid-cols-3 p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
              <div className="font-medium">{feature.name}</div>
              <div className="text-center">
                {typeof feature.theHub === 'boolean' ? (
                  feature.theHub ? (
                    <Check className={`w-5 h-5 mx-auto ${feature.winner === 'hub' ? 'text-green-500' : 'text-gray-400'}`} />
                  ) : (
                    <X className="w-5 h-5 mx-auto text-gray-300" />
                  )
                ) : (
                  <span className={feature.winner === 'hub' ? 'text-green-600 font-medium' : ''}>{feature.theHub}</span>
                )}
              </div>
              <div className="text-center">
                {typeof feature.competitor === 'boolean' ? (
                  feature.competitor ? (
                    <Check className={`w-5 h-5 mx-auto ${feature.winner === 'competitor' ? 'text-green-500' : 'text-gray-400'}`} />
                  ) : (
                    <X className="w-5 h-5 mx-auto text-gray-300" />
                  )
                ) : (
                  <span className={feature.winner === 'competitor' ? 'text-green-600 font-medium' : ''}>{feature.competitor}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Score */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-blue-900">Feature Comparison Score:</span>
            <span className="text-blue-900">
              <strong>The Hub {hubWins}</strong> — {competitorWins} {data.name} — {data.features.length - hubWins - competitorWins} Tie
            </span>
          </div>
        </div>
      </div>

      {/* Advantages */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Hub advantages */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold text-lg mb-4 text-green-800">✅ Why Choose The Hub</h3>
            <ul className="space-y-3">
              {data.hubAdvantages.map((adv, i) => (
                <li key={i} className="flex items-start gap-2 text-green-700">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-green-700">
                <strong>Best for:</strong> {data.bestFor.hub}
              </p>
            </div>
          </div>

          {/* Competitor advantages */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-lg mb-4 text-gray-800">✅ Why Choose {data.name}</h3>
            <ul className="space-y-3">
              {data.competitorAdvantages.map((adv, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Best for:</strong> {data.bestFor.competitor}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">The Bottom Line</h2>
          <p className="text-lg text-gray-300 mb-6">{data.verdict}</p>
          
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Use both. Here's how:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <p className="text-gray-300">Set up alerts on <strong>The Hub</strong> for what you're looking for</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <p className="text-gray-300">When we ping you, verify the price on <strong>{data.name}</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <p className="text-gray-300">Buy fast. Profit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to catch deals before {data.name} users?
          </h2>
          <p className="text-blue-100 mb-8">
            Join thousands of resellers who use The Hub to find underpriced watches, sneakers, and cars.
          </p>
          <EmailCaptureHero 
            source={`compare-${competitor}`}
            buttonText="Get Free Alerts"
            placeholder="Enter your email"
            className="max-w-md mx-auto"
          />
        </div>
      </div>

      {/* Other comparisons */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6">Other Comparisons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(comparisons)
            .filter(([slug]) => slug !== competitor?.toLowerCase())
            .map(([slug, comp]) => (
              <Link 
                key={slug}
                to={`/compare/${slug}`}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
              >
                <span className="text-sm font-medium">vs {comp.name}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
