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
                Get the Deal Hunter's Playbook — Free
              </h2>
              <p className="text-xl text-gray-400">
                50 expert tips to never overpay again. Plus weekly deal alerts for watches, sneakers & cars.
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-green-600/20">
                    <span className="text-green-400 text-sm font-bold">✓</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Free 50-tip playbook</h4>
                  <p className="text-xs text-gray-400">Watches, sneakers & cars</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-green-600/20">
                    <span className="text-green-400 text-sm font-bold">✓</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Weekly deal alerts</h4>
                  <p className="text-xs text-gray-400">Best deals, delivered Friday</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-green-600/20">
                    <span className="text-green-400 text-sm font-bold">✓</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Price drop notifications</h4>
                  <p className="text-xs text-gray-400">Track your grails</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-green-600/20">
                    <span className="text-green-400 text-sm font-bold">✓</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Early access to hot deals</h4>
                  <p className="text-xs text-gray-400">Be first in line</p>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>✓ No spam, ever</span>
              <span>✓ Unsubscribe anytime</span>
              <span>✓ Real deals, real value</span>
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
            <p className="text-xl text-gray-400 mb-6">
              Check your email to confirm your subscription.
            </p>
            
            {/* Download CTA */}
            <div className="bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl p-6 mb-6">
              <h4 className="text-xl font-bold text-white mb-3">
                Your Deal Hunter's Playbook is Ready 📚
              </h4>
              <p className="text-white/90 mb-4">
                50 expert tips to never overpay for watches, sneakers & cars
              </p>
              <a
                href="/guides/deal-hunters-playbook.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-purple-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Download Your Free Playbook →
              </a>
            </div>

            <p className="text-gray-500">
              Your first newsletter arrives this Friday at 9am EST!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
