/**
 * Email Capture Form Component
 * Newsletter subscription form for blog posts
 */

import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../../services/blog';

interface EmailCaptureFormProps {
  source: string;
  title?: string;
  description?: string;
  compact?: boolean;
}

export default function EmailCaptureForm({
  source,
  title = 'Stay updated',
  description = 'Get the latest market insights delivered to your inbox.',
  compact = false
}: EmailCaptureFormProps) {
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
        source
      });

      setSubscribed(true);
      toast.success('Successfully subscribed to newsletter!');
      setEmail('');
      setName('');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h3 className="mb-2 text-lg font-semibold text-white">
          You're all set!
        </h3>
        <p className="text-sm text-gray-400">
          Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-purple-500/10 to-gray-900/50 p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Subscribing...' : 'Subscribe Now'}
        </button>

        <p className="text-center text-xs text-gray-500">
          No spam. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
}
