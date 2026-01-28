/**
 * Email Capture Sidebar Component
 * Sticky sidebar widget for category pages
 */

import { useState } from 'react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../../services/blog';

interface EmailCaptureSidebarProps {
  category?: string;
  headline?: string;
}

export default function EmailCaptureSidebar({
  category = 'all',
  headline
}: EmailCaptureSidebarProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const getCategoryHeadline = () => {
    if (headline) return headline;

    const categoryHeadlines: Record<string, string> = {
      watches: 'Get Watch Deal Alerts',
      cars: 'Get Car Deal Alerts',
      sneakers: 'Get Sneaker Deal Alerts',
      sports: 'Get Sports Deal Alerts',
      all: 'Get Weekly Deal Alerts'
    };

    return categoryHeadlines[category] || categoryHeadlines.all;
  };

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
        source: `${category}_sidebar`,
        preferences: {
          categories: category !== 'all' ? [category] : []
        }
      });

      setSubscribed(true);
      setEmail('');
      toast.success('Subscribed! Check your email to confirm.');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-24 rounded-2xl border border-gray-800 bg-gradient-to-br from-purple-600/10 to-gray-900 p-6">
      {!subscribed ? (
        <>
          {/* Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600">
            <Mail className="h-7 w-7 text-white" />
          </div>

          {/* Headline */}
          <h3 className="mb-2 text-xl font-bold text-white">
            {getCategoryHeadline()}
          </h3>
          <p className="mb-4 text-sm text-gray-400">
            Weekly insights and top deals delivered to your inbox
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Subscribing...' : 'Subscribe Free'}
            </button>
          </form>

          {/* Trust indicators */}
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <p>✓ Free forever</p>
            <p>✓ No spam, ever</p>
            <p>✓ Unsubscribe anytime</p>
          </div>
        </>
      ) : (
        // Success state
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h4 className="mb-1 font-semibold text-white">Subscribed! 🎉</h4>
          <p className="text-xs text-gray-400">
            Check your email to confirm
          </p>
        </div>
      )}
    </div>
  );
}
