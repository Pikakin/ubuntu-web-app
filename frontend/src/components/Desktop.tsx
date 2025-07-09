import React, { useState, useEffect, useContext } from 'react';
import { Box, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { fetchSystemInfo } from '../services/api';
import Dashboard from './Dashboard';
import DesktopIcon from './DesktopIcon';
import FileExplorer from './FileExplorer';
import ServiceMonitor from './ServiceMonitor';
import { UserManager } from './UserManager';
import Settings from './Settings';
import StartMenu from './StartMenu';
import Taskbar from './Taskbar';
import Terminal from './Terminal';
import Window from './Window';
import DockerManager from './DockerManager';
import CudaManager from './CudaManager';
import PythonManager from './PythonManager';
import SystemResourcesMonitor from './SystemResourcesMonitor';

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
    flex: 1,
    padding: theme.spacing(2),
    position: 'relative',
    overflow: 'hidden',
    ...(taskbarPosition === 'bottom' && {
        height: `calc(100vh - ${taskbarSize}px)`,
    }),
    ...(taskbarPosition === 'top' && {
        height: `calc(100vh - ${taskbarSize}px)`,
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
    const [windowStack, setWindowStack] = useState<string[]>([]);
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
            icon: 'monitoring',
            component: <ServiceMonitor />,
        },
        {
            id: 'user-manager',
            title: 'User Manager',
            icon: 'people',
            component: <UserManager />,
        },
        {
            id: 'docker-manager',
            title: 'Docker Manager',
            icon: 'docker',
            component: <DockerManager />,
        },
        {
            id: 'cuda-manager',
            title: 'CUDA Manager',
            icon: 'cuda',
            component: <CudaManager />,
        },
        {
            id: 'python-manager',
            title: 'Python Manager',
            icon: 'python',
            component: <PythonManager />,
        },
        {
            id: 'system-resources',
            title: 'System Resources',
            icon: 'monitoring',
            component: <SystemResourcesMonitor />,
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

    const activateWindow = (appId: string) => {
        if (minimizedWindows.includes(appId)) {
            setMinimizedWindows(prev => prev.filter(id => id !== appId));
        }

        setWindowStack(prev => {
            const newStack = prev.filter(id => id !== appId);
            return [...newStack, appId];
        });

        setActiveWindow(appId);
    };

    const openApp = (appId: string) => {
        if (!openWindows.includes(appId)) {
            setOpenWindows(prev => [...prev, appId]);
            setWindowStack(prev => [...prev, appId]);
        }

        if (minimizedWindows.includes(appId)) {
            setMinimizedWindows(prev => prev.filter(id => id !== appId));
        }

        setWindowStack(prev => {
            const newStack = prev.filter(id => id !== appId);
            return [...newStack, appId];
        });

        setActiveWindow(appId);
        setStartMenuOpen(false);
    };

    const closeApp = (appId: string) => {
        setOpenWindows(prev => prev.filter(id => id !== appId));
        setMinimizedWindows(prev => prev.filter(id => id !== appId));
        setWindowStack(prev => prev.filter(id => id !== appId));

        if (activeWindow === appId) {
            const remainingWindows = windowStack.filter(id =>
                id !== appId && openWindows.includes(id) && !minimizedWindows.includes(id)
            );
            setActiveWindow(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1] : null);
        }
    };

    const minimizeWindow = (appId: string) => {
        if (!minimizedWindows.includes(appId)) {
            setMinimizedWindows(prev => [...prev, appId]);
        }

        if (activeWindow === appId) {
            const visibleWindows = windowStack.filter((id: string) =>
                openWindows.includes(id) && !minimizedWindows.includes(id) && id !== appId
            );
            setActiveWindow(visibleWindows.length > 0 ? visibleWindows[visibleWindows.length - 1] : null);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const wallpaper = settings?.wallpaper || 'default';
    const taskbarPosition = settings?.taskbarPosition || 'bottom';
    const taskbarSize = settings?.taskbarSize || 48;

    return (
        <DesktopContainer wallpaper={wallpaper}>
            <DesktopArea taskbarPosition={taskbarPosition} taskbarSize={taskbarSize}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {apps.map((app) => (
                        <Grid key={`desktop-icon-${app.id}`} size="auto">
                            <DesktopIcon
                                title={app.title}
                                icon={app.icon}
                                onClick={() => openApp(app.id)}
                            />
                        </Grid>
                    ))}
                </Grid>

                {openWindows.map((appId: string) => {
                    const app = apps.find(a => a.id === appId);
                    if (!app) return null;

                    const zIndex = 100 + windowStack.indexOf(appId);

                    return (
                        <Window
                            key={`window-${app.id}`}
                            id={app.id}
                            title={app.title}
                            isActive={activeWindow === app.id}
                            isMinimized={minimizedWindows.includes(app.id)}
                            zIndex={zIndex}
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
                openApps={openWindows.map(id => apps.find(app => app.id === id)!).filter(Boolean)}
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
