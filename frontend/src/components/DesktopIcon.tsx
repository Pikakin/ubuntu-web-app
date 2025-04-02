import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';
import { Box, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const IconContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  width: 80,
  height: 80,
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  borderRadius: 8,
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
}));

const IconLabel = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  fontSize: '0.75rem',
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
}));

interface DesktopIconProps {
  title: string;
  icon: string;
  onClick: () => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'folder':
      return <FolderIcon fontSize="large" />;
    case 'settings':
      return <SettingsIcon fontSize="large" />;
    case 'info':
      return <InfoIcon fontSize="large" />;
    case 'terminal':
      return <TerminalIcon fontSize="large" />;
    case 'dashboard':
      return <DashboardIcon fontSize="large" />;
    default:
      return <FolderIcon fontSize="large" />;
  }
};

const DesktopIcon: React.FC<DesktopIconProps> = ({ title, icon, onClick }) => {
  return (
    <IconContainer onClick={onClick}>
      <Box sx={{ color: 'primary.main' }}>
        {getIconComponent(icon)}
      </Box>
      <IconLabel variant="body2">{title}</IconLabel>
    </IconContainer>
  );
};

export default DesktopIcon;
