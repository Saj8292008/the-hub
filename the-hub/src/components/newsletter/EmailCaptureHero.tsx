/**
 * Email Capture Hero Component
 * Large, prominent section for homepage
 */

import { useState } from 'react';
import { Mail, TrendingUp, Bell, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../../services/blog';

export default function EmailCaptureHero() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await blogService.subscribe({
        email,
        name: name || undefined,
        source: 'homepage_hero'
      });

      setSubscribed(true);
      toast.success('Successfully subscribed! Check your email to confirm.');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-purple-600/20 via-gray-900 to-gray-900 p-8 md:p-12">
      <div className="mx-auto max-w-3xl">
        {!subscribed ? (
          <>
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-600">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-4 text-4xl font-bold text-white">
                Track Prices Like a Pro
              </h2>
              <p className="text-xl text-gray-400">
                Join 500+ subscribers getting weekly deal alerts, market insights, and exclusive content
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={loading}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-purple-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50 md:w-auto"
                >
                  {loading ? 'Subscribing...' : 'Get Started Free'}
                </button>
              </div>
            </form>

            {/* Features */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="mb-1 font-semibold text-white">Top Deals</h3>
                <p className="text-sm text-gray-400">
                  AI-scored deals across watches, cars, sneakers & more
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                  <Bell className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="mb-1 font-semibold text-white">Weekly Alerts</h3>
                <p className="text-sm text-gray-400">
                  Never miss a great deal - delivered every Friday
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="mb-1 font-semibold text-white">Expert Insights</h3>
                <p className="text-sm text-gray-400">
                  Market trends, price analysis, and buying guides
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>✓ 500+ subscribers</span>
              <span>✓ No spam, ever</span>
              <span>✓ Unsubscribe anytime</span>
            </div>
          </>
        ) : (
          // Success state
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-600">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">
              You're All Set! 🎉
            </h3>
            <p className="text-xl text-gray-400">
              Check your email to confirm your subscription.
            </p>
            <p className="mt-4 text-gray-500">
              Your first newsletter arrives this Friday at 9am EST!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
