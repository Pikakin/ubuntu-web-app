import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';
import { 
  Avatar, 
  Box, 
  Divider,
  InputAdornment,
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Paper, 
  TextField,
  Typography 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StartMenuContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 48, // タスクバーの高さ
  left: '50%',
  transform: 'translateX(-50%)',
  width: 600,
  maxHeight: 'calc(100vh - 100px)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: 10,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1100,
}));

const SearchBar = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2),
  backgroundColor: 'rgba(240, 240, 240, 0.8)',
  borderRadius: theme.shape.borderRadius,
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
  },
}));

const AppGrid = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflowY: 'auto',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: theme.spacing(2),
}));

const AppItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  '&:hover': {
    backgroundColor: 'rgba(0, 120, 215, 0.1)',
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const UserSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
}));

interface App {
  id: string;
  title: string;
  icon: string;
}

interface StartMenuProps {
  apps: App[];
  onAppClick: (appId: string) => void;
  onClose: () => void;
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

const StartMenu: React.FC<StartMenuProps> = ({ apps, onAppClick, onClose }) => {
  return (
    <StartMenuContainer>
      <SearchBar
        fullWidth
        placeholder="Type here to search"
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <AppGrid>
        {apps.map((app) => (
          <AppItem key={app.id} onClick={() => onAppClick(app.id)}>
            {getIconComponent(app.icon)}
            <Typography variant="body2" sx={{ mt: 1 }}>
              {app.title}
            </Typography>
          </AppItem>
        ))}
      </AppGrid>
      
      <UserSection>
        <Avatar sx={{ mr: 2 }}>
          <AccountCircleIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">User</Typography>
          <Typography variant="body2" color="textSecondary">
            user@ubuntu
          </Typography>
        </Box>
        <PowerSettingsNewIcon color="action" />
      </UserSection>
    </StartMenuContainer>
  );
};

export default StartMenu;
