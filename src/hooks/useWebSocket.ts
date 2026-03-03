import { useEffect, useState, useRef, useCallback } from 'react';
import { wsService } from '@/services/websocket';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const connectAttempted = useRef(false);

  useEffect(() => {
    if (connectAttempted.current) return;
    connectAttempted.current = true;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);

    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);

    wsService.connect(token).catch(() => {});

    return () => {
      wsService.off('connected', handleConnected);
      wsService.off('disconnected', handleDisconnected);
    };
  }, []);

  return { connected };
};

type WSEvent = 'assignment_created' | 'assignment_updated' | 'assignment_deleted' |
  'submission_created' | 'submission_updated' | 'submission_deleted' |
  'evaluation_created' | 'evaluation_updated' | 'evaluation_deleted';

// Stable event listener hook — callback ref avoids stale closures
export const useWebSocketEvent = (eventType: WSEvent, callback: (data: any) => void) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: any) => callbackRef.current(data);
    wsService.on(eventType, handler);
    return () => {
      wsService.removeListener(eventType, handler);
    };
  }, [eventType]);
};
