import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Folder as FolderIcon,
  Terminal as TerminalIcon,
  Info as InfoIcon,
  Dashboard as DashboardIcon,
  MonitorHeart as MonitoringIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&:active': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}));

const IconWrapper = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  color: theme.palette.primary.main,
  width: 64,
  height: 64,
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
}));

const IconLabel = styled(Typography)(({ theme }) => ({
  color: 'white',
  fontSize: '0.75rem',
  textAlign: 'center',
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
  maxWidth: 80,
  wordWrap: 'break-word',
}));

interface DesktopIconProps {
  title: string;
  icon: string;
  onClick: () => void;
}

// 修正: アイコンマッピング関数
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    folder: <FolderIcon fontSize="large" />,
    terminal: <TerminalIcon fontSize="large" />,
    info: <InfoIcon fontSize="large" />,
    dashboard: <DashboardIcon fontSize="large" />,
    monitoring: <MonitoringIcon fontSize="large" />,
    people: <PeopleIcon fontSize="large" />,
    settings: <SettingsIcon fontSize="large" />,
  };
  
  return iconMap[iconName] || <FolderIcon fontSize="large" />;
};

const DesktopIcon: React.FC<DesktopIconProps> = ({ title, icon, onClick }) => {
  return (
    <IconContainer onClick={onClick}>
      <IconWrapper>
        {getIconComponent(icon)}
      </IconWrapper>
      <IconLabel variant="caption">
        {title}
      </IconLabel>
    </IconContainer>
  );
};

export default DesktopIcon;
