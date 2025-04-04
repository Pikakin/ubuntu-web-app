// WebSocketベースのターミナルサービス
class TerminalService {
  private socket: WebSocket | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onOpenCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private commandQueue: string[] = []; // 未送信コマンドのキュー

  /**
   * WebSocketに接続する
   * @param onData データ受信時のコールバック
   * @param onOpen 接続成功時のコールバック
   * @param onClose 接続切断時のコールバック
   */
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
    
    // WebSocket URLを構築
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
    
    // 認証ありのエンドポイントを使用
    const wsUrl = `${wsProtocol}//${wsHost}/api/terminal`;
    
    // トークンをクエリパラメータとして追加
    const url = token ? `${wsUrl}?token=${token}` : wsUrl;
    
    console.log('Connecting to terminal WebSocket...');
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('Terminal WebSocket connection established');
        this.reconnectAttempts = 0; // 接続成功時にリセット
        
        // キューに溜まったコマンドを送信
        this.flushCommandQueue();
        
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
        
        // 自動再接続を試みる（特定の条件下で）
        if (this.reconnectAttempts < this.maxReconnectAttempts && event.code !== 1000) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          
          // 指数バックオフで再接続
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(onData, onOpen, onClose);
          }, delay);
        } else {
          // 再接続を諦める
          if (this.onCloseCallback) this.onCloseCallback();
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('Terminal WebSocket error:', error);
        // エラーハンドリングはoncloseイベントに任せる
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.onCloseCallback) this.onCloseCallback();
    }
  }

  /**
   * コマンドをサーバーに送信する
   * @param command 送信するコマンド
   */
  sendCommand(command: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(command);
    } else {
      console.log('Terminal WebSocket is not connected, queueing command');
      // 接続が確立されていない場合はキューに追加
      this.commandQueue.push(command);
    }
  }

  /**
   * キューに溜まったコマンドを送信する
   */
  private flushCommandQueue(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift();
      if (command) {
        try {
          this.socket.send(command);
        } catch (error) {
          console.error('Error sending queued command:', error);
        }
      }
    }
  }

  /**
   * WebSocket接続を切断する
   */
  disconnect() {
    // 再接続タイマーをクリア
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // WebSocketを閉じる
    if (this.socket) {
      // 正常なクローズコード1000を使用
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'User initiated disconnect');
      }
      this.socket = null;
    }
    
    // コールバックをクリア
    this.onDataCallback = null;
    this.onOpenCallback = null;
    this.onCloseCallback = null;
    this.reconnectAttempts = 0;
    
    // コマンドキューをクリア
    this.commandQueue = [];
    
    console.log('Terminal service disconnected');
  }

  /**
   * 接続状態を確認する
   * @returns 接続されているかどうか
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * ターミナルのサイズ変更をサーバーに通知する
   * @param cols 列数
   * @param rows 行数
   */
  resizeTerminal(cols: number, rows: number): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    try {
      // サーバー側がJSONフォーマットを期待している場合のみ使用
      // this.socket.send(JSON.stringify({
      //   type: 'resize',
      //   cols: cols,
      //   rows: rows
      // }));
      
      // 現在のサーバー実装に合わせて、必要に応じてコメントアウトを解除
    } catch (error) {
      console.error('Error sending resize command:', error);
    }
  }
}

// シングルトンインスタンスをエクスポート
export default new TerminalService();
