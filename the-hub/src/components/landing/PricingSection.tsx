import React from 'react';
import { motion } from 'framer-motion';
import { PricingPlans } from '../PricingPlans';
import { fadeInUp, viewportConfig } from '../../utils/animation-config';

const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={fadeInUp}
        >
          <PricingPlans />
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
