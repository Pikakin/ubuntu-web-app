import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect, useRef } from 'react';
import { connectWebSocket } from '../services/api';

const LogViewerContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}));

const LogOutput = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  backgroundColor: '#1e1e1e',
  color: '#f0f0f0',
  fontFamily: '"Consolas", "Monaco", monospace',
  fontSize: '12px',
  padding: theme.spacing(1),
  overflowY: 'auto',
  marginTop: theme.spacing(2),
  whiteSpace: 'pre-wrap',
  borderRadius: theme.shape.borderRadius,
}));

const LogViewer: React.FC = () => {
  const [logFile, setLogFile] = useState('/var/log/syslog');
  const [logContent, setLogContent] = useState<string[]>([]);
  const logOutputRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // WebSocketを接続
    const ws = connectWebSocket();
    wsRef.current = ws;
    
    // 初期ログを読み込む
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe_log',
        file: logFile,
        lines: 100
      }));
    };
    
    // ログメッセージを受信
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log_line') {
          setLogContent(prev => [...prev, data.line]);
        } else if (data.type === 'log_content') {
          setLogContent(data.lines);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      // WebSocketを閉じる
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // ログファイルが変更されたら購読を変更
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_log',
        file: logFile,
        lines: 100
      }));
      setLogContent([]);
    }
  }, [logFile]);

  // 新しいログが追加されたら自動スクロール
  useEffect(() => {
    if (logOutputRef.current) {
      logOutputRef.current.scrollTop = logOutputRef.current.scrollHeight;
    }
  }, [logContent]);

  const handleLogFileChange = (event: SelectChangeEvent) => {
    setLogFile(event.target.value);
  };

  return (
    <LogViewerContainer>
      <Typography variant="h6" gutterBottom>
        Log Viewer
      </Typography>
      
      <FormControl fullWidth>
        <InputLabel>Log File</InputLabel>
        <Select
          value={logFile}
          label="Log File"
          onChange={handleLogFileChange}
        >
          <MenuItem value="/var/log/syslog">System Log</MenuItem>
          <MenuItem value="/var/log/auth.log">Authentication Log</MenuItem>
          <MenuItem value="/var/log/kern.log">Kernel Log</MenuItem>
          <MenuItem value="/var/log/apache2/access.log">Apache Access Log</MenuItem>
          <MenuItem value="/var/log/apache2/error.log">Apache Error Log</MenuItem>
        </Select>
      </FormControl>
      
      <LogOutput ref={logOutputRef}>
        {logContent.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </LogOutput>
    </LogViewerContainer>
  );
};

export default LogViewer;
