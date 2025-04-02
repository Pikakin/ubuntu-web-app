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
  backgroundColor: 'transparent',
  boxShadow: 'none',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.common.white,
  marginBottom: theme.spacing(0.5),
}));

const IconText = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  textAlign: 'center',
  fontSize: '0.75rem',
  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
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
    default:
      return <FolderIcon fontSize="large" />;
  }
};

const DesktopIcon: React.FC<DesktopIconProps> = ({ title, icon, onClick }) => {
  return (
    <IconContainer onClick={onClick}>
      <IconWrapper>
        {getIconComponent(icon)}
      </IconWrapper>
      <IconText variant="body2">{title}</IconText>
    </IconContainer>
  );
};

export default DesktopIcon;
