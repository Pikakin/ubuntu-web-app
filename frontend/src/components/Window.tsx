import CloseIcon from '@mui/icons-material/Close';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useRef, useEffect, useContext } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { SettingsContext } from '../contexts/SettingsContext';

// リサイズハンドルのスタイル
const ResizeHandle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: 10,
  height: 10,
  background: 'transparent',
  border: 'none',
  '&.bottom-right': {
    bottom: 0,
    right: 0,
    cursor: 'nwse-resize',
  },
}));

const WindowContainer = styled(Paper, {
  shouldForwardProp: (prop) => 
    prop !== 'isActive' && 
    prop !== 'isMaximized' && 
    prop !== 'useTransparency' && 
    prop !== 'isMinimized'
})<{ 
  isActive: boolean; 
  isMaximized: boolean; 
  useTransparency?: boolean;
  isMinimized: boolean;
}>(({ theme, isActive, isMaximized, useTransparency, isMinimized }) => ({
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
  ...(isMaximized === false && isMinimized === false && {
    width: 800,
    height: 600,
  }),
  ...(isMinimized && {
    display: 'none',
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
  height: '100%',
  width: '100%',
}));

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize?: (id: string) => void;
}

const Window: React.FC<WindowProps> = ({ 
  id, 
  title, 
  children, 
  isActive, 
  onClose, 
  onFocus,
  onMinimize
}) => {
  const { settings } = useContext(SettingsContext);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prevPosition, setPrevPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [prevSize, setPrevSize] = useState({ width: 800, height: 600 });
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
      setSize(prevSize);
    } else {
      setPrevPosition(position);
      setPrevSize(size);
      setIsMaximized(true);
    }
    
    // リサイズイベントを発火して子コンポーネントに通知
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (onMinimize) {
      onMinimize(id);
    }
  };

  // タスクバーからの復元
  useEffect(() => {
    if (isActive && isMinimized) {
      setIsMinimized(false);
    }
  }, [isActive, isMinimized]);

  // リサイズハンドラ
  const onResize = (event: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    if (!isMaximized) {
      setSize({ width: size.width, height: size.height });
      
      // リサイズイベントを発火して子コンポーネントに通知
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  };

  // リサイズ可能なウィンドウをレンダリング
  const renderResizableWindow = () => {
    return (
      <Resizable
        width={size.width}
        height={size.height}
        onResize={onResize}
        handle={
          <ResizeHandle className="bottom-right" />
        }
        resizeHandles={['se']}
        minConstraints={[300, 200]}
        maxConstraints={[window.innerWidth - 50, window.innerHeight - 100]}
      >
        <WindowContainer
          ref={nodeRef}
          isActive={isActive}
          isMaximized={isMaximized}
          isMinimized={isMinimized}
          useTransparency={settings?.useTransparency !== false}
          onClick={onFocus}
          style={{ width: size.width, height: size.height }}
        >
          <WindowTitleBar className="window-title-bar" isActive={isActive}>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleMinimize();
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
              {isMaximized ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
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
      </Resizable>
    );
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".window-title-bar"
      position={isMaximized ? { x: 0, y: 0 } : position}
      onStop={handleDragStop}
      disabled={isMaximized}
    >
      {isMaximized ? (
        <WindowContainer
          ref={nodeRef}
          isActive={isActive}
          isMaximized={isMaximized}
          isMinimized={isMinimized}
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
                handleMinimize();
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
              <CloseFullscreenIcon fontSize="small" />
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
      ) : renderResizableWindow()}
    </Draggable>
  );
};

export default Window;
