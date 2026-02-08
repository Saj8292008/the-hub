import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, ShoppingBag, ArrowRight } from 'lucide-react';
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, viewportConfig } from '../../utils/animation-config';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: 1,
      icon: Search,
      title: 'Set Your Targets',
      description: 'Tell us what you\'re looking for. Specific models, brands, or categories. Set your ideal price range.',
      color: 'from-blue-500 to-cyan-500',
      image: '🎯'
    },
    {
      step: 2,
      icon: Bell,
      title: 'We Monitor Everything',
      description: 'Our system scans 20+ marketplaces 24/7. Reddit, eBay, StockX, Chrono24, Facebook - we check them all.',
      color: 'from-purple-500 to-pink-500',
      image: '🔍'
    },
    {
      step: 3,
      icon: ShoppingBag,
      title: 'Get Instant Alerts',
      description: 'When a deal matches your criteria, you get notified immediately. React fast and secure the deal.',
      color: 'from-green-500 to-emerald-500',
      image: '⚡'
    }
  ];

  return (
    <section className="py-24 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
        >
          {/* Section Header */}
          <motion.div variants={fadeInUp} className="text-center mb-20">
            <span className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-4">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Start finding deals in{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              No complex setup. No learning curve. Just instant value.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-20 -translate-y-1/2 z-0"></div>

            <div className="grid lg:grid-cols-3 gap-12 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  variants={index === 0 ? fadeInLeft : index === 2 ? fadeInRight : fadeInUp}
                  className="relative"
                >
                  {/* Step card */}
                  <div className="relative group">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-2xl -z-10"
                      style={{
                        background: `linear-gradient(135deg, ${step.color.split(' ')[1]} 0%, ${step.color.split(' ')[3]} 100%)`
                      }}
                    ></div>

                    <div className="p-8 bg-gray-900/80 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all h-full">
                      {/* Step number */}
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform`}>
                          {step.step}
                        </div>
                        <div className="text-6xl">{step.image}</div>
                      </div>

                      {/* Content */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-4`}>
                        <step.icon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Arrow between steps (desktop only) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                      <ArrowRight className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Timeline visualization (mobile) */}
          <div className="lg:hidden mt-12 flex flex-col items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.step}>
                {index > 0 && (
                  <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500 opacity-30"></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div variants={fadeInUp} className="text-center mt-16">
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <a
                href="#signup"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Get Started in 30 Seconds
              </a>
              <a
                href="#pricing"
                className="px-8 py-4 bg-gray-800 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                View Pricing
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
