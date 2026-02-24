import React, { useState, useEffect } from 'react';
import { X, Mail, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4003';

interface EmailCapturePopupProps {
  delayMs?: number;
}

export const EmailCapturePopup: React.FC<EmailCapturePopupProps> = ({ delayMs = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or subscribed
    const isDismissed = localStorage.getItem('emailPopupDismissed');
    const isSubscribed = localStorage.getItem('newsletterSubscribed');
    
    if (isDismissed || isSubscribed) {
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);

    // Exit-intent detection for desktop
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isVisible && !isDismissed && !isSubscribed) {
        setIsVisible(true);
      }
    };

    // Only add exit-intent on desktop
    if (window.innerWidth > 768) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [delayMs, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('emailPopupDismissed', 'true');
  };

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
          source: 'popup',
          subscribed_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        if (response.status === 409 || errorData.message?.includes('already')) {
          toast.error('This email is already subscribed!');
          localStorage.setItem('newsletterSubscribed', 'true');
          handleClose();
          return;
        }
        throw new Error(errorData.message || 'Failed to subscribe');
      }

      setIsSuccess(true);
      localStorage.setItem('newsletterSubscribed', 'true');
      toast.success('🎉 Subscribed! Check your email.');
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative bg-[#141414] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {!isSuccess ? (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-[#1a8d5f]/10 p-4 rounded-full">
                <Sparkles className="text-[#1a8d5f]" size={32} />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Get Daily Deal Alerts
            </h2>
            
            {/* Subheadline */}
            <p className="text-gray-400 text-center mb-6">
              Never miss a hot deal on Rolex, Nike, Omega & more. Join 1,000+ smart collectors.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#1a8d5f] transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#1a8d5f] hover:bg-[#16704d] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Get Deal Alerts'}
              </button>
            </form>

            {/* Trust badge */}
            <p className="text-xs text-gray-500 text-center mt-4">
              No spam. Unsubscribe anytime. Free forever.
            </p>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="flex justify-center mb-4">
              <div className="bg-[#1a8d5f]/20 p-4 rounded-full">
                <Sparkles className="text-[#1a8d5f]" size={32} />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              You're in! 🔥
            </h2>
            
            <p className="text-gray-400 text-center">
              Check your inbox for the first deal alert.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
