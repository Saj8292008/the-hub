import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportConfig } from '../../utils/animation-config';

const SocialProofSection: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Marcus Chen',
      role: 'Watch Collector',
      avatar: '👨‍💼',
      content: 'Found a Speedmaster for 30% below market. The Hub paid for itself 100x over in the first week.',
      rating: 5
    },
    {
      id: 2,
      name: 'Sarah Mitchell',
      role: 'Sneaker Reseller',
      avatar: '👩‍💻',
      content: 'I was spending 3+ hours daily checking StockX and GOAT. Now I get alerts before deals even hit Reddit. Game changer.',
      rating: 5
    },
    {
      id: 3,
      name: 'David Park',
      role: 'Car Enthusiast',
      avatar: '🚗',
      content: 'Snagged a 1995 M3 at auction before it got bidding wars. The early alert made all the difference.',
      rating: 5
    },
    {
      id: 4,
      name: 'Jessica Torres',
      role: 'Sports Memorabilia',
      avatar: '⚾',
      content: 'The price history charts are incredible. I know exactly when to buy and when to wait. No more FOMO purchases.',
      rating: 5
    },
    {
      id: 5,
      name: 'Ryan Cooper',
      role: 'Luxury Watch Dealer',
      avatar: '⌚',
      content: 'As a dealer, time is money. The Hub finds deals faster than my entire team combined. ROI is insane.',
      rating: 5
    },
    {
      id: 6,
      name: 'Emily Zhang',
      role: 'Fashion Collector',
      avatar: '👟',
      content: 'Finally caught that Off-White Nike collab I wanted at retail. The Telegram alerts are instant. Worth every penny.',
      rating: 5
    }
  ];

  const stats = [
    { id: 1, value: 2500, label: 'Active Users', prefix: '', suffix: '+' },
    { id: 2, value: 2000000, label: 'In Deals Found', prefix: '$', suffix: 'M+' },
    { id: 3, value: 50000, label: 'Listings Tracked', prefix: '', suffix: 'K+' },
    { id: 4, value: 4.9, label: 'Average Rating', prefix: '', suffix: '/5' }
  ];

  // Animated counter component
  const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ 
    value, 
    prefix = '', 
    suffix = '' 
  }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);
    const [displayValue, setDisplayValue] = useState('0');

    useEffect(() => {
      const animation = animate(count, value, { 
        duration: 2,
        ease: 'easeOut'
      });

      const unsubscribe = rounded.on('change', (latest) => {
        if (value >= 1000000) {
          setDisplayValue(`${prefix}${(latest / 1000000).toFixed(1)}`);
        } else if (value >= 1000) {
          setDisplayValue(`${prefix}${(latest / 1000).toFixed(0)}`);
        } else if (value < 10) {
          setDisplayValue(`${prefix}${latest.toFixed(1)}`);
        } else {
          setDisplayValue(`${prefix}${latest}`);
        }
      });

      return () => {
        animation.stop();
        unsubscribe();
      };
    }, [value, prefix, count, rounded]);

    return <span>{displayValue}{suffix}</span>;
  };

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
            <span className="inline-block px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium mb-4">
              Social Proof
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Trusted by{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                thousands
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join collectors, dealers, and enthusiasts who are winning deals every day
            </p>
          </motion.div>

          {/* Animated Stats */}
          <motion.div variants={fadeInUp} className="mb-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.id} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    <AnimatedCounter 
                      value={stat.value} 
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className="text-gray-400 text-sm sm:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="h-full p-6 bg-gray-900/80 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all">
                  {/* Quote icon */}
                  <Quote className="w-8 h-8 text-blue-500/20 mb-4" />

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div variants={fadeInUp} className="mt-16 text-center">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Trusted by 2,500+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>4.9/5 average rating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>$2M+ in deals found</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofSection;
