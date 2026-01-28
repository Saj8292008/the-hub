/**
 * Newsletter Unsubscribe Page
 * Public page for unsubscribing from newsletter
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import newsletterService from '../services/newsletter';

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!email || !token) {
      setError('Invalid unsubscribe link. Please check your email for the correct link.');
    }
  }, [email, token]);

  const handleUnsubscribe = async () => {
    if (!email || !token) {
      return;
    }

    try {
      setLoading(true);
      await newsletterService.unsubscribe(email, token, reason || undefined);
      setSuccess(true);
      toast.success('Successfully unsubscribed');
    } catch (err: any) {
      console.error('Unsubscribe failed:', err);
      setError(err.message || 'Failed to unsubscribe. Please try again.');
      toast.error('Failed to unsubscribe');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>

          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">You're Unsubscribed</h1>
            <p className="text-gray-400">
              We've removed <span className="font-semibold text-white">{email}</span> from our newsletter list.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <p className="mb-4 text-sm text-gray-400">
              We're sorry to see you go! You won't receive any more newsletters from us.
            </p>
            <p className="text-sm text-gray-400">
              Changed your mind? You can always subscribe again from our blog.
            </p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          >
            <Mail className="h-4 w-4" />
            Visit Our Blog
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>

          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">Something Went Wrong</h1>
            <p className="text-gray-400">{error}</p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-700">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Unsubscribe from Newsletter</h1>
          <p className="text-gray-400">
            We're sorry to see you go. Unsubscribe <span className="font-semibold text-white">{email}</span> from our newsletter?
          </p>
        </div>

        {/* Unsubscribe Form */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="mb-4">
            <label htmlFor="reason" className="mb-2 block text-sm font-medium text-gray-300">
              Help us improve (optional)
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select a reason...</option>
              <option value="too_frequent">Too many emails</option>
              <option value="not_relevant">Content not relevant</option>
              <option value="not_interested">No longer interested</option>
              <option value="spam">Emails feel like spam</option>
              <option value="other">Other reason</option>
            </select>
          </div>

          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>
        </div>

        {/* Alternative */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-2 font-semibold text-white">Prefer to stay subscribed?</h3>
          <p className="mb-4 text-sm text-gray-400">
            Our newsletter includes exclusive deal alerts, market insights, and expert analysis delivered weekly.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 transition-colors hover:text-purple-300"
          >
            Return to Blog →
          </Link>
        </div>
      </div>
    </div>
  );
}
