import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
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

const Terminal: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Terminal 初期化関数を useCallback でメモ化
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

      const options = {
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#f0f0f0',
        },
        allowTransparency: true,
        scrollback: 1000,
        convertEol: true,
      };

      const terminal = new XTerm(options);
      xtermRef.current = terminal;

      // FitAddon と WebLinksAddon をロード
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());

      // DOM にターミナルを追加
      terminal.open(terminalContainerRef.current);

      // 描画完了後にサイズチェックをして fit を実行
      requestAnimationFrame(() => {
        if (fitAddonRef.current && terminalContainerRef.current) {
          const { offsetWidth, offsetHeight } = terminalContainerRef.current;
          if (offsetWidth > 0 && offsetHeight > 0) {
            try {
              fitAddonRef.current?.fit();
              console.log('Terminal fitted successfully');
            } catch (e) {
              console.error('Failed to fit terminal:', e);
            }
          } else {
            console.warn('Terminal container has zero size');
          }
        }
      });

      // WebSocket 接続
      terminalService.connect(
        // データ受信
        (data) => {
          xtermRef.current?.write(data);
        },
        // 接続成功
        () => {
          setStatus('connected');
          xtermRef.current?.focus();
          terminalService.sendCommand('\r');
        },
        // 接続切断
        () => {
          setStatus('error');
          setErrorMessage('Connection closed. Please try again.');
          xtermRef.current?.write('\r\n\x1b[31mConnection closed. Please try again.\x1b[0m\r\n');
        }
      );

      // ユーザー入力処理
      terminal.onData((data) => {
        terminalService.sendCommand(data);
      });

      // リサイズハンドラ
      const handleResize = () => {
        if (fitAddonRef.current) {
          requestAnimationFrame(() => {
            try {
              fitAddonRef.current?.fit();
            } catch (e) {
              console.error('Failed to fit terminal on resize:', e);
            }
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // ResizeObserver でコンテナサイズ変化を監視
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          requestAnimationFrame(() => {
            try {
              fitAddonRef.current?.fit();
            } catch (e) {
              console.error('Failed to fit terminal on container resize:', e);
            }
          });
        }
      });
      resizeObserver.observe(terminalContainerRef.current);

      // タイムアウト処理（10秒以内に接続完了しなかった場合）
      const timeoutId = setTimeout(() => {
        if (status === 'loading') {
          setStatus('error');
          setErrorMessage('Connection timeout. Please check if the server is running.');
        }
      }, 10000);

      // クリーンアップ関数
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        terminalService.disconnect();
        xtermRef.current?.dispose();
        xtermRef.current = null;
      };
    } catch (err) {
      console.error('Error initializing terminal:', err);
      setStatus('error');
      setErrorMessage(`Failed to initialize terminal: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [status]); // status は timeout 内で参照しているため依存に含めています

  // 初期化処理
  useEffect(() => {
    console.log('Terminal component mounted, authenticated:', isAuthenticated);
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

  // 再試行ハンドラ
  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage(null);
    setRetryCount((prev) => prev + 1);
  };

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
                status === 'connected' ? 'success.main' : status === 'error' ? 'error.main' : 'warning.main',
              mr: 1,
            }}
          />
          <Typography variant="caption">
            {status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Connecting...'}
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
              zIndex: 10,
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
              zIndex: 10,
            }}
          >
            <Typography color="error.main" sx={{ mb: 2 }}>
              {errorMessage || 'An error occurred'}
            </Typography>
            <Button variant="contained" color="primary" onClick={handleRetry}>
              Retry Connection
            </Button>
          </Box>
        )}

        {/* ターミナルコンテナ */}
        <div
          ref={terminalContainerRef}
          style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        />
      </TerminalContent>
    </TerminalContainer>
  );
};

export default Terminal;
