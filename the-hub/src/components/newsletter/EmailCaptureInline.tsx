/**
 * Inline Email Capture Component
 * Compact form for mid-article placement
 */

import { useState } from 'react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../../services/blog';

interface EmailCaptureInlineProps {
  headline?: string;
  className?: string;
}

export default function EmailCaptureInline({
  headline = 'Never miss a deal',
  className = ''
}: EmailCaptureInlineProps) {
  const [email, setEmail] = useState('');
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
        source: 'blog_inline'
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

  if (subscribed) {
    return (
      <div className={`my-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center ${className}`}>
        <p className="text-green-400">
          ✓ You're subscribed! Check your inbox for confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className={`my-8 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent p-6 ${className}`}>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-600">
          <Mail className="h-6 w-6 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-semibold text-white">{headline}</h3>
          <p className="text-sm text-gray-400">Weekly alerts + market insights</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:w-64"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? '...' : 'Subscribe'}
          </button>
        </form>
      </div>
    </div>
  );
}
