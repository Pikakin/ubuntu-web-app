import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  CropSquare as MaximizeIcon,
  FilterNone as RestoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Draggable from 'react-draggable';

const WindowContainer = styled(Paper, {
  shouldForwardProp: (prop) => 
    !['isActive', 'isMaximized', 'isMinimized'].includes(prop as string)
})<{ 
  isActive: boolean; 
  isMaximized: boolean; 
  isMinimized: boolean;
}>(({ theme, isActive, isMaximized, isMinimized }) => ({
  position: 'absolute',
  minWidth: 400,
  minHeight: 300,
  display: isMinimized ? 'none' : 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  border: `2px solid ${isActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: isMaximized ? 0 : 8,
  boxShadow: isActive 
    ? theme.shadows[8] 
    : theme.shadows[4],
  zIndex: isActive ? 1000 : 100,
  ...(isMaximized && {
    top: '0 !important',
    left: '0 !important',
    width: '100vw !important',
    height: 'calc(100vh - 48px) !important',
    transform: 'none !important',
  }),
}));

const WindowHeader = styled(AppBar)(({ theme }) => ({
  cursor: 'move',
  backgroundColor: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const WindowContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  backgroundColor: theme.palette.background.default,
}));

const ResizeHandle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  backgroundColor: 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    opacity: 0.3,
  },
}));

const ResizeHandles = {
  'nw': { top: 0, left: 0, width: 10, height: 10, cursor: 'nw-resize' },
  'ne': { top: 0, right: 0, width: 10, height: 10, cursor: 'ne-resize' },
  'sw': { bottom: 0, left: 0, width: 10, height: 10, cursor: 'sw-resize' },
  'se': { bottom: 0, right: 0, width: 10, height: 10, cursor: 'se-resize' },
  'n': { top: 0, left: 10, right: 10, height: 5, cursor: 'n-resize' },
  's': { bottom: 0, left: 10, right: 10, height: 5, cursor: 's-resize' },
  'w': { left: 0, top: 10, bottom: 10, width: 5, cursor: 'w-resize' },
  'e': { right: 0, top: 10, bottom: 10, width: 5, cursor: 'e-resize' },
};

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  isMinimized?: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: (id: string) => void;
}

const Window: React.FC<WindowProps> = ({
  id,
  title,
  children,
  isActive,
  isMinimized = false,
  onClose,
  onFocus,
  onMinimize,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [windowPosition, setWindowPosition] = useState({ 
    x: Math.random() * 200 + 100,
    y: Math.random() * 200 + 100 
  });
  const [previousState, setPreviousState] = useState({ 
    size: { width: 800, height: 600 }, 
    position: { x: 100, y: 100 } 
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  
  const dragRef = useRef<HTMLDivElement>(null);

  const handleWindowClick = () => {
    if (!isActive) {
      onFocus();
    }
  };

  const handleMinimize = () => {
    onMinimize(id);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setWindowSize(previousState.size);
      setWindowPosition(previousState.position);
    } else {
      setPreviousState({
        size: windowSize,
        position: windowPosition
      });
      setIsMaximized(true);
    }
  };

  const handleHeaderDoubleClick = () => {
    handleMaximize();
  };

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMaximized) return;
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = windowSize.width;
    const startHeight = windowSize.height;
    const startLeft = windowPosition.x;
    const startTop = windowPosition.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      if (direction.includes('e')) {
        newWidth = Math.max(400, startWidth + deltaX);
      }
      if (direction.includes('w')) {
        newWidth = Math.max(400, startWidth - deltaX);
        newLeft = startLeft + (startWidth - newWidth);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(300, startHeight + deltaY);
      }
      if (direction.includes('n')) {
        newHeight = Math.max(300, startHeight - deltaY);
        newTop = startTop + (startHeight - newHeight);
      }

      setWindowSize({ width: newWidth, height: newHeight });
      setWindowPosition({ x: newLeft, y: newTop });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDrag = (e: any, data: any) => {
    if (!isMaximized) {
      setWindowPosition({ x: data.x, y: data.y });
    }
  };

  return (
    <Draggable
      handle=".window-header"
      position={isMaximized ? { x: 0, y: 0 } : windowPosition}
      onDrag={handleDrag}
      disabled={isMaximized}
      nodeRef={dragRef as React.RefObject<HTMLElement>}
    >
      <div ref={dragRef}>
        <WindowContainer
          isActive={isActive}
          isMaximized={isMaximized}
          isMinimized={isMinimized}
          onClick={handleWindowClick}
          style={{
            width: isMaximized ? '100vw' : windowSize.width,
            height: isMaximized ? 'calc(100vh - 48px)' : windowSize.height,
          }}
        >
          <WindowHeader 
            position="static" 
            className="window-header"
            onDoubleClick={handleHeaderDoubleClick}
          >
            <Toolbar variant="dense" sx={{ minHeight: 40, pr: 1 }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '0.9rem' }}>
                {title}
              </Typography>
              
              <IconButton
                size="small"
                onClick={handleMinimize}
                sx={{ color: 'white', mr: 0.5 }}
              >
                <MinimizeIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={handleMaximize}
                sx={{ color: 'white', mr: 0.5 }}
              >
                {isMaximized ? <RestoreIcon fontSize="small" /> : <MaximizeIcon fontSize="small" />}
              </IconButton>
              
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: 'white' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Toolbar>
          </WindowHeader>

          <WindowContent>
            {children}
          </WindowContent>

          {!isMaximized && (
            <>
              {Object.entries(ResizeHandles).map(([direction, style]) => (
                <ResizeHandle
                  key={direction}
                  sx={{
                    ...style,
                    cursor: isResizing && resizeDirection === direction ? style.cursor : style.cursor,
                  }}
                  onMouseDown={handleResizeStart(direction)}
                />
              ))}
            </>
          )}
        </WindowContainer>
      </div>
    </Draggable>
  );
};

export default Window;
