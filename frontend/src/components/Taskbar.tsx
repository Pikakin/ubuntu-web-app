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
import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { executeCommand } from '../services/api';

const TaskbarContainer = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'taskbarPosition' && prop !== 'size' && prop !== 'useTransparency'
})<{ taskbarPosition?: string; size?: number; useTransparency?: boolean }>(({ theme, taskbarPosition, size, useTransparency }) => ({
  position: 'fixed',
  top: taskbarPosition === 'top' ? 0 : 'auto',
  bottom: taskbarPosition === 'bottom' ? 0 : 'auto',
  backgroundColor: useTransparency ? 'rgba(25, 25, 25, 0.9)' : 'rgb(25, 25, 25)',
  backdropFilter: useTransparency ? 'blur(10px)' : 'none',
  boxShadow: taskbarPosition === 'top' ? '0 2px 10px rgba(0, 0, 0, 0.1)' : '0 -2px 10px rgba(0, 0, 0, 0.1)',
  height: size || 48,
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
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'showName'
})<{ isActive: boolean; showName?: boolean }>(({ theme, isActive, showName }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, showName ? 1 : 0.5),
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
  const { settings } = useContext(SettingsContext);
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
    <TaskbarContainer 
      taskbarPosition={settings?.taskbarPosition || 'bottom'} 
      size={settings?.taskbarSize || 48} 
      useTransparency={settings?.useTransparency !== false}
    >
      <Toolbar variant="dense" sx={{ 
        justifyContent: settings?.taskbarStyle === 'centered' ? 'center' : 'flex-start',
        minHeight: settings?.taskbarSize || 48,
        padding: 0
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          maxWidth: 1200,
          px: 1
        }}>
          <StartButton onClick={onStartClick}>
            <AppsIcon />
          </StartButton>
          
          <Box sx={{ 
            display: 'flex', 
            overflowX: 'auto', 
            flexGrow: 1,
            justifyContent: settings?.taskbarStyle === 'centered' ? 'center' : 'flex-start'
          }}>
            {openApps.map((app) => (
              <Tooltip key={app.id} title={settings?.showAppNames ? '' : app.title}>
                <TaskbarItem 
                  isActive={activeApp === app.id}
                  showName={settings?.showAppNames !== false}
                  onClick={() => onAppClick(app.id)}
                >
                  {getIconComponent(app.icon)}
                  {settings?.showAppNames !== false && (
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {app.title}
                    </Typography>
                  )}
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
