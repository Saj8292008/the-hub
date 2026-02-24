import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Zap, Shield, Bell, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4003';

const Subscribe: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'subscribe-page',
          subscribed_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        if (response.status === 409 || errorData.message?.includes('already')) {
          toast.error('This email is already subscribed!');
          localStorage.setItem('newsletterSubscribed', 'true');
          return;
        }
        throw new Error(errorData.message || 'Failed to subscribe');
      }

      setIsSuccess(true);
      localStorage.setItem('newsletterSubscribed', 'true');
      toast.success('🎉 Welcome to The Hub!');
      setEmail('');
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Subscribe to Deal Alerts - The Hub</title>
        <meta name="description" content="Get daily luxury deal alerts on Rolex, Omega, Nike Dunks, and more. Join smart collectors never overpaying again." />
        <meta property="og:title" content="Subscribe to Deal Alerts - The Hub" />
        <meta property="og:description" content="Join 1,000+ collectors getting daily alerts on the best luxury deals." />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
        {/* Navigation */}
        <nav className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="text-2xl font-bold text-white">
                The Hub
              </Link>
              <Link 
                to="/login" 
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-[#1a8d5f]/10 border border-[#1a8d5f]/20 rounded-full px-4 py-2">
              <Zap size={16} className="text-[#1a8d5f]" />
              <span className="text-sm text-[#1a8d5f] font-medium">1,000+ Subscribers</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-white mb-6 leading-tight">
            Get the Best Luxury Deals <br />
            <span className="text-[#1a8d5f]">Before They're Gone</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Join smart collectors getting daily alerts on Rolex, Omega, Nike, and more — curated from 50+ sources.
          </p>

          {/* Email Form */}
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#141414] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#1a8d5f] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-[#1a8d5f] hover:bg-[#16704d] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSubmitting ? 'Subscribing...' : 'Get Alerts'}
                </button>
              </div>
            </form>
          ) : (
            <div className="max-w-md mx-auto mb-4 p-6 bg-[#1a8d5f]/10 border border-[#1a8d5f]/20 rounded-xl">
              <div className="flex items-center justify-center gap-3 text-[#1a8d5f]">
                <CheckCircle2 size={24} />
                <p className="text-lg font-semibold">You're in! Check your inbox 🔥</p>
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Shield size={16} />
              No spam
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} />
              Unsubscribe anytime
            </span>
            <span className="flex items-center gap-2">
              <Zap size={16} />
              Free forever
            </span>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why Subscribe?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-[#141414] border border-white/10 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-[#1a8d5f]/10 p-4 rounded-full">
                  <Bell className="text-[#1a8d5f]" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Instant Deal Alerts
              </h3>
              <p className="text-gray-400">
                Get notified the moment a hot deal drops below market value. Never miss a steal again.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-[#141414] border border-white/10 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-[#1a8d5f]/10 p-4 rounded-full">
                  <TrendingUp className="text-[#1a8d5f]" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Curated from 50+ Sources
              </h3>
              <p className="text-gray-400">
                We scan thousands of listings daily so you don't have to. Only the best deals make it to your inbox.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-[#141414] border border-white/10 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-[#1a8d5f]/10 p-4 rounded-full">
                  <Zap className="text-[#1a8d5f]" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Save Hours of Research
              </h3>
              <p className="text-gray-400">
                Stop scrolling Reddit, forums, and marketplaces. Get the hottest deals delivered daily.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-center text-white mb-8">
            Trusted by Collectors Worldwide
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
              <p className="text-gray-300 mb-4">
                "Saved $800 on a Tudor Black Bay thanks to The Hub's alert. Best newsletter I'm subscribed to."
              </p>
              <p className="text-sm text-gray-500">
                — Alex M., Watch Collector
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
              <p className="text-gray-300 mb-4">
                "Finally stopped overpaying for sneakers. The Hub finds deals I'd never discover on my own."
              </p>
              <p className="text-sm text-gray-500">
                — Jordan T., Sneakerhead
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
          <div className="bg-gradient-to-br from-[#1a8d5f]/20 to-[#1a8d5f]/5 border border-[#1a8d5f]/20 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Stop Overpaying?
            </h2>
            <p className="text-gray-400 mb-8">
              Join 1,000+ collectors getting the best deals first.
            </p>
            
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-[#141414] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#1a8d5f] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-4 bg-[#1a8d5f] hover:bg-[#16704d] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting ? 'Subscribing...' : 'Subscribe Free'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 bg-[#1a8d5f]/10 border border-[#1a8d5f]/20 rounded-xl">
                <div className="flex items-center justify-center gap-3 text-[#1a8d5f]">
                  <CheckCircle2 size={24} />
                  <p className="text-lg font-semibold">You're all set! Check your inbox.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              <p>© 2026 The Hub. All rights reserved.</p>
              <div className="flex gap-6">
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
                <Link to="/newsletter/unsubscribe" className="hover:text-white transition-colors">
                  Unsubscribe
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Subscribe;
