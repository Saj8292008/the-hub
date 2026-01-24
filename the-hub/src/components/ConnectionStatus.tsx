import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

interface ConnectionStatusProps {
  inline?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ inline = false }) => {
  const { isConnected, lastUpdate } = useWebSocket();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);

      if (seconds < 60) {
        setTimeSinceUpdate('just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceUpdate(`${minutes}m ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeSinceUpdate(`${hours}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Inline version for header
  if (inline) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm shadow-sm border transition-all duration-300 hover:shadow-md"
        style={{
          background: isConnected
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
          borderColor: isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        }}
      >
        {/* Status Indicator with Pulse */}
        <div className="relative flex items-center">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          {isConnected && (
            <>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </>
          )}
        </div>

        {/* Status Text */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {isConnected && timeSinceUpdate && (
            <>
              <span className="text-gray-700">•</span>
              <span className="text-xs text-gray-500">
                {timeSinceUpdate}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Original fixed position version (fallback)
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105"
      style={{
        background: isConnected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))',
        borderColor: isConnected ? '#10b981' : '#ef4444'
      }}
    >
      {/* Status Indicator with Pulse */}
      <div className="relative flex items-center">
        <div
          className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        {isConnected && (
          <>
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          </>
        )}
      </div>

      {/* Status Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {isConnected && timeSinceUpdate && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Updated {timeSinceUpdate}
          </span>
        )}
        {!isConnected && (
          <span className="text-xs text-red-500/70">
            Reconnecting...
          </span>
        )}
      </div>
    </div>
  );
};
