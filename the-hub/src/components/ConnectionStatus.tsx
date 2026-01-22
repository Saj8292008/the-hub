import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export const ConnectionStatus: React.FC = () => {
  const { isConnected, lastUpdate } = useWebSocket();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg border transition-all duration-300"
      style={{
        background: isConnected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
        borderColor: isConnected ? '#10b981' : '#ef4444'
      }}
    >
      {/* Status Indicator */}
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        {isConnected && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-sm">
        <span className={`font-medium ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {isConnected ? 'Live' : 'Disconnected'}
        </span>
        {isConnected && lastUpdate && (
          <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};
