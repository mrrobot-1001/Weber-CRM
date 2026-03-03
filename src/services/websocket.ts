import { EventEmitter } from 'events';

type WSEventType = 'assignment_created' | 'assignment_updated' | 'assignment_deleted' | 
                   'submission_created' | 'submission_updated' | 'submission_deleted' |
                   'evaluation_created' | 'evaluation_updated' | 'evaluation_deleted' |
                   'connected' | 'disconnected' | 'error';

const VALID_EVENTS = new Set<string>([
  'assignment_created', 'assignment_updated', 'assignment_deleted',
  'submission_created', 'submission_updated', 'submission_deleted',
  'evaluation_created', 'evaluation_updated', 'evaluation_deleted',
]);

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false;

  constructor() {
    super();
    this.url = typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
      : 'ws://localhost:3000';
  }

  connect(token: string): Promise<void> {
    // Prevent duplicate connections
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'auth', token }));
          }
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type && VALID_EVENTS.has(data.type)) {
              this.emit(data.type as WSEventType, data.payload);
            }
          } catch {
            // Silently ignore malformed messages
          }
        };

        this.ws.onerror = () => {
          this.emit('error', new Error('WebSocket error'));
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = () => {
          this.ws = null;
          this.emit('disconnected');
          
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            // Exponential backoff: 2s, 4s, 8s, 16s, 32s
            const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
            this.reconnectTimer = setTimeout(() => {
              this.connect(token).catch(() => {});
            }, delay);
          }
        };
      } catch {
        reject(new Error('WebSocket connection failed'));
      }
    });
  }

  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload: data }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Event listeners for specific events
  onAssignmentCreated(callback: (data: any) => void): () => void {
    this.on('assignment_created', callback);
    return () => this.off('assignment_created', callback);
  }

  onAssignmentUpdated(callback: (data: any) => void): () => void {
    this.on('assignment_updated', callback);
    return () => this.off('assignment_updated', callback);
  }

  onAssignmentDeleted(callback: (data: any) => void): () => void {
    this.on('assignment_deleted', callback);
    return () => this.off('assignment_deleted', callback);
  }

  onSubmissionCreated(callback: (data: any) => void): () => void {
    this.on('submission_created', callback);
    return () => this.off('submission_created', callback);
  }

  onSubmissionUpdated(callback: (data: any) => void): () => void {
    this.on('submission_updated', callback);
    return () => this.off('submission_updated', callback);
  }

  onSubmissionDeleted(callback: (data: any) => void): () => void {
    this.on('submission_deleted', callback);
    return () => this.off('submission_deleted', callback);
  }

  onEvaluationCreated(callback: (data: any) => void): () => void {
    this.on('evaluation_created', callback);
    return () => this.off('evaluation_created', callback);
  }

  onEvaluationUpdated(callback: (data: any) => void): () => void {
    this.on('evaluation_updated', callback);
    return () => this.off('evaluation_updated', callback);
  }

  onEvaluationDeleted(callback: (data: any) => void): () => void {
    this.on('evaluation_deleted', callback);
    return () => this.off('evaluation_deleted', callback);
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
