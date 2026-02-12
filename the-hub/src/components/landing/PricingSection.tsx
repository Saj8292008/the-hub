import React from 'react';
import { PricingPlans } from '../PricingPlans';

const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto">
        <PricingPlans />
      </div>
    </section>
  );
};

export default PricingSection;
