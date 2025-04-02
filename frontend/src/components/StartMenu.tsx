import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
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
  Grid, 
  IconButton,
  InputAdornment,
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Paper, 
  TextField,
  Tooltip,
  Typography 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';

const StartMenuContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 48, // タスクバーの高さ
  left: 0,
  width: 600,
  maxHeight: 'calc(100vh - 100px)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '0 10px 0 0',
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

const AppGrid = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(2),
  overflowY: 'auto',
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
  onLogout: () => void;
  username: string;
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

const StartMenu: React.FC<StartMenuProps> = ({ apps, onAppClick, onClose, onLogout, username }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredApps = apps.filter(app => 
    app.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAppClick = (appId: string) => {
    onAppClick(appId);
    onClose();
  };

  return (
    <StartMenuContainer>
      <SearchBar
        fullWidth
        placeholder="Type here to search"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <AppGrid container spacing={2}>
        {filteredApps.map((app) => (
          <Grid 
            component="div" 
            key={app.id}
            sx={{ 
              width: { xs: '25%' }  // xs={3} の代わりに幅を25%に設定
            }}
          >
            <AppItem onClick={() => handleAppClick(app.id)}>
              {getIconComponent(app.icon)}
              <Typography variant="body2" sx={{ mt: 1 }}>
                {app.title}
              </Typography>
            </AppItem>
          </Grid>
        ))}
      </AppGrid>
      
      <UserSection>
        <Avatar sx={{ mr: 2 }}>
          <AccountCircleIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">{username}</Typography>
          <Typography variant="body2" color="textSecondary">
            {username}@ubuntu
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton color="primary" onClick={onLogout}>
            <PowerSettingsNewIcon />
          </IconButton>
        </Tooltip>
      </UserSection>
    </StartMenuContainer>
  );
};

export default StartMenu;
