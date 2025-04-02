import { Box, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSystemInfo } from '../services/api';
import Dashboard from './Dashboard';
import DesktopIcon from './DesktopIcon';
import FileExplorer from './FileExplorer';
import ServiceMonitor from './ServiceMonitor';
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
  const { user, logout } = useAuth();

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
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{systemInfo}</pre>
        </Box>
      ),
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'dashboard',
      component: <Dashboard />,
    },
    {
      id: 'service-monitor',
      title: 'Service Monitor',
      icon: 'settings',
      component: <ServiceMonitor />,
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

  const handleLogout = () => {
    logout();
  };

  return (
    <DesktopContainer>
      <DesktopArea>
        <Grid container spacing={2} style={{ marginTop: 10 }}>
          {apps.map((app) => (
            <Grid key={app.id}>
              <DesktopIcon
                title={app.title}
                icon={app.icon}
                onClick={() => openApp(app.id)}
              />
            </Grid>
          ))}
        </Grid>

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
          onLogout={handleLogout}
          username={user?.username || 'User'}
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
