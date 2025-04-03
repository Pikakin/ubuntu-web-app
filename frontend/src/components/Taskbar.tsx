import AppsIcon from '@mui/icons-material/Apps';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import TerminalIcon from '@mui/icons-material/Terminal';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { executeCommand } from '../services/api';

const TaskbarContainer = styled(AppBar)(({ theme }) => ({
  top: 'auto',
  bottom: 0,
  backgroundColor: 'rgba(25, 25, 25, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
  height: 48,
}));

const StartButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: 4,
  marginRight: theme.spacing(1),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const TaskbarItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive'
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  marginRight: theme.spacing(1),
  borderRadius: 4,
  cursor: 'pointer',
  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  '&:hover': {
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
  },
}));

const StatusArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  color: theme.palette.common.white,
}));

const StatusItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
  height: '100%',
}));

interface App {
  id: string;
  title: string;
  icon: string;
}

interface TaskbarProps {
  onStartClick: () => void;
  openApps: App[];
  activeApp: string | null;
  onAppClick: (appId: string) => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'folder':
      return <FolderIcon />;
    case 'settings':
      return <SettingsIcon />;
    case 'info':
      return <InfoIcon />;
    case 'terminal':
      return <TerminalIcon />;
    case 'dashboard':
      return <DashboardIcon />;
    default:
      return <FolderIcon />;
  }
};

const Taskbar: React.FC<TaskbarProps> = ({ 
  onStartClick, 
  openApps, 
  activeApp, 
  onAppClick 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');
  
  // 現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // サーバー状態を確認
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await executeCommand('echo "Server check"');
        setServerStatus('online');
      } catch (error) {
        setServerStatus('offline');
      }
    };
    
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // 30秒ごとに確認
    
    return () => clearInterval(interval);
  }, []);
  
  // 時刻のフォーマット
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // 日付のフォーマット
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <TaskbarContainer position="fixed">
      <Toolbar variant="dense" sx={{ justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1200 }}>
          <StartButton onClick={onStartClick}>
            <AppsIcon />
          </StartButton>
          
          <Box sx={{ display: 'flex', overflowX: 'auto', flexGrow: 1 }}>
            {openApps.map((app) => (
              <Tooltip key={app.id} title={app.title}>
                <TaskbarItem 
                  isActive={activeApp === app.id}
                  onClick={() => onAppClick(app.id)}
                >
                  {getIconComponent(app.icon)}
                </TaskbarItem>
              </Tooltip>
            ))}
          </Box>
          
          <StatusArea>
            <StatusItem>
              <SignalWifi4BarIcon 
                fontSize="small" 
                sx={{ 
                  mr: 0.5, 
                  color: serverStatus === 'online' ? 'success.main' : 'error.main' 
                }} 
              />
              <Typography variant="caption">
                {serverStatus === 'online' ? 'Connected' : 'Disconnected'}
              </Typography>
            </StatusItem>
            
            <StatusItem>
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                {formatTime(currentTime)}
              </Typography>
            </StatusItem>
            
            <StatusItem>
              <Typography variant="caption">
                {formatDate(currentTime)}
              </Typography>
            </StatusItem>
          </StatusArea>
        </Box>
      </Toolbar>
    </TaskbarContainer>
  );
};

export default Taskbar;
