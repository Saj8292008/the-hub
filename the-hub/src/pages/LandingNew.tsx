import React from 'react';
import { Helmet } from 'react-helmet-async';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';
import HeroSection from '../components/landing/HeroSection';
import ProblemSolutionSection from '../components/landing/ProblemSolutionSection';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import PricingSection from '../components/landing/PricingSection';
import SocialProofSection from '../components/landing/SocialProofSection';
import FAQSection from '../components/landing/FAQSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const LandingNew: React.FC = () => {
  const handleEmailSignup = async (email: string): Promise<void> => {
    try {
      // Save email to newsletter (backend will handle storage)
      const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'landing-page',
          subscribed_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        
        // Check for duplicate email
        if (response.status === 409 || errorData.message?.includes('already')) {
          toast.error('This email is already subscribed!');
          return;
        }
        
        throw new Error(errorData.message || 'Failed to subscribe');
      }

      toast.success('🎉 Check your email to confirm!');
    } catch (error) {
      console.error('Email signup error:', error);
      
      // For demo/development: store locally if API fails
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('API not available, storing locally for demo');
        localStorage.setItem(`newsletter_${email}`, JSON.stringify({
          email,
          source: 'landing-page',
          timestamp: new Date().toISOString()
        }));
        toast.success('✓ Signed up! (Demo mode - API not connected)');
        return;
      }
      
      toast.error('Failed to sign up. Please try again.');
      throw error;
    }
  };

  return (
    <>
      <Helmet>
        <title>The Hub - Never Miss a Deal on Watches, Sneakers, Cars & Collectibles</title>
        <meta
          name="description"
          content="Track deals across 20+ marketplaces. Get instant alerts for watches, sneakers, cars & sports collectibles. Stop refreshing, start finding deals. Free tier available."
        />
        <meta
          name="keywords"
          content="watch deals, sneaker deals, car deals, collectibles, price tracking, deal alerts, Rolex, Jordan, StockX, Chrono24"
        />
        <meta property="og:title" content="The Hub - Never Miss a Deal Again" />
        <meta
          property="og:description"
          content="24/7 monitoring of watches, sneakers, cars & collectibles across 20+ marketplaces. Get instant alerts when prices drop."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Hub - Never Miss a Deal Again" />
        <meta
          name="twitter:description"
          content="Track deals across 20+ marketplaces. Instant alerts for watches, sneakers, cars & collectibles."
        />
        <link rel="canonical" href="https://thehub.com" />
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Navigation */}
        <LandingNav />

        {/* Main Content - 8 Sections */}
        <main>
          {/* 1. Hero Section */}
          <HeroSection onEmailSignup={handleEmailSignup} />

          {/* 2. Problem/Solution Section */}
          <ProblemSolutionSection />

          {/* 3. Features Grid */}
          <div id="features">
            <FeaturesGrid />
          </div>

          {/* 4. How It Works */}
          <div id="how-it-works">
            <HowItWorksSection />
          </div>

          {/* 5. Pricing */}
          <div id="pricing">
            <PricingSection />
          </div>

          {/* 6. Social Proof */}
          <SocialProofSection />

          {/* 7. FAQ */}
          <div id="faq">
            <FAQSection />
          </div>

          {/* 8. Final CTA */}
          <div id="signup">
            <FinalCTASection onEmailSignup={handleEmailSignup} />
          </div>
        </main>

        {/* Footer */}
        <LandingFooter />
      </div>
    </>
  );
};

export default LandingNew;
