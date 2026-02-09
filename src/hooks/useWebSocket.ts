import { useEffect, useState, useCallback, useRef } from 'react';
import { wsService } from '@/services/websocket';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const connectAttempted = useRef(false);

  useEffect(() => {
    if (connectAttempted.current) return;
    connectAttempted.current = true;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) return;

    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);
    const handleError = (err: Error) => setError(err);

    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);
    wsService.on('error', handleError);

    // Connect to WebSocket
    wsService.connect(token).catch((err) => {
      console.error('Failed to connect WebSocket:', err);
      setError(err);
    });

    return () => {
      wsService.off('connected', handleConnected);
      wsService.off('disconnected', handleDisconnected);
      wsService.off('error', handleError);
    };
  }, []);

  return { connected, error };
};

// Hook for listening to specific events
export const useWebSocketEvent = (
  eventType: 'assignment_created' | 'assignment_updated' | 'assignment_deleted' |
           'submission_created' | 'submission_updated' | 'submission_deleted' |
           'evaluation_created' | 'evaluation_updated' | 'evaluation_deleted',
  callback: (data: any) => void
) => {
  useEffect(() => {
    wsService.on(eventType, callback);
    return () => {
      wsService.removeListener(eventType, callback);
    };
  }, [eventType, callback]);
};
