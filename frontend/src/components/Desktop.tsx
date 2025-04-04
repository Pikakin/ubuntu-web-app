import { Box, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { fetchSystemInfo } from '../services/api';
import Dashboard from './Dashboard';
import DesktopIcon from './DesktopIcon';
import FileExplorer from './FileExplorer';
import ServiceMonitor from './ServiceMonitor';
import Settings from './Settings';
import StartMenu from './StartMenu';
import Taskbar from './Taskbar';
import Terminal from './Terminal';
import Window from './Window';

const DesktopContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'wallpaper'
})<{ wallpaper: string }>(({ theme, wallpaper }) => ({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundImage: `url(/wallpapers/${wallpaper || 'default'}.jpg)`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
}));

const DesktopArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'taskbarPosition' && prop !== 'taskbarSize'
})<{ taskbarPosition: string; taskbarSize: number }>(({ theme, taskbarPosition, taskbarSize }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  position: 'relative',
  overflowY: 'auto',
  ...(taskbarPosition === 'bottom' && {
    paddingBottom: taskbarSize + theme.spacing(2),
  }),
  ...(taskbarPosition === 'top' && {
    paddingTop: taskbarSize + theme.spacing(2),
  }),
}));

interface App {
  id: string;
  title: string;
  icon: string;
  component: React.ReactNode;
}

const Desktop: React.FC = () => {
  const { settings } = useContext(SettingsContext);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([]);
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
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      component: <Settings />,
    },
  ];

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const openApp = (appId: string) => {
    if (!openWindows.includes(appId)) {
      setOpenWindows([...openWindows, appId]);
    }
    
    // アプリが最小化されていた場合、最小化リストから削除
    if (minimizedWindows.includes(appId)) {
      setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
    }
    
    setActiveWindow(appId);
    setStartMenuOpen(false);
  };

  const closeApp = (appId: string) => {
    setOpenWindows(openWindows.filter(id => id !== appId));
    setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
    
    if (activeWindow === appId) {
      // 閉じたウィンドウがアクティブだった場合、次のウィンドウをアクティブにする
      const remainingWindows = openWindows.filter(id => id !== appId && !minimizedWindows.includes(id));
      setActiveWindow(remainingWindows.length > 0 ? remainingWindows[0] : null);
    }
  };

  const activateWindow = (appId: string) => {
    // 最小化されていたウィンドウを復元
    if (minimizedWindows.includes(appId)) {
      setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
    }
    
    setActiveWindow(appId);
  };

  const minimizeWindow = (appId: string) => {
    if (!minimizedWindows.includes(appId)) {
      setMinimizedWindows([...minimizedWindows, appId]);
    }
    
    // 最小化したウィンドウがアクティブだった場合、次のウィンドウをアクティブにする
    if (activeWindow === appId) {
      const visibleWindows = openWindows.filter(id => !minimizedWindows.includes(id) && id !== appId);
      setActiveWindow(visibleWindows.length > 0 ? visibleWindows[0] : null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // 設定からウォールペーパーとタスクバーの位置を取得
  const wallpaper = settings?.wallpaper || 'default';
  const taskbarPosition = settings?.taskbarPosition || 'bottom';
  const taskbarSize = settings?.taskbarSize || 48;

  return (
    <DesktopContainer wallpaper={wallpaper}>
      <DesktopArea taskbarPosition={taskbarPosition} taskbarSize={taskbarSize}>
        <Grid container spacing={2} style={{ marginTop: 10 }}>
          {apps.map((app) => (
            <Grid component="div" key={app.id}>
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
              onMinimize={minimizeWindow}
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
        minimizedApps={minimizedWindows}
        onAppClick={activateWindow}
        position={taskbarPosition}
        size={taskbarSize}
      />
    </DesktopContainer>
  );
};

export default Desktop;
