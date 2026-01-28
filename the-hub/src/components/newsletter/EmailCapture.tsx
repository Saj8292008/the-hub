/**
 * Email Capture Component
 * Newsletter signup widget for homepage, blog posts, and other pages
 */

import React, { useState } from 'react';
import '../../styles/EmailCapture.css';

interface EmailCaptureProps {
  source?: string;
  variant?: 'default' | 'inline' | 'sidebar' | 'hero';
  title?: string;
  description?: string;
}

export function EmailCapture({
  source = 'homepage',
  variant = 'default',
  title,
  description
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const defaultTitles = {
    default: '💎 Get Deal Alerts Delivered Daily',
    inline: '📧 Never Miss a Deal',
    sidebar: '🔥 Hot Deals Alert',
    hero: '💎 Join 10,000+ Smart Shoppers'
  };

  const defaultDescriptions = {
    default: 'Top watches, cars, sneakers & sports deals — never miss a steal',
    inline: 'Get instant notifications when we find incredible deals',
    sidebar: 'Daily deal digest straight to your inbox',
    hero: 'Get the best deals in watches, cars, sneakers & sports delivered to your inbox'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          source
        })
      });

      const data = await response.json();

      if (data.success || response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Subscribed! Check your email to confirm.'
        });
        setEmail('');

        // Track subscription event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'newsletter_subscribe', {
            source
          });
        }
      } else {
        throw new Error(data.error || 'Subscription failed');
      }
    } catch (error: any) {
      console.error('Subscribe error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to subscribe. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`email-capture email-capture-${variant}`}>
      <div className="email-capture-content">
        <h3 className="email-capture-title">
          {title || defaultTitles[variant]}
        </h3>
        <p className="email-capture-description">
          {description || defaultDescriptions[variant]}
        </p>

        <form onSubmit={handleSubmit} className="email-capture-form">
          <div className="email-capture-input-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="email-capture-input"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={loading}
              className="email-capture-button"
            >
              {loading ? (
                <span className="email-capture-loading">
                  <span className="spinner"></span> Subscribing...
                </span>
              ) : (
                'Subscribe Free'
              )}
            </button>
          </div>
        </form>

        {message && (
          <div className={`email-capture-message email-capture-message-${message.type}`} role="alert">
            {message.type === 'success' ? '✅ ' : '⚠️ '}
            {message.text}
          </div>
        )}

        <p className="email-capture-privacy">
          No spam. Unsubscribe anytime. Join 10,000+ deal hunters 🎯
        </p>
      </div>
    </div>
  );
}

export default EmailCapture;
