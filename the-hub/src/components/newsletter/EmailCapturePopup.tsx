/**
 * Email Capture Exit Intent Popup
 * Shows when user moves mouse toward leaving the page
 */

import { useState, useEffect } from 'react';
import { Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../../services/blog';

interface EmailCapturePopupProps {
  onClose?: () => void;
}

export default function EmailCapturePopup({ onClose }: EmailCapturePopupProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    const hasShown = sessionStorage.getItem('newsletter-popup-shown');
    if (hasShown) return;

    // Show on exit intent (mouse leaves viewport)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShow(true);
        sessionStorage.setItem('newsletter-popup-shown', 'true');
      }
    };

    // Delay adding listener to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleClose = () => {
    setShow(false);
    onClose?.();
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
        name: name || undefined,
        source: 'exit_intent_popup'
      });

      setSubscribed(true);
      toast.success('Successfully subscribed! Check your email to confirm.');

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-purple-600/20 via-gray-900 to-gray-900 p-8 shadow-2xl">
          {!subscribed ? (
            <>
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600">
                <Mail className="h-8 w-8 text-white" />
              </div>

              {/* Headline */}
              <h2 className="mb-2 text-center text-2xl font-bold text-white">
                Wait! Don't Miss Out
              </h2>
              <p className="mb-6 text-center text-gray-400">
                Join 500+ smart shoppers getting weekly deal alerts and market insights
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
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
                  {loading ? 'Subscribing...' : 'Get Free Alerts'}
                </button>
              </form>

              {/* Trust indicators */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>✓ No spam</span>
                <span>✓ Unsubscribe anytime</span>
              </div>
            </>
          ) : (
            // Success state
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">
                You're All Set! 🎉
              </h3>
              <p className="text-gray-400">
                Check your email to confirm your subscription.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
