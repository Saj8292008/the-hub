import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportConfig, accordionVariants } from '../../utils/animation-config';

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      id: 1,
      question: 'How does The Hub find deals?',
      answer: 'We use automated scrapers and APIs to monitor 20+ marketplaces including Reddit, eBay, StockX, GOAT, Chrono24, Facebook Marketplace, Bring a Trailer, and more. Our system checks prices 24/7 and applies our deal-scoring algorithm to surface the best opportunities.'
    },
    {
      id: 2,
      question: 'What types of items can I track?',
      answer: 'We currently support watches (luxury, vintage, sports), sneakers (all major brands and releases), cars (enthusiast vehicles, classics, exotics), and sports collectibles (cards, memorabilia, jerseys). More categories coming soon!'
    },
    {
      id: 3,
      question: 'How fast are the alerts?',
      answer: 'Real-time. The moment a deal matching your criteria is found, you get notified via your preferred channel (email, SMS, Telegram). Our users typically get alerts 2-3 hours before deals hit Reddit or mainstream forums.'
    },
    {
      id: 4,
      question: 'Can I set specific price targets?',
      answer: 'Absolutely! You can set target prices for specific items, brands, or categories. When a listing hits or drops below your target, you\'ll get an immediate alert. This is perfect for patient buyers who know exactly what they want to pay.'
    },
    {
      id: 5,
      question: 'Is there a free plan?',
      answer: 'Yes! Our free tier includes email alerts, access to the weekly newsletter, and tracking up to 5 items. Premium plans unlock SMS/Telegram alerts, unlimited tracking, price history charts, and priority support.'
    },
    {
      id: 6,
      question: 'How accurate is the deal scoring?',
      answer: 'Our AI analyzes historical pricing data, market trends, seller reputation, and condition to assign each deal a quality score. We factor in seasonality, demand patterns, and comparable sales. The algorithm improves continuously as it processes more data.'
    },
    {
      id: 7,
      question: 'Do you track international marketplaces?',
      answer: 'We primarily focus on US marketplaces, but we do monitor some international sources for watches (like Chrono24 Europe) and cars. International expansion is on our roadmap for 2026.'
    },
    {
      id: 8,
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees. If you cancel, you\'ll retain access until the end of your current billing period.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 px-4 bg-gray-950">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
        >
          {/* Section Header */}
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-4">
              FAQ
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Questions?{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                We've got answers
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about The Hub
            </p>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div variants={staggerContainer} className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                variants={fadeInUp}
                className="border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left bg-gray-900/50 hover:bg-gray-900 transition-colors"
                >
                  <span className="font-semibold text-white pr-8">{faq.question}</span>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      variants={accordionVariants}
                    >
                      <div className="px-6 py-5 bg-gray-900/30 border-t border-gray-800">
                        <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact CTA */}
          <motion.div variants={fadeInUp} className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <a
              href="mailto:support@thehub.com"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Contact our support team →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
