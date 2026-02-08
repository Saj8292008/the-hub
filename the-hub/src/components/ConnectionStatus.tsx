import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { isOnline, addConnectionListener } from '../utils/pwa';

export function ConnectionStatus() {
  const [online, setOnline] = useState(isOnline());
  const [showOffline, setShowOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowOffline(false);
      setShowBackOnline(true);
      
      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setShowBackOnline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setOnline(false);
      setShowOffline(true);
      setShowBackOnline(false);
    };

    const cleanup = addConnectionListener(handleOnline, handleOffline);

    return cleanup;
  }, []);

  // Only show when offline or briefly when back online
  if (!showOffline && !showBackOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
          ${
            online
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }
        `}
      >
        {online ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You're offline</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;
