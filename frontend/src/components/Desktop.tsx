import { AppBar, Box, IconButton, Paper, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { fetchSystemInfo } from '../services/api';
import DesktopIcon from './DesktopIcon';
import FileExplorer from './FileExplorer';
import StartMenu from './StartMenu';
import Taskbar from './Taskbar';
import Terminal from './Terminal';
import Window from './Window';

const DesktopContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundImage: 'url(/wallpapers/default.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
}));

const DesktopArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  position: 'relative',
  overflowY: 'auto',
}));

interface App {
  id: string;
  title: string;
  icon: string;
  component: React.ReactNode;
}

const Desktop: React.FC = () => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<string>('');

  useEffect(() => {
    const getSystemInfo = async () => {
      try {
        const info = await fetchSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };

    getSystemInfo();
  }, []);

  const apps: App[] = [
    {
      id: 'file-explorer',
      title: 'File Explorer',
      icon: 'folder',
      component: <FileExplorer />,
    },
    {
      id: 'terminal',
      title: 'Terminal',
      icon: 'terminal',
      component: <Terminal />,
    },
    {
      id: 'system-info',
      title: 'System Info',
      icon: 'info',
      component: (
        <Box p={2}>
          <Typography variant="h6">System Information</Typography>
          <Paper sx={{ p: 2, mt: 2, maxHeight: 400, overflow: 'auto' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{systemInfo}</pre>
          </Paper>
        </Box>
      ),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      component: (
        <Box p={2}>
          <Typography variant="h6">Settings</Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            System settings will be implemented here.
          </Typography>
        </Box>
      ),
    },
  ];

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const openApp = (appId: string) => {
    if (!openWindows.includes(appId)) {
      setOpenWindows([...openWindows, appId]);
    }
    setActiveWindow(appId);
    setStartMenuOpen(false);
  };

  const closeApp = (appId: string) => {
    setOpenWindows(openWindows.filter(id => id !== appId));
    if (activeWindow === appId) {
      setActiveWindow(openWindows.length > 1 ? openWindows.filter(id => id !== appId)[0] : null);
    }
  };

  const activateWindow = (appId: string) => {
    setActiveWindow(appId);
  };

  return (
    <DesktopContainer>
      <DesktopArea>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 1 }}>
          {apps.map((app) => (
            <Box key={app.id}>
              <DesktopIcon
                title={app.title}
                icon={app.icon}
                onClick={() => openApp(app.id)}
              />
            </Box>
          ))}
        </Box>

        {openWindows.map((appId) => {
          const app = apps.find(a => a.id === appId);
          if (!app) return null;
          
          return (
            <Window
              key={app.id}
              id={app.id}
              title={app.title}
              isActive={activeWindow === app.id}
              onClose={() => closeApp(app.id)}
              onFocus={() => activateWindow(app.id)}
            >
              {app.component}
            </Window>
          );
        })}
      </DesktopArea>

      {startMenuOpen && (
        <StartMenu 
          apps={apps} 
          onAppClick={openApp} 
          onClose={() => setStartMenuOpen(false)} 
        />
      )}

      <Taskbar 
        onStartClick={toggleStartMenu} 
        openApps={openWindows.map(id => apps.find(app => app.id === id)!)}
        activeApp={activeWindow}
        onAppClick={activateWindow}
      />
    </DesktopContainer>
  );
};

export default Desktop;
