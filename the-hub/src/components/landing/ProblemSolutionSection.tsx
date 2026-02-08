import React from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, TrendingDown, ArrowRight, CheckCircle } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportConfig } from '../../utils/animation-config';

const ProblemSolutionSection: React.FC = () => {
  const problems = [
    {
      id: 1,
      icon: Clock,
      title: 'Wasting Hours Daily',
      description: 'Manually checking Reddit, Facebook groups, and 10+ marketplaces. Missing deals while you sleep.',
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 2,
      icon: TrendingDown,
      title: 'Paying Too Much',
      description: 'By the time you see a deal on Reddit, it\'s already gone. You end up paying retail or more.',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      id: 3,
      icon: DollarSign,
      title: 'No Price History',
      description: 'Is this really a good deal? No way to know historical pricing or market trends.',
      color: 'from-yellow-500 to-red-500'
    }
  ];

  const solutions = [
    '24/7 automated monitoring across all major marketplaces',
    'Instant alerts via email, SMS, and Telegram when deals match your criteria',
    'Historical price charts and deal scoring algorithm',
    'Get deals 2+ hours before they hit Reddit',
    'Set target prices and get notified automatically',
    'Track your favorite brands, models, and categories'
  ];

  return (
    <section className="py-24 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Problem Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="mb-20"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-4">
              The Problem
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Hunting deals is{' '}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                exhausting
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              You're spending too much time and money. There's a better way.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.id}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    '--tw-gradient-from': '#ef4444',
                    '--tw-gradient-to': '#f97316'
                  } as React.CSSProperties}
                ></div>
                
                <div className="p-8 bg-gray-900/50 border border-gray-800 rounded-2xl h-full hover:border-red-500/50 transition-colors">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${problem.color} flex items-center justify-center mb-6`}>
                    <problem.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{problem.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{problem.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Solution Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
          className="relative"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-3xl blur-3xl"></div>

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <span className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-4">
                The Solution
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Let The Hub do the{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  work for you
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Stop refreshing marketplaces. We monitor everything 24/7 and alert you instantly when deals match your criteria.
              </p>

              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-start gap-3 group"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 group-hover:bg-green-500/30 transition-colors">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors">
                      {solution}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeInUp} className="mt-10">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity group"
                >
                  See Pricing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative">
              {/* Deal Alert Visual */}
              <div className="relative bg-gray-900/80 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">Live Alerts</span>
                  <span className="ml-auto text-xs text-gray-500">Just now</span>
                </div>

                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">Rolex GMT-Master II</span>
                      <span className="text-green-400 text-sm font-bold">-18%</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Price dropped from $18,500 → <span className="text-green-400 font-semibold">$15,200</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">Travis Scott Jordan 1 Low</span>
                      <span className="text-blue-400 text-sm font-bold">Target Hit</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Now available at your target price: <span className="text-blue-400 font-semibold">$450</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">1993 BMW E30 M3</span>
                      <span className="text-purple-400 text-sm font-bold">New Listing</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Rare manual transmission. Well below market at <span className="text-purple-400 font-semibold">$42k</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
