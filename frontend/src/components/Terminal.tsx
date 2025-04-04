import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useAuth } from '../contexts/AuthContext';
import terminalService from '../services/terminal';

// スタイル定義
const TerminalContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#1e1e1e',
  color: '#f0f0f0',
  overflow: 'hidden',
}));

const TerminalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: '1px solid #333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const TerminalContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  position: 'relative',
  overflow: 'hidden',
}));

// メインコンポーネント
const Terminal: React.FC = () => {
  // 状態とref
  const { isAuthenticated } = useAuth();
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ターミナルのサイズを調整する関数
  const fitTerminal = useCallback(() => {
    if (fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
        console.log('Terminal fitted');
      } catch (e) {
        console.error('Failed to fit terminal:', e);
      }
    }
  }, []);

  // ターミナル初期化関数
  const initializeTerminal = useCallback(() => {
    console.log('Initializing terminal...');
    
    if (!terminalContainerRef.current) {
      console.error('Terminal container ref is null');
      setStatus('error');
      setErrorMessage('Terminal container not found');
      return;
    }

    try {
      // 既存のターミナルがあれば破棄
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }

      // ターミナルオプション
      const terminal = new XTerm({
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#f0f0f0',
          cursor: '#ffffff',
          selectionBackground: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#e06c75',
          green: '#98c379',
          yellow: '#e5c07b',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#dcdfe4',
          brightBlack: '#5c6370',
          brightRed: '#e06c75',
          brightGreen: '#98c379',
          brightYellow: '#e5c07b',
          brightBlue: '#61afef',
          brightMagenta: '#c678dd',
          brightCyan: '#56b6c2',
          brightWhite: '#ffffff'
        },
        allowTransparency: true,
        scrollback: 1000,
        convertEol: true,
        cursorStyle: 'block',
      });
      
      xtermRef.current = terminal;

      // アドオン追加
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());

      // DOMに追加
      terminal.open(terminalContainerRef.current);
      
      // 初期メッセージ
      terminal.write('Connecting to terminal...\r\n');
      
      // 初期サイズ調整
      setTimeout(() => {
        fitTerminal();
      }, 100);
      
      // WebSocket接続
      terminalService.connect(
        // データ受信
        (data) => {
          if (xtermRef.current) {
            xtermRef.current.write(data);
          }
        },
        // 接続成功
        () => {
          setStatus('connected');
          if (xtermRef.current) {
            xtermRef.current.focus();
            // 初期コマンドを送信
            terminalService.sendCommand('\r');
          }
        },
        // 接続切断
        () => {
          setStatus('error');
          setErrorMessage('Connection closed. Please try again.');
          if (xtermRef.current) {
            xtermRef.current.write('\r\n\x1b[31mConnection closed. Please try again.\x1b[0m\r\n');
          }
        }
      );

      // ユーザー入力処理
      terminal.onData((data) => {
        terminalService.sendCommand(data);
      });

      // タイムアウト処理
      const timeoutId = setTimeout(() => {
        if (status === 'loading') {
          setStatus('error');
          setErrorMessage('Connection timeout. Please check if the server is running.');
        }
      }, 5000); // 5秒に短縮

      // クリーンアップ関数を返す
      return () => {
        clearTimeout(timeoutId);
        terminalService.disconnect();
        if (xtermRef.current) {
          xtermRef.current.dispose();
          xtermRef.current = null;
        }
        fitAddonRef.current = null;
      };
    } catch (err) {
      console.error('Error initializing terminal:', err);
      setStatus('error');
      setErrorMessage(`Failed to initialize terminal: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [fitTerminal, status]);

  // 初期化処理
  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('error');
      setErrorMessage('Authentication required');
      return;
    }

    const cleanup = initializeTerminal();
    return () => {
      if (cleanup) cleanup();
    };
  }, [isAuthenticated, retryCount, initializeTerminal]);

  // リサイズイベントのリスナー
  useEffect(() => {
    const handleResize = () => {
      // デバウンス処理
      if (window.resizeTimeout) {
        clearTimeout(window.resizeTimeout);
      }
      window.resizeTimeout = setTimeout(fitTerminal, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.resizeTimeout) {
        clearTimeout(window.resizeTimeout);
      }
    };
  }, [fitTerminal]);

  // 再試行ハンドラ
  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage(null);
    setRetryCount(prev => prev + 1);
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C のハンドリング
      if (e.ctrlKey && e.key === 'c' && status === 'connected') {
        terminalService.sendCommand('\x03'); // SIGINT
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [status]);

  return (
    <TerminalContainer>
      <TerminalHeader>
        <Typography variant="subtitle1">Terminal</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 
                status === 'connected' ? 'success.main' : 
                status === 'error' ? 'error.main' : 'warning.main',
              mr: 1
            }}
          />
          <Typography variant="caption">
            {status === 'connected' ? 'Connected' : 
             status === 'error' ? 'Error' : 'Connecting...'}
          </Typography>
        </Box>
      </TerminalHeader>

      <TerminalContent>
        {status === 'loading' && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 10
            }}
          >
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography>Connecting to terminal...</Typography>
          </Box>
        )}
        
        {status === 'error' && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 10
            }}
          >
            <Typography color="error.main" sx={{ mb: 2 }}>
              {errorMessage || 'An error occurred'}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRetry}
            >
              Retry Connection
            </Button>
          </Box>
        )}
        
        <div 
          ref={terminalContainerRef}
          style={{ 
            height: '100%', 
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            padding: '2px'
          }} 
        />
      </TerminalContent>
    </TerminalContainer>
  );
};

// TypeScriptの型拡張
declare global {
  interface Window {
    resizeTimeout: ReturnType<typeof setTimeout> | null;
  }
}

export default Terminal;
