import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Shield 
} from 'lucide-react';
import { fadeInUp, staggerContainer, viewportConfig } from '../../utils/animation-config';

const FeaturesGrid: React.FC = () => {
  const features = [
    {
      id: 1,
      icon: Bell,
      title: 'Real-Time Alerts',
      description: 'Get notified instantly via email, SMS, or Telegram when deals match your criteria. Never miss out.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      icon: Target,
      title: 'Target Pricing',
      description: 'Set your ideal price for any item and we\'ll alert you when it hits. Patience pays off.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      icon: TrendingUp,
      title: 'Price History',
      description: 'See historical pricing data and market trends. Know if it\'s really a good deal.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 4,
      icon: Zap,
      title: 'Deal Scoring',
      description: 'Our AI ranks deals by quality. Focus on the best opportunities, ignore the noise.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 5,
      icon: BarChart3,
      title: 'Multi-Marketplace',
      description: 'Track 20+ sources including Reddit, Chrono24, StockX, GOAT, Bring a Trailer & more.',
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 6,
      icon: Shield,
      title: 'Scam Detection',
      description: 'Automated flagging of suspicious listings. Buy with confidence.',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
        >
          {/* Section Header */}
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                win deals
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful tools that give you an unfair advantage in the marketplace
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color.split(' ')[1]} 0%, ${feature.color.split(' ')[3]} 100%)`
                  }}
                ></div>

                <div className="h-full p-8 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div variants={fadeInUp} className="text-center mt-16">
            <p className="text-gray-400 mb-6">
              Plus: Telegram integration, weekly newsletter, price drop notifications, and more
            </p>
            <a
              href="#signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Start Tracking Deals Free
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
