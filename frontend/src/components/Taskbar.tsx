import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const TaskbarContainer = styled(Box)(({ theme }) => ({
  height: '48px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0, 2),
  zIndex: 1000,
}));

const TaskbarIconButton = styled(IconButton)<{ active?: boolean }>(({ theme, active }) => ({
  margin: theme.spacing(0, 0.5),
  backgroundColor: active ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
  borderRadius: '4px',
  padding: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    default:
      return <FolderIcon />;
  }
};

const Taskbar: React.FC<TaskbarProps> = ({ onStartClick, openApps, activeApp, onAppClick }) => {
  return (
    <TaskbarContainer>
      <TaskbarIconButton onClick={onStartClick}>
        <HomeIcon />
      </TaskbarIconButton>
      
      <TaskbarIconButton>
        <SearchIcon />
      </TaskbarIconButton>
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      
      {openApps.map((app) => (
        <Tooltip key={app.id} title={app.title}>
          <TaskbarIconButton 
            active={activeApp === app.id} 
            onClick={() => onAppClick(app.id)}
          >
            {getIconComponent(app.icon)}
          </TaskbarIconButton>
        </Tooltip>
      ))}
    </TaskbarContainer>
  );
};

export default Taskbar;
