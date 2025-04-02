import { Box, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect, useRef } from 'react';
import { executeCommand } from '../services/api';

const TerminalContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#1e1e1e',
  color: '#f0f0f0',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  fontFamily: '"Consolas", "Monaco", monospace',
  fontSize: '14px',
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
    fontFamily: '"Consolas", "Monaco", monospace',
    fontSize: '14px',
  },
  '& .MuiInput-underline:before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
}));

const CommandLine = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
}));

const Terminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<string[]>(['Welcome to Ubuntu Web Terminal\nType commands to interact with the system.\n']);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 出力が更新されたらスクロールを一番下に
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      
      // コマンド履歴に追加
      const newHistory = [...history, input];
      setHistory(newHistory);
      
      // 出力に追加
      const newOutput = [...output, `$ ${input}\n`];
      setOutput(newOutput);
      
      // コマンドを実行
      try {
        const result = await executeCommand(input);
        setOutput([...newOutput, `${result}\n`]);
      } catch (error) {
        setOutput([...newOutput, `Error: ${error}\n`]);
      }
      
      // 入力をクリア
      setInput('');
    }
  };

  return (
    <TerminalContainer>
      <TerminalOutput ref={outputRef}>
        {output.map((text, index) => (
          <Typography key={index} component="span" variant="body2">
            {text}
          </Typography>
        ))}
      </TerminalOutput>
      
      <CommandLine>
        <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
        <TerminalInput
          fullWidth
          variant="standard"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </CommandLine>
    </TerminalContainer>
  );
};

export default Terminal;
