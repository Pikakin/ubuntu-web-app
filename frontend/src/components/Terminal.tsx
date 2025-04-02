import { Box, Paper, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect, useRef } from 'react';
import { executeCommand } from '../services/api';

const TerminalContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#1e1e1e',
  color: '#f0f0f0',
  padding: theme.spacing(1),
  fontFamily: 'monospace',
  overflow: 'hidden',
}));

const TerminalOutput = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  padding: theme.spacing(1),
}));

const TerminalInput = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    color: '#f0f0f0',
    fontFamily: 'monospace',
    fontSize: '1rem',
  },
  '& .MuiInput-underline:before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: theme.palette.primary.main,
  },
}));

interface HistoryEntry {
  command: string;
  output: string;
}

const Terminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // 初期メッセージ
  useEffect(() => {
    setHistory([
      {
        command: '',
        output: 'Welcome to Ubuntu Web Terminal\nType "help" for available commands.\n'
      }
    ]);
  }, []);

  // 出力が更新されたらスクロールを一番下に
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 上下キーでコマンド履歴を操作
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommand();
    }
  };

  const handleCommand = async () => {
    if (!input.trim()) return;

    const command = input.trim();
    setInput('');
    setHistoryIndex(-1);
    
    // コマンド履歴に追加
    setCommandHistory(prev => [...prev, command]);
    
    // 特殊コマンドの処理
    if (command === 'clear') {
      setHistory([]);
      return;
    }
    
    if (command === 'help') {
      setHistory(prev => [...prev, {
        command,
        output: `Available commands:
- help: Show this help message
- clear: Clear the terminal
- Any valid bash command
`
      }]);
      return;
    }
    
    // 通常のコマンド実行
    setLoading(true);
    try {
      const output = await executeCommand(command);
      setHistory(prev => [...prev, { command, output }]);
    } catch (error) {
      let errorMessage = 'Command execution failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setHistory(prev => [...prev, { command, output: `Error: ${errorMessage}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TerminalContainer>
      <TerminalOutput ref={outputRef}>
        {history.map((entry, index) => (
          <Box key={index}>
            {entry.command && (
              <Typography component="div" sx={{ color: '#4CAF50' }}>
                user@ubuntu:~$ {entry.command}
              </Typography>
            )}
            <Typography component="div" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
              {entry.output}
            </Typography>
          </Box>
        ))}
        {loading && <Typography>Executing command...</Typography>}
      </TerminalOutput>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ color: '#4CAF50', mr: 1 }}>
          user@ubuntu:~$
        </Typography>
        <TerminalInput
          fullWidth
          variant="standard"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoFocus
        />
      </Box>
    </TerminalContainer>
  );
};

export default Terminal;
