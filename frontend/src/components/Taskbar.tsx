import AppsIcon from '@mui/icons-material/Apps';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

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
  return (
    <TaskbarContainer position="fixed">
      <Toolbar variant="dense">
        <StartButton onClick={onStartClick}>
          <AppsIcon />
        </StartButton>
        
        {openApps.map((app) => (
          <Tooltip key={app.id} title={app.title}>
            <TaskbarItem 
              isActive={activeApp === app.id}
              onClick={() => onAppClick(app.id)}
            >
              {getIconComponent(app.icon)}
              <Typography variant="body2" sx={{ ml: 1 }}>
                {app.title}
              </Typography>
            </TaskbarItem>
          </Tooltip>
        ))}
      </Toolbar>
    </TaskbarContainer>
  );
};

export default Taskbar;
