import { EventEmitter } from 'events';

type WSEventType = 'assignment_created' | 'assignment_updated' | 'assignment_deleted' | 
                   'submission_created' | 'submission_updated' | 'submission_deleted' |
                   'evaluation_created' | 'evaluation_updated' | 'evaluation_deleted' |
                   'connected' | 'disconnected' | 'error';

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isManualClose = false;

  constructor() {
    super();
    this.url = `${typeof window !== 'undefined' ? window.location.protocol === 'https:' ? 'wss:' : 'ws:' : 'ws:'}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}`;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Send authentication
          if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'auth', token }));
          }
          
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            if (data.type && ['assignment_created', 'assignment_updated', 'assignment_deleted',
                             'submission_created', 'submission_updated', 'submission_deleted',
                             'evaluation_created', 'evaluation_updated', 'evaluation_deleted'].includes(data.type)) {
              this.emit(data.type as WSEventType, data.payload);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.ws = null;
          this.emit('disconnected');
          
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.connect(token).catch(() => {
                // Connection failed, will retry on next interval
              });
            }, this.reconnectInterval * this.reconnectAttempts);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        reject(error);
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
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
