/**
 * Premium Success Page
 * Shown after successful subscription purchase
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Crown, Zap, BarChart3, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Refresh user data to get updated tier
    refreshUser();

    // Hide confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000);
  }, []);

  const benefits = [
    { icon: Check, text: 'Unlimited tracked items' },
    { icon: Bell, text: 'Unlimited price alerts' },
    { icon: Zap, text: 'Real-time Telegram alerts' },
    { icon: BarChart3, text: 'Price history charts' },
    { icon: Sparkles, text: 'Advanced AI features' },
    { icon: Crown, text: 'Priority support' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center px-4 py-12">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#9333EA', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)]
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full">
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-2xl border-2 border-purple-500 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 mb-6 animate-bounce">
            <Crown className="text-white" size={40} />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Welcome to Premium! 🎉
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            Your account has been upgraded successfully
          </p>

          {/* Benefits Grid */}
          <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4 text-white">You now have access to:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="text-purple-400" size={16} />
                  </div>
                  <span className="text-gray-300 text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-3 text-white">Next Steps:</h3>
            <ol className="text-left space-y-2 text-gray-300 text-sm">
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Add unlimited items to your watchlist</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">2.</span>
                <span>Set up Telegram alerts in Settings</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Enable real-time price notifications</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg transition-all shadow-lg shadow-purple-500/25"
            >
              Go to Dashboard
            </button>

            <button
              onClick={() => navigate('/settings?tab=subscription')}
              className="px-8 py-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all"
            >
              Manage Subscription
            </button>
          </div>

          {/* Support Link */}
          <p className="text-sm text-gray-400 mt-8">
            Need help? <a href="/settings" className="text-purple-400 hover:text-purple-300">Contact support</a>
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            You'll receive a confirmation email with your receipt shortly
          </p>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
