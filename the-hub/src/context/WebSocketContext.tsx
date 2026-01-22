import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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
    const socketInstance = io('http://localhost:3000', {
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
    });

    socketInstance.on('price:update', (data) => {
      console.log('💰 Price update received:', data);
      setLastUpdate(new Date());

      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('price:update', { detail: data }));
    });

    socketInstance.on('alert:new', (data) => {
      console.log('🔔 Alert received:', data);

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
