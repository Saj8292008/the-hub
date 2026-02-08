import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users } from 'lucide-react';
import { fadeInUp, fadeInDown, staggerContainer, dealCardFloat } from '../../utils/animation-config';
import type { DealCard } from '../../types/landing.types';

interface HeroSectionProps {
  onEmailSignup: (email: string) => Promise<void>;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onEmailSignup }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mock deal cards for visual effect
  const dealCards: DealCard[] = [
    {
      id: '1',
      title: 'Rolex Submariner',
      brand: 'Rolex',
      image: '/api/placeholder/300/300',
      originalPrice: 12500,
      currentPrice: 10800,
      discount: 14,
      category: 'watch',
      source: 'Chrono24',
      timestamp: new Date()
    },
    {
      id: '2',
      title: 'Jordan 1 Chicago',
      brand: 'Nike',
      image: '/api/placeholder/300/300',
      originalPrice: 450,
      currentPrice: 320,
      discount: 29,
      category: 'sneaker',
      source: 'StockX',
      timestamp: new Date()
    },
    {
      id: '3',
      title: 'Porsche 911 GT3',
      brand: 'Porsche',
      image: '/api/placeholder/300/300',
      originalPrice: 185000,
      currentPrice: 165000,
      discount: 11,
      category: 'car',
      source: 'Bring a Trailer',
      timestamp: new Date()
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    try {
      await onEmailSignup(email);
      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 pt-24 pb-20 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            variants={fadeInDown}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">Track deals across 20+ marketplaces</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Never miss a{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              deal
            </span>
            <br />on what you love
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-xl sm:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto"
          >
            The Hub monitors watches, sneakers, cars & collectibles 24/7. 
            Get instant alerts when prices drop below your target.
          </motion.p>

          {/* Email Signup Form */}
          <motion.div variants={fadeInUp} className="mb-12">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                  >
                    {isLoading ? 'Signing up...' : 'Get Started Free'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  No credit card required. Start tracking deals in 30 seconds.
                </p>
              </form>
            ) : (
              <div className="max-w-md mx-auto p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 font-medium">✓ Check your email to confirm!</p>
              </div>
            )}
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span><strong className="text-white">2,500+</strong> active users</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span><strong className="text-white">$2M+</strong> in deals found</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span><strong className="text-white">4.9/5</strong> rating</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Deal Cards */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {dealCards.map((deal, index) => (
            <motion.div
              key={deal.id}
              {...dealCardFloat(0.5 + index * 0.2)}
              className={`absolute ${
                index === 0 ? 'top-32 left-8' : 
                index === 1 ? 'top-48 right-12' : 
                'bottom-32 left-1/4'
              }`}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="w-64 p-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{deal.title}</h4>
                    <p className="text-xs text-gray-400">{deal.source}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 line-through">
                        ${deal.originalPrice.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-green-400">
                        ${deal.currentPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                      -{deal.discount}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
