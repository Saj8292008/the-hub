import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { fadeInUp, scaleInSpring, pulseAnimation } from '../../utils/animation-config';

interface FinalCTASectionProps {
  onEmailSignup: (email: string) => Promise<void>;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onEmailSignup }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    <section className="relative py-32 px-4 overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950/20 to-purple-950/20">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        ></motion.div>
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        ></motion.div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={scaleInSpring}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full mb-8"
          >
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">Join 2,500+ smart collectors</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={fadeInUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Ready to stop{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              missing deals?
            </span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Start tracking your favorite watches, sneakers, and collectibles in 30 seconds. 
            No credit card required.
          </motion.p>

          {/* Email signup form */}
          <motion.div variants={fadeInUp} className="mb-10">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-5 bg-gray-900/50 border border-gray-700 rounded-2xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-10 py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-2xl font-bold text-lg text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 whitespace-nowrap"
                  >
                    {isLoading ? (
                      'Starting...'
                    ) : (
                      <>
                        Get Started Free
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Free forever. No credit card. Cancel anytime.
                </p>
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-xl mx-auto p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      ✓
                    </motion.div>
                  </div>
                </div>
                <p className="text-green-400 font-bold text-xl mb-2">You're all set!</p>
                <p className="text-green-300/70">Check your email to confirm and start tracking deals.</p>
              </motion.div>
            )}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>2,500+ active users</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>$2M+ in deals found</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live monitoring 24/7</span>
            </div>
          </motion.div>

          {/* Secondary CTA */}
          <motion.div variants={fadeInUp} className="mt-12 pt-12 border-t border-gray-800">
            <p className="text-gray-400 mb-4">
              Want to see what deals are live right now?
            </p>
            <a
              href="/deals"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-semibold"
            >
              Browse Active Deals
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;
