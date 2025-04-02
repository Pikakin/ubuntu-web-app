import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import HorizontalSplitIcon from '@mui/icons-material/HorizontalSplit';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Divider, 
  FormControl, 
  IconButton, 
  InputLabel, 
  Menu, 
  MenuItem, 
  Select, 
  Slider, 
  TextField, 
  Typography 
} from '@mui/material';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { executeCommand } from '../services/api';

// ターミナルコンテナのスタイル
const TerminalContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#0C0C0C',
  color: '#CCCCCC',
  fontFamily: '"Cascadia Mono", "Consolas", monospace',
  overflow: 'hidden',
}));

// ターミナルヘッダーのスタイル
const TerminalHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  backgroundColor: '#2D2D2D',
  borderBottom: '1px solid #3F3F3F',
}));

// タブバーのスタイル
const TabBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  backgroundColor: '#1E1E1E',
  borderBottom: '1px solid #3F3F3F',
  overflowX: 'auto',
  '&::-webkit-scrollbar': {
    height: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#1E1E1E',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#3E3E3E',
    borderRadius: '2px',
  },
}));

// タブのスタイル
const TerminalTab = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active: boolean }>(({ theme, active }) => ({
  padding: '6px 12px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  backgroundColor: active ? '#2D2D2D' : 'transparent',
  color: active ? '#FFFFFF' : '#AAAAAA',
  borderRight: '1px solid #3F3F3F',
  '&:hover': {
    backgroundColor: active ? '#2D2D2D' : '#252525',
  },
}));

// ターミナル出力エリアのスタイル
const TerminalOutput = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: '8px 12px',
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  '&::-webkit-scrollbar': {
    width: '10px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#1E1E1E',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#3E3E3E',
    borderRadius: '5px',
  },
}));

// ターミナル入力フィールドのスタイル
const TerminalInput = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    color: '#CCCCCC',
    fontFamily: '"Cascadia Mono", "Consolas", monospace',
    fontSize: '14px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiInputBase-input': {
    padding: '0',
  },
}));

// コマンドプロンプトのスタイル
const CommandPrompt = styled('span')(({ theme }) => ({
  color: '#0DBC79',
  marginRight: '8px',
}));

// 分割ビューコンテナのスタイル
const SplitViewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
}));

// ターミナルセッションの型定義
interface TerminalSession {
  id: string;
  title: string;
  output: string[];
  commandHistory: string[];
  historyIndex: number;
  currentCommand: string;
  currentDirectory: string;
}

// ターミナルの設定の型定義
interface TerminalSettings {
  fontSize: number;
  opacity: number;
  theme: 'dark' | 'light' | 'ubuntu' | 'monokai';
  fontFamily: string;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
}

// コマンド補完候補の型定義
interface CompletionSuggestion {
  value: string;
  description?: string;
}

const Terminal: React.FC = () => {
  // 状態変数
  const [sessions, setSessions] = useState<TerminalSession[]>([{
    id: uuidv4(),
    title: 'Terminal 1',
    output: ['Welcome to Ubuntu Web Terminal\nType "help" for available commands.\n'],
    commandHistory: [],
    historyIndex: -1,
    currentCommand: '',
    currentDirectory: '~'
  }]);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);
  const [username, setUsername] = useState('user');
  const [hostname, setHostname] = useState('ubuntu');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical' | null>(null);
  const [splitSessions, setSplitSessions] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [completionSuggestions, setCompletionSuggestions] = useState<CompletionSuggestion[]>([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [selectedCompletionIndex, setSelectedCompletionIndex] = useState(0);
  
  // 設定
  const [settings, setSettings] = useState<TerminalSettings>({
    fontSize: 14,
    opacity: 1,
    theme: 'dark',
    fontFamily: '"Cascadia Mono", "Consolas", monospace',
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 1000
  });
  
  // 参照
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 現在のアクティブセッションを取得
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  
  // ホスト名とユーザー名を取得
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const hostnameResult = await executeCommand('hostname');
        setHostname(hostnameResult.trim());
        
        const usernameResult = await executeCommand('whoami');
        setUsername(usernameResult.trim());
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };
    
    fetchSystemInfo();
    
    // 保存された設定を読み込む
    const savedSettings = localStorage.getItem('terminalSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);
  
  // 設定が変更されたら保存
  useEffect(() => {
    localStorage.setItem('terminalSettings', JSON.stringify(settings));
  }, [settings]);
  
  // 出力が更新されたらスクロールを一番下に
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [activeSession.output]);
  
  // コマンド補完候補を取得
  const fetchCompletionSuggestions = async (command: string) => {
    if (!command) {
      setCompletionSuggestions([]);
      return;
    }
    
    try {
      // 基本コマンド
      const basicCommands: CompletionSuggestion[] = [
        { value: 'clear', description: 'Clear the terminal screen' },
        { value: 'cd', description: 'Change directory' },
        { value: 'ls', description: 'List directory contents' },
        { value: 'pwd', description: 'Print working directory' },
        { value: 'echo', description: 'Display a line of text' },
        { value: 'cat', description: 'Concatenate files and print on the standard output' },
        { value: 'grep', description: 'Search for patterns in files' },
        { value: 'find', description: 'Search for files in a directory hierarchy' },
        { value: 'mkdir', description: 'Make directories' },
        { value: 'rm', description: 'Remove files or directories' },
        { value: 'cp', description: 'Copy files and directories' },
        { value: 'mv', description: 'Move (rename) files' },
        { value: 'chmod', description: 'Change file mode bits' },
        { value: 'chown', description: 'Change file owner and group' },
        { value: 'ps', description: 'Report a snapshot of the current processes' },
        { value: 'top', description: 'Display Linux processes' },
        { value: 'df', description: 'Report file system disk space usage' },
        { value: 'du', description: 'Estimate file space usage' },
        { value: 'free', description: 'Display amount of free and used memory in the system' },
        { value: 'uname', description: 'Print system information' },
        { value: 'history', description: 'Show command history' },
        { value: 'help', description: 'Display help for built-in commands' }
      ];
      
      // コマンドが cd の場合はディレクトリ一覧を取得
      if (command.startsWith('cd ')) {
        const path = command.substring(3);
        const result = await executeCommand(`ls -d */ 2>/dev/null | sed 's#/##'`);
        const dirs = result.split('\n').filter(Boolean).map(dir => ({
          value: `cd ${dir}`,
          description: `Change directory to ${dir}`
        }));
        setCompletionSuggestions(dirs);
        return;
      }
      
      // コマンドが ls, cat, rm などの場合はファイル一覧を取得
      if (/^(ls|cat|rm|cp|mv) /.test(command)) {
        const result = await executeCommand('ls -a');
        const files = result.split('\n').filter(Boolean).map(file => ({
          value: `${command.split(' ')[0]} ${file}`,
          description: `${command.split(' ')[0]} ${file}`
        }));
        setCompletionSuggestions(files);
        return;
      }
      
      // 基本コマンドからフィルタリング
      const filtered = basicCommands.filter(cmd => 
        cmd.value.startsWith(command.split(' ')[0])
      );
      setCompletionSuggestions(filtered);
    } catch (error) {
      console.error('Failed to fetch completion suggestions:', error);
      setCompletionSuggestions([]);
    }
  };
  
  // コマンド実行
    const executeTerminalCommand = async (sessionId: string, command: string) => {
      // セッションを更新
      setSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) return prev; // ここは明示的に配列を返す
      
        const session = prev[sessionIndex];
        const newHistory = [...session.commandHistory, command];
        const promptText = `${username}@${hostname}:${session.currentDirectory}$ `;
      
        // 新しい出力配列
        let newOutput = [...session.output, `${promptText}${command}\n`];
      
        // 内部コマンドの処理
        if (command === 'clear') {
          newOutput = [];
          // 更新されたセッション
          const updatedSession = {
            ...session,
            output: newOutput,
            commandHistory: newHistory,
            historyIndex: -1,
            currentCommand: ''
          };
          // セッション配列を更新
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        } else if (command === 'help') {
          newOutput.push(
            'Available commands:\n' +
            '  clear - Clear the terminal screen\n' +
            '  help - Display this help message\n' +
            '  cd [directory] - Change directory\n' +
            '  ls - List files and directories\n' +
            '  history - Show command history\n' +
            '  Other Linux commands are also available\n'
          );
          // 更新されたセッション
          const updatedSession = {
            ...session,
            output: newOutput,
            commandHistory: newHistory,
            historyIndex: -1,
            currentCommand: ''
          };
          // セッション配列を更新
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        } else if (command === 'history') {
          newOutput.push(`${newHistory.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n')}\n`);
          // 更新されたセッション
          const updatedSession = {
            ...session,
            output: newOutput,
            commandHistory: newHistory,
            historyIndex: -1,
            currentCommand: ''
          };
          // セッション配列を更新
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        } else if (command.startsWith('cd ')) {
          // cd コマンドの処理
          const dir = command.substring(3);
          let newDir = session.currentDirectory;
        
          if (dir === '~' || dir === '') {
            newDir = '~';
          } else if (dir === '..') {
            if (session.currentDirectory !== '~') {
              const parts = session.currentDirectory.split('/');
              parts.pop();
              newDir = parts.join('/') || '~';
            }
          } else if (dir.startsWith('/')) {
            newDir = dir;
          } else {
            newDir = session.currentDirectory === '~' ? dir : `${session.currentDirectory}/${dir}`;
          }
        
          // 更新されたセッション
          const updatedSession = {
            ...session,
            output: newOutput,
            commandHistory: newHistory,
            historyIndex: -1,
            currentCommand: '',
            currentDirectory: newDir
          };
        
          // セッション配列を更新
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        } else {
          // 外部コマンドを実行するための非同期処理
          executeCommand(command).then(result => {
            setSessions(current => {
              const idx = current.findIndex(s => s.id === sessionId);
              if (idx === -1) return current; // 明示的に配列を返す
            
              const updatedSession = {
                ...current[idx],
                output: [...current[idx].output, result]
              };
            
              const newSessions = [...current];
              newSessions[idx] = updatedSession;
              return newSessions;
            });
          }).catch(error => {
            setSessions(current => {
              const idx = current.findIndex(s => s.id === sessionId);
              if (idx === -1) return current; // 明示的に配列を返す
            
              const updatedSession = {
                ...current[idx],
                output: [...current[idx].output, `Error: ${error.message || 'Command execution failed'}\n`]
              };
            
              const newSessions = [...current];
              newSessions[idx] = updatedSession;
              return newSessions;
            });
          });
        
          // 更新されたセッション（コマンド実行結果はまだ含まれていない）
          const updatedSession = {
            ...session,
            output: newOutput,
            commandHistory: newHistory,
            historyIndex: -1,
            currentCommand: ''
          };
        
          // セッション配列を更新
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        }
      });
    };
  
  // コマンド送信ハンドラ
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeSession.currentCommand.trim()) return;
    
    // コマンド実行
    await executeTerminalCommand(activeSessionId, activeSession.currentCommand.trim());
    
    // 補完候補をクリア
    setShowCompletions(false);
    setCompletionSuggestions([]);
  };
  
  // キー入力ハンドラ
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 補完候補が表示されている場合
    if (showCompletions && completionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCompletionIndex(prev => 
          prev < completionSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCompletionIndex(prev => prev > 0 ? prev - 1 : 0);
        return;
      }
      
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        // 選択された補完候補を適用
        const suggestion = completionSuggestions[selectedCompletionIndex];
        setSessions(prev => {
          const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
          if (sessionIndex === -1) return prev;
          
          const session = prev[sessionIndex];
          const updatedSession = {
            ...session,
            currentCommand: suggestion.value
          };
          
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        });
        
        setShowCompletions(false);
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCompletions(false);
        return;
      }
    }
    
    // 通常のキー処理
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return prev;
        
        const session = prev[sessionIndex];
        if (session.historyIndex < session.commandHistory.length - 1) {
          const newIndex = session.historyIndex + 1;
          const updatedSession = {
            ...session,
            historyIndex: newIndex,
            currentCommand: session.commandHistory[session.commandHistory.length - 1 - newIndex]
          };
          
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        }
        
        return prev;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return prev;
        
        const session = prev[sessionIndex];
        if (session.historyIndex > 0) {
          const newIndex = session.historyIndex - 1;
          const updatedSession = {
            ...session,
            historyIndex: newIndex,
            currentCommand: session.commandHistory[session.commandHistory.length - 1 - newIndex]
          };
          
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        } else if (session.historyIndex === 0) {
          const updatedSession = {
            ...session,
            historyIndex: -1,
            currentCommand: ''
          };
          
          const newSessions = [...prev];
          newSessions[sessionIndex] = updatedSession;
          return newSessions;
        }
        
        return prev;
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Tab補完
      fetchCompletionSuggestions(activeSession.currentCommand);
      setShowCompletions(true);
      setSelectedCompletionIndex(0);
    }
  };
  
  // コマンド入力変更ハンドラ
  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    setSessions(prev => {
      const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
      if (sessionIndex === -1) return prev;
      
      const session = prev[sessionIndex];
      const updatedSession = {
        ...session,
        currentCommand: value
      };
      
      const newSessions = [...prev];
      newSessions[sessionIndex] = updatedSession;
      return newSessions;
    });
    
    // 補完候補をクリア
    setShowCompletions(false);
  };
  
  // 新しいタブを追加
  const addTab = () => {
    const newSession: TerminalSession = {
      id: uuidv4(),
      title: `Terminal ${sessions.length + 1}`,
      output: ['Welcome to Ubuntu Web Terminal\nType "help" for available commands.\n'],
      commandHistory: [],
      historyIndex: -1,
      currentCommand: '',
      currentDirectory: '~'
    };
    
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
  };
  
  // タブを閉じる
  const closeTab = (id: string) => {
    if (sessions.length === 1) return; // 最後のタブは閉じない
    
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    // 閉じたタブがアクティブだった場合、別のタブをアクティブにする
    if (id === activeSessionId) {
      setActiveSessionId(newSessions[0].id);
    }
  };
  
  // タブをアクティブにする
  const activateTab = (id: string) => {
    setActiveSessionId(id);
  };
  
  // 設定メニューを開く
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // 設定メニューを閉じる
  const handleSettingsClose = () => {
    setAnchorEl(null);
  };
  
  // 設定ダイアログを開く
  const openSettings = () => {
    setSettingsOpen(true);
    handleSettingsClose();
  };
  
  // 設定を保存
  const saveSettings = (newSettings: TerminalSettings) => {
    setSettings(newSettings);
    setSettingsOpen(false);
  };
  
  // 水平分割
  const splitHorizontal = () => {
    setSplitOrientation('horizontal');
    const newSession: TerminalSession = {
      id: uuidv4(),
      title: `Terminal ${sessions.length + 1}`,
      output: ['Welcome to Ubuntu Web Terminal\nType "help" for available commands.\n'],
      commandHistory: [],
      historyIndex: -1,
      currentCommand: '',
      currentDirectory: '~'
    };
    
    setSessions([...sessions, newSession]);
    setSplitSessions([activeSessionId, newSession.id]);
    handleSettingsClose();
  };
  
  // 垂直分割
  const splitVertical = () => {
    setSplitOrientation('vertical');
    const newSession: TerminalSession = {
      id: uuidv4(),
      title: `Terminal ${sessions.length + 1}`,
      output: ['Welcome to Ubuntu Web Terminal\nType "help" for available commands.\n'],
      commandHistory: [],
      historyIndex: -1,
      currentCommand: '',
      currentDirectory: '~'
    };
    
    setSessions([...sessions, newSession]);
    setSplitSessions([activeSessionId, newSession.id]);
    handleSettingsClose();
  };
  
  // 分割を解除
  const removeSplit = () => {
    setSplitOrientation(null);
    setSplitSessions([]);
    handleSettingsClose();
  };
  
  // コピー機能
  const handleCopy = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      navigator.clipboard.writeText(selection.toString());
    }
  };
  
  // ペースト機能
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return prev;
        
        const session = prev[sessionIndex];
        const updatedSession = {
          ...session,
          currentCommand: session.currentCommand + text
        };
        
        const newSessions = [...prev];
        newSessions[sessionIndex] = updatedSession;
        return newSessions;
      });
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };
  
  // シンタックスハイライト用の関数
  const highlightCommand = (text: string) => {
    // コマンドと引数を分離
    const parts = text.split(' ');
    const command = parts[0];
    const args = parts.slice(1).join(' ');
    
    return (
      <>
        <span style={{ color: '#0DBC79' }}>{command}</span>
        {args && <span style={{ color: '#CCCCCC' }}> {args}</span>}
      </>
    );
  };
  
  // 出力のシンタックスハイライト
  const renderHighlightedOutput = (output: string) => {
    // 行ごとに処理
    return output.split('\n').map((line, index) => {
      // プロンプト行の場合
      if (line.includes(`${username}@${hostname}:`)) {
        const parts = line.split('$ ');
        return (
          <div key={index}>
            <span style={{ color: '#0DBC79' }}>{parts[0]}$ </span>
            {parts[1] && highlightCommand(parts[1])}
          </div>
        );
      }
      
      // エラーメッセージの場合
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
        return <div key={index} style={{ color: '#FF6B6B' }}>{line}</div>;
      }
      
      // 成功メッセージの場合
      if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) {
        return <div key={index} style={{ color: '#6BFF6B' }}>{line}</div>;
      }
      
      // 警告メッセージの場合
      if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('warn')) {
        return <div key={index} style={{ color: '#FFFF6B' }}>{line}</div>;
      }
      
      // ファイルパスの場合
      if (line.includes('/') && !line.includes(' ')) {
        return <div key={index} style={{ color: '#6B6BFF' }}>{line}</div>;
      }
      
      // 通常の行
      return <div key={index}>{line}</div>;
    });
  };
  
  // レンダリング
  return (
    <TerminalContainer>
      <TerminalHeader>
        <Box sx={{ flexGrow: 1 }}></Box> {/* 空のBoxで左側のスペースを確保 */}
        <IconButton size="small" color="inherit" onClick={handleCopy}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="inherit" onClick={handlePaste}>
          <ContentPasteIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="inherit" onClick={handleSettingsClick}>
          <SettingsIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleSettingsClose}
        >
          <MenuItem onClick={openSettings}>Settings</MenuItem>
          <MenuItem onClick={splitHorizontal}>Split Horizontally</MenuItem>
          <MenuItem onClick={splitVertical}>Split Vertically</MenuItem>
          {splitOrientation && <MenuItem onClick={removeSplit}>Remove Split</MenuItem>}
        </Menu>
      </TerminalHeader>
      
      {!splitOrientation ? (
        <>
          <TabBar>
            {sessions.map(session => (
              <TerminalTab
                key={session.id}
                active={session.id === activeSessionId}
                onClick={() => activateTab(session.id)}
              >
                {session.title}
                <IconButton
                  size="small"
                  sx={{ ml: 1, p: 0.5, color: 'inherit' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(session.id);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </TerminalTab>
            ))}
            <IconButton size="small" sx={{ ml: 1 }} onClick={addTab}>
              <AddIcon fontSize="small" />
            </IconButton>
          </TabBar>
          
          <TerminalOutput 
            ref={outputRef}
            sx={{ 
              fontSize: `${settings.fontSize}px`,
              fontFamily: settings.fontFamily,
              backgroundColor: settings.theme === 'dark' ? '#0C0C0C' : 
                              settings.theme === 'light' ? '#F5F5F5' : 
                              settings.theme === 'ubuntu' ? '#300A24' :
                              '#272822', // monokai
              color: settings.theme === 'light' ? '#333333' : '#CCCCCC',
            }}
          >
            {activeSession.output.map((line, index) => (
              <div key={index}>
                {settings.theme === 'light' || settings.theme === 'dark' ? 
                  renderHighlightedOutput(line) : line}
              </div>
            ))}
            
            <Box component="form" onSubmit={handleCommandSubmit} display="flex" alignItems="center">
              <CommandPrompt>{`${username}@${hostname}:${activeSession.currentDirectory}$`}</CommandPrompt>
              <TerminalInput
                fullWidth
                variant="outlined"
                value={activeSession.currentCommand}
                onChange={handleCommandChange}
                onKeyDown={handleKeyDown}
                autoFocus
                inputRef={inputRef}
                sx={{ 
                  '& .MuiInputBase-root': {
                    fontSize: `${settings.fontSize}px`,
                    fontFamily: settings.fontFamily,
                    backgroundColor: 'transparent',
                    color: settings.theme === 'light' ? '#333333' : '#CCCCCC',
                  }
                }}
              />
            </Box>
            
            {/* 補完候補 */}
            {showCompletions && completionSuggestions.length > 0 && (
              <Box 
                sx={{ 
                  mt: 1, 
                  p: 1, 
                  backgroundColor: settings.theme === 'light' ? '#E0E0E0' : '#2D2D2D',
                  borderRadius: 1,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}
              >
                {completionSuggestions.map((suggestion, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 0.5, 
                      cursor: 'pointer',
                      backgroundColor: index === selectedCompletionIndex ? 
                        (settings.theme === 'light' ? '#BBDEFB' : '#1E88E5') : 'transparent',
                      borderRadius: 0.5,
                      '&:hover': {
                        backgroundColor: settings.theme === 'light' ? '#E3F2FD' : '#2196F3'
                      }
                    }}
                    onClick={() => {
                      setSessions(prev => {
                        const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
                        if (sessionIndex === -1) return prev;
                        
                        const session = prev[sessionIndex];
                        const updatedSession = {
                          ...session,
                          currentCommand: suggestion.value
                        };
                        
                        const newSessions = [...prev];
                        newSessions[sessionIndex] = updatedSession;
                        return newSessions;
                      });
                      
                      setShowCompletions(false);
                      inputRef.current?.focus();
                    }}
                  >
                    <Typography variant="body2" fontFamily={settings.fontFamily}>
                      {suggestion.value}
                    </Typography>
                    {suggestion.description && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          color: settings.theme === 'light' ? '#757575' : '#AAAAAA'
                        }}
                      >
                        {suggestion.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </TerminalOutput>
        </>
      ) : (
        <SplitViewContainer
          sx={{
            flexDirection: splitOrientation === 'horizontal' ? 'column' : 'row'
          }}
        >
          {splitSessions.map((sessionId, index) => {
            const session = sessions.find(s => s.id === sessionId);
            if (!session) return null;
            
            return (
              <Box 
                key={sessionId}
                sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRight: splitOrientation === 'vertical' && index === 0 ? '1px solid #3F3F3F' : 'none',
                  borderBottom: splitOrientation === 'horizontal' && index === 0 ? '1px solid #3F3F3F' : 'none',
                }}
              >
                <Box 
                  sx={{ 
                    p: 0.5, 
                    backgroundColor: '#1E1E1E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#AAAAAA' }}>
                    {session.title}
                  </Typography>
                  <IconButton 
                    size="small" 
                    sx={{ color: '#AAAAAA' }}
                    onClick={() => setActiveSessionId(sessionId)}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <TerminalOutput 
                  sx={{ 
                    flex: 1,
                    fontSize: `${settings.fontSize}px`,
                    fontFamily: settings.fontFamily,
                    backgroundColor: settings.theme === 'dark' ? '#0C0C0C' : 
                                    settings.theme === 'light' ? '#F5F5F5' : 
                                    settings.theme === 'ubuntu' ? '#300A24' :
                                    '#272822', // monokai
                    color: settings.theme === 'light' ? '#333333' : '#CCCCCC',
                  }}
                >
                  {session.output.map((line, lineIndex) => (
                    <div key={lineIndex}>
                      {settings.theme === 'light' || settings.theme === 'dark' ? 
                        renderHighlightedOutput(line) : line}
                    </div>
                  ))}
                  
                  {sessionId === activeSessionId && (
                    <Box component="form" onSubmit={handleCommandSubmit} display="flex" alignItems="center">
                      <CommandPrompt>{`${username}@${hostname}:${session.currentDirectory}$`}</CommandPrompt>
                      <TerminalInput
                        fullWidth
                        variant="outlined"
                        value={session.currentCommand}
                        onChange={handleCommandChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        sx={{ 
                          '& .MuiInputBase-root': {
                            fontSize: `${settings.fontSize}px`,
                            fontFamily: settings.fontFamily,
                            backgroundColor: 'transparent',
                            color: settings.theme === 'light' ? '#333333' : '#CCCCCC',
                          }
                        }}
                      />
                    </Box>
                  )}
                </TerminalOutput>
              </Box>
            );
          })}
        </SplitViewContainer>
      )}
      
      {/* 設定ダイアログ */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Terminal Settings</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Appearance
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Theme</InputLabel>
            <Select
              value={settings.theme}
              onChange={(e) => setSettings({...settings, theme: e.target.value as any})}
              label="Theme"
            >
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="ubuntu">Ubuntu</MenuItem>
              <MenuItem value="monokai">Monokai</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
            Font Size: {settings.fontSize}px
          </Typography>
          <Slider
            value={settings.fontSize}
            onChange={(_, value) => setSettings({...settings, fontSize: value as number})}
            min={10}
            max={24}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Font Family</InputLabel>
            <Select
              value={settings.fontFamily}
              onChange={(e) => setSettings({...settings, fontFamily: e.target.value as string})}
              label="Font Family"
            >
              <MenuItem value='"Cascadia Mono", "Consolas", monospace'>Cascadia Mono</MenuItem>
              <MenuItem value='"Fira Code", monospace'>Fira Code</MenuItem>
              <MenuItem value='"Source Code Pro", monospace'>Source Code Pro</MenuItem>
              <MenuItem value='"Ubuntu Mono", monospace'>Ubuntu Mono</MenuItem>
              <MenuItem value='monospace'>Monospace</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Cursor
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Cursor Style</InputLabel>
            <Select
              value={settings.cursorStyle}
              onChange={(e) => setSettings({...settings, cursorStyle: e.target.value as any})}
              label="Cursor Style"
            >
              <MenuItem value="block">Block</MenuItem>
              <MenuItem value="underline">Underline</MenuItem>
              <MenuItem value="bar">Bar</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <Typography variant="body2" gutterBottom>
              Cursor Blink
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="body2" sx={{ mr: 1 }}>Off</Typography>
              <Switch
                checked={settings.cursorBlink}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({...settings, cursorBlink: e.target.checked})}
              />
              <Typography variant="body2" sx={{ ml: 1 }}>On</Typography>
            </Box>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Advanced
          </Typography>
          
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
            Scrollback Lines: {settings.scrollback}
          </Typography>
          <Slider
            value={settings.scrollback}
            onChange={(_, value) => setSettings({...settings, scrollback: value as number})}
            min={100}
            max={10000}
            step={100}
            marks
            valueLabelDisplay="auto"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => saveSettings(settings)} 
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </TerminalContainer>
  );
};

export default Terminal;
