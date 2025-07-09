import AppsIcon from '@mui/icons-material/Apps';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import TerminalIcon from '@mui/icons-material/Terminal';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { executeCommand } from '../services/api';

const TaskbarContainer = styled(AppBar, {
    shouldForwardProp: (prop) => prop !== 'taskbarPosition' && prop !== 'taskbarSize' && prop !== 'useTransparency'
})<{ taskbarPosition: string; taskbarSize: number; useTransparency?: boolean }>(({ theme, taskbarPosition, taskbarSize, useTransparency }) => ({
    position: 'fixed', // AppBar の position プロパティに有効な値を設定
    top: taskbarPosition === 'top' ? 0 : 'auto',
    bottom: taskbarPosition === 'bottom' ? 0 : 'auto',
    backgroundColor: useTransparency
        ? 'rgba(25, 25, 25, 0.9)'
        : theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : 'rgba(25, 25, 25, 0.95)',
    backdropFilter: useTransparency ? 'blur(10px)' : 'none',
    boxShadow: taskbarPosition === 'top'
        ? '0 2px 10px rgba(0, 0, 0, 0.1)'
        : '0 -2px 10px rgba(0, 0, 0, 0.1)',
    height: taskbarSize,
}));

const StartButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 4,
    marginRight: theme.spacing(1),
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
    },
}));

const TaskbarItem = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isMinimized'
})<{ isActive: boolean; isMinimized: boolean }>(({ theme, isActive, isMinimized }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    marginRight: theme.spacing(1),
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: isActive
        ? 'rgba(255, 255, 255, 0.2)'
        : isMinimized
            ? 'rgba(255, 255, 255, 0.05)'
            : 'transparent',
    opacity: isMinimized ? 0.7 : 1,
    border: isMinimized ? '1px dashed rgba(255, 255, 255, 0.3)' : 'none',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        backgroundColor: isActive
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.1)',
        opacity: 1,
    },
}));

const StatusArea = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    color: theme.palette.common.white,
}));

const StatusItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
    height: '100%',
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
    minimizedApps?: string[];
    onAppClick: (appId: string) => void;
    position?: string;
    size?: number;
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
        case 'dashboard':
            return <DashboardIcon />;
        default:
            return <FolderIcon />;
    }
};

const Taskbar: React.FC<TaskbarProps> = ({
    onStartClick,
    openApps,
    activeApp,
    minimizedApps = [],
    onAppClick,
    position = 'bottom',
    size = 48
}) => {
    const { settings } = useContext(SettingsContext);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');

    // 現在時刻を更新
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // サーバー状態を確認
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                await executeCommand('echo "Server check"');
                setServerStatus('online');
            } catch (error) {
                setServerStatus('offline');
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 30000); // 30秒ごとに確認

        return () => clearInterval(interval);
    }, []);

    // 時刻のフォーマット
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 日付のフォーマット
    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // タスクバーのスタイルを設定
    const toolbarStyle = {
        minHeight: size,
        height: size,
        padding: '0 8px',
        ...(settings?.taskbarStyle === 'centered' && {
            justifyContent: 'center',
        }),
    };

    // アプリアイコンの表示方法を設定
    const showAppNames = settings?.showAppNames !== false;

    return (
        <TaskbarContainer
            taskbarPosition={position}
            taskbarSize={size}
            useTransparency={settings?.useTransparency !== false}
        >
            <Toolbar variant="dense" sx={toolbarStyle}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1200 }}>
                    <StartButton onClick={onStartClick}>
                        <AppsIcon />
                    </StartButton>

                    <Box sx={{ display: 'flex', overflowX: 'auto', flexGrow: 1 }}>
                        {openApps.map((app) => (
                            <Tooltip key={app.id} title={app.title}>
                                <TaskbarItem
                                    isActive={activeApp === app.id}
                                    isMinimized={minimizedApps.includes(app.id)}
                                    onClick={() => onAppClick(app.id)}
                                >
                                    {getIconComponent(app.icon)}
                                    {showAppNames && (
                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                            {app.title}
                                        </Typography>
                                    )}
                                </TaskbarItem>
                            </Tooltip>
                        ))}
                    </Box>

                    <StatusArea>
                        <StatusItem>
                            <SignalWifi4BarIcon
                                fontSize="small"
                                sx={{
                                    mr: 0.5,
                                    color: serverStatus === 'online' ? 'success.main' : 'error.main'
                                }}
                            />
                            <Typography variant="caption">
                                {serverStatus === 'online' ? 'Connected' : 'Disconnected'}
                            </Typography>
                        </StatusItem>

                        <StatusItem>
                            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                                {formatTime(currentTime)}
                            </Typography>
                        </StatusItem>

                        <StatusItem>
                            <Typography variant="caption">
                                {formatDate(currentTime)}
                            </Typography>
                        </StatusItem>
                    </StatusArea>
                </Box>
            </Toolbar>
        </TaskbarContainer>
    );
};

export default Taskbar;
