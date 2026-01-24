import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastUpdate: Date | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  lastUpdate: null
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const socketInstance = io('http://localhost:3002', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connected', (data) => {
      console.log('🎉 Server welcome:', data.message);
      toast.success('Connected to live updates!', {
        icon: '🔌',
        duration: 3000,
        position: 'bottom-right'
      });
    });

    socketInstance.on('price:update', (data) => {
      console.log('💰 Price update received:', data);
      setLastUpdate(new Date());

      // Show toast notification
      const itemName = data.item?.brand
        ? `${data.item.brand} ${data.item.model}`
        : data.item?.make
        ? `${data.item.make} ${data.item.model}`
        : data.item?.name || 'Item';

      toast.success(`Price updated: ${itemName} - $${data.price.toLocaleString()}`, {
        icon: '💰',
        duration: 4000,
        position: 'bottom-right',
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          fontWeight: '500'
        }
      });

      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('price:update', { detail: data }));
    });

    socketInstance.on('alert:new', (data) => {
      console.log('🔔 Alert received:', data);

      // Show prominent alert toast
      const itemName = data.item?.brand
        ? `${data.item.brand} ${data.item.model}`
        : data.item?.make
        ? `${data.item.make} ${data.item.model}`
        : data.item?.name || 'Item';

      toast.success(
        `🎯 Price Alert!\n${itemName} hit your target!\nNow: $${data.currentPrice.toLocaleString()} | Target: $${data.targetPrice.toLocaleString()}`,
        {
          icon: '🔔',
          duration: 8000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#fff',
            fontWeight: '600',
            fontSize: '16px',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }
        }
      );

      // Dispatch custom event for alert notifications
      window.dispatchEvent(new CustomEvent('alert:new', { detail: data }));
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, lastUpdate }}>
      {children}
    </WebSocketContext.Provider>
  );
};
