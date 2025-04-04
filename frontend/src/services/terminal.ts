// WebSocketベースのターミナルサービス
class TerminalService {
  private socket: WebSocket | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onOpenCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  connect(
    onData: (data: string) => void,
    onOpen?: () => void,
    onClose?: () => void
  ) {
    this.onDataCallback = onData;
    this.onOpenCallback = onOpen || null;
    this.onCloseCallback = onClose || null;

    // 認証トークンを取得
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No authentication token found');
      if (this.onCloseCallback) this.onCloseCallback();
      return;
    }
    
    // WebSocket URLを構築
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
    
    // 認証ありのエンドポイントを使用
    const wsUrl = `${wsProtocol}//${wsHost}/api/terminal?token=${token}`;
    
    console.log('Connecting to terminal WebSocket...');
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('Terminal WebSocket connection established');
        if (this.onOpenCallback) this.onOpenCallback();
      };
      
      this.socket.onmessage = (event) => {
        if (this.onDataCallback) {
          // バイナリデータをテキストに変換
          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              if (this.onDataCallback && typeof reader.result === 'string') {
                this.onDataCallback(reader.result);
              }
            };
            reader.readAsText(event.data);
          } else {
            this.onDataCallback(event.data);
          }
        }
      };
      
      this.socket.onclose = (event) => {
        console.log('Terminal WebSocket connection closed:', event.code, event.reason);
        if (this.onCloseCallback) this.onCloseCallback();
      };
      
      this.socket.onerror = (error) => {
        console.error('Terminal WebSocket error:', error);
        if (this.onCloseCallback) this.onCloseCallback();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.onCloseCallback) this.onCloseCallback();
    }
  }

  sendCommand(command: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(command);
    } else {
      console.error('Terminal WebSocket is not connected, readyState:', this.socket?.readyState);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting terminal WebSocket');
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new TerminalService();
