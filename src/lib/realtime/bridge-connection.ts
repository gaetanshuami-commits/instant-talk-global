export interface BridgeConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessageTime: number;
}

export interface BridgeMessage {
  type: 'transcript' | 'translation' | 'error' | 'bridge_ready';
  text?: string;
  language?: string;
  message?: string;
}

class BridgeConnection {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Set<(msg: BridgeMessage) => void> = new Set();
  private stateListeners: Set
    (state: BridgeConnectionState) => void
  > = new Set();
  private state: BridgeConnectionState = {
    connected: false,
    connecting: false,
    error: null,
    lastMessageTime: 0,
  };

  connect(): void {
    if (this.state.connecting || this.state.connected) {
      return;
    }

    this.updateState({ connecting: true, error: null });

    try {
      const protocol =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? 'wss:'
          : 'ws:';
      const host =
        typeof window !== 'undefined'
          ? window.location.host
          : 'localhost:3000';
      const url = `${protocol}//${host}/api/deepgram-bridge`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[Bridge] Connected');
        this.reconnectAttempts = 0;
        this.updateState({ connected: true, connecting: false });
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          this.state.lastMessageTime = Date.now();
          const data = JSON.parse(event.data) as BridgeMessage;
          this.messageHandlers.forEach((handler) => handler(data));
        } catch (error) {
          console.error('[Bridge] Message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Bridge] Error:', error);
        this.updateState({
          connected: false,
          error: 'WebSocket error',
        });
      };

      this.ws.onclose = () => {
        console.log('[Bridge] Disconnected');
        this.stopHeartbeat();
        this.updateState({ connected: false, connecting: false });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[Bridge] Connection failed:', error);
      this.updateState({
        connecting: false,
        connected: false,
        error: String(error),
      });
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateState({
        error: `Failed to connect after ${this.maxReconnectAttempts} attempts`,
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );
    console.log(`[Bridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendAudio(audioData: Int16Array, targetLanguage: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[Bridge] WebSocket not open, dropping audio frame');
      return;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type: 'audio',
          audio: Array.from(audioData),
          targetLanguage,
        })
      );
    } catch (error) {
      console.error('[Bridge] Failed to send audio:', error);
    }
  }

  stopTranscription(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'stop' }));
    }
  }

  onMessage(handler: (msg: BridgeMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onStateChange(handler: (state: BridgeConnectionState) => void): () => void {
    this.stateListeners.add(handler);
    handler(this.state);
    return () => {
      this.stateListeners.delete(handler);
    };
  }

  private updateState(partial: Partial<BridgeConnectionState>): void {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach((listener) => listener(this.state));
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateState({ connected: false, connecting: false });
  }

  getState(): BridgeConnectionState {
    return { ...this.state };
  }
}

export const bridgeConnection = new BridgeConnection();
