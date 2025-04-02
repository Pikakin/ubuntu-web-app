import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import MinimizeIcon from '@mui/icons-material/Minimize';
import { Box, Divider, IconButton, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useRef, useEffect } from 'react';

const WindowContainer = styled(Paper)<{ isActive: boolean; position: { x: number; y: number } }>(
  ({ theme, isActive, position }) => ({
    position: 'absolute',
    top: position.y,
    left: position.x,
    minWidth: 400,
    minHeight: 300,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isActive
      ? '0 10px 25px rgba(0, 0, 0, 0.2)'
      : '0 4px 10px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isActive ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: isActive ? 100 : 10,
    resize: 'both',
  })
);

const WindowTitleBar = styled(Box)<{ isActive: boolean }>(({ theme, isActive }) => ({
  padding: theme.spacing(0.5, 1),
  backgroundColor: isActive ? theme.palette.primary.main : theme.palette.grey[300],
  color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'move',
}));

const WindowContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflow: 'auto',
  backgroundColor: theme.palette.background.paper,
}));

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  onClose: () => void;
  onFocus: () => void;
}

const Window: React.FC<WindowProps> = ({ id, title, children, isActive, onClose, onFocus }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!windowRef.current) return;
    
    onFocus();
    setIsDragging(true);
    
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <WindowContainer
      ref={windowRef}
      isActive={isActive}
      position={position}
      onClick={onFocus}
    >
      <WindowTitleBar isActive={isActive} onMouseDown={handleMouseDown}>
        <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box>
          <IconButton size="small" color="inherit">
            <MinimizeIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="inherit">
            <CropSquareIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="inherit" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </WindowTitleBar>
      <Divider />
      <WindowContent>{children}</WindowContent>
    </WindowContainer>
  );
};

export default Window;
