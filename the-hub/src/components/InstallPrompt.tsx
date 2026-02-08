import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import {
  isInstallable,
  setInstallPrompt,
  showInstallPrompt,
  isAppInstalled,
  trackPWAInstall,
} from '../utils/pwa';

interface InstallPromptProps {
  variant?: 'banner' | 'button' | 'modal';
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function InstallPrompt({ 
  variant = 'banner', 
  onInstall,
  onDismiss 
}: InstallPromptProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
      setCanInstall(true);
      
      // Show prompt after a short delay (don't be too aggressive)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setCanInstall(false);
      setShowPrompt(false);
      console.log('PWA was installed');
      
      if (onInstall) {
        onInstall();
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (!canInstall) {
      return;
    }

    setIsInstalling(true);

    try {
      const outcome = await showInstallPrompt();
      
      if (outcome) {
        trackPWAInstall(outcome);
        
        if (outcome === 'accepted') {
          setShowPrompt(false);
          if (onInstall) {
            onInstall();
          }
        } else {
          handleDismiss();
        }
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!canInstall || !showPrompt) {
    return null;
  }

  // Button variant (for header/footer)
  if (variant === 'button') {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
      </button>
    );
  }

  // Modal variant
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center w-16 h-16 bg-indigo-600/10 rounded-full mb-4">
            <Download className="w-8 h-8 text-indigo-500" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            Install The Hub
          </h3>
          
          <p className="text-gray-300 mb-6">
            Install The Hub for quick access to the best deals on watches, sneakers, and cars.
            Works offline and sends push notifications for new deals!
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              <span>Instant notifications</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              <span>Faster performance</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isInstalling ? 'Installing...' : 'Install Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h4 className="text-white font-semibold mb-1">
              Install The Hub
            </h4>
            <p className="text-white/90 text-sm mb-3">
              Get quick access and push notifications for new deals!
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
