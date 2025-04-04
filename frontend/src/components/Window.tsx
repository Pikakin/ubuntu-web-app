import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useRef, useEffect, useContext } from 'react';
import Draggable from 'react-draggable';
import { SettingsContext } from '../contexts/SettingsContext';

const WindowContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isMaximized' && prop !== 'useTransparency'
})<{ isActive: boolean; isMaximized: boolean; useTransparency?: boolean }>(({ theme, isActive, isMaximized, useTransparency }) => ({
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: isActive 
    ? '0 10px 25px rgba(0, 0, 0, 0.3)' 
    : '0 5px 15px rgba(0, 0, 0, 0.1)',
  border: isActive 
    ? `1px solid ${theme.palette.primary.main}` 
    : '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: 4,
  overflow: 'hidden',
  zIndex: isActive ? 100 : 10,
  backgroundColor: useTransparency 
    ? (theme.palette.mode === 'dark' ? 'rgba(48, 48, 48, 0.9)' : 'rgba(255, 255, 255, 0.9)')
    : theme.palette.background.paper,
  backdropFilter: useTransparency ? 'blur(10px)' : 'none',
  ...(isMaximized && {
    top: 0,
    left: 0,
    right: 0,
    bottom: 48, // タスクバーの高さ
    width: '100%',
    height: 'calc(100vh - 48px)',
    transform: 'none !important',
  }),
  ...(isMaximized === false && {
    width: 800,
    height: 600,
  }),
}));

const WindowTitleBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive'
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  backgroundColor: isActive 
    ? theme.palette.primary.main 
    : theme.palette.grey[300],
  color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
  cursor: 'move',
  userSelect: 'none',
}));

const WindowContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  backgroundColor: 'transparent',
}));

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  onClose: () => void;
  onFocus: () => void;
}

const Window: React.FC<WindowProps> = ({ 
  id, 
  title, 
  children, 
  isActive, 
  onClose, 
  onFocus 
}) => {
  const { settings } = useContext(SettingsContext);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevPosition, setPrevPosition] = useState({ x: 50, y: 50 });
  const nodeRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // ランダムな初期位置を設定
  useEffect(() => {
    const randomX = Math.floor(Math.random() * 200);
    const randomY = Math.floor(Math.random() * 100);
    setPosition({ x: randomX, y: randomY });
    setPrevPosition({ x: randomX, y: randomY });
  }, []);

  const handleDragStop = (e: any, data: { x: number; y: number }) => {
    if (!isMaximized) {
      setPosition({ x: data.x, y: data.y });
      setPrevPosition({ x: data.x, y: data.y });
    }
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setPosition(prevPosition);
    } else {
      setPrevPosition(position);
      setIsMaximized(true);
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".window-title-bar"
      position={isMaximized ? { x: 0, y: 0 } : position}
      onStop={handleDragStop}
      disabled={isMaximized}
    >
      <WindowContainer
        ref={nodeRef}
        isActive={isActive}
        isMaximized={isMaximized}
        useTransparency={settings?.useTransparency !== false}
        onClick={onFocus}
      >
        <WindowTitleBar className="window-title-bar" isActive={isActive}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              // 最小化機能は実装しない（オプション）
            }}
            sx={{ color: 'inherit' }}
          >
            <MinimizeIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize();
            }}
            sx={{ color: 'inherit' }}
          >
            <OpenInFullIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            sx={{ color: 'inherit' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </WindowTitleBar>
        <WindowContent>
          {children}
        </WindowContent>
      </WindowContainer>
    </Draggable>
  );
};

export default Window;
