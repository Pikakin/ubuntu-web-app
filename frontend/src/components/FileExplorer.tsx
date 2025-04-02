import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import { 
  Box, 
  Breadcrumbs, 
  Divider, 
  IconButton,
  Link, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper,
  Toolbar,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { executeCommand } from '../services/api';

const ExplorerContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const ExplorerToolbar = styled(Toolbar)(({ theme }) => ({
  padding: theme.spacing(0, 1),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ExplorerContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
}));

const Sidebar = styled(Paper)(({ theme }) => ({
  width: 200,
  overflow: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[100],
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const FileList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(1),
}));

interface FileItem {
  name: string;
  isDirectory: boolean;
  size: string;
  modified: string;
}

const FileExplorer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/home');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['/home']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const loadFiles = async (path: string) => {
    setLoading(true);
    try {
      const command = `ls -la "${path}" | awk '{if (NR>1) print $1 "," $5 "," $6 " " $7 " " $8 "," $9}'`;
      const result = await executeCommand(command);
      
      const parsedFiles: FileItem[] = result
        .split('\n')
        .filter(line => line.trim() && !line.endsWith('.') && !line.endsWith('..'))
        .map(line => {
          const [permissions, size, dateTime, name] = line.split(',');
          return {
            name,
            isDirectory: permissions.startsWith('d'),
            size: size || '0',
            modified: dateTime || '',
          };
        });
      
      setFiles(parsedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const navigateTo = (path: string) => {
    // 履歴に追加
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    setCurrentPath(path);
  };

  const handleFileClick = (file: FileItem) => {
    if (file.isDirectory) {
      navigateTo(`${currentPath}/${file.name}`);
    }
  };

  const handleBreadcrumbClick = (path: string) => {
    navigateTo(path);
  };

  const handleBackClick = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
    }
  };

  const handleForwardClick = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
    }
  };

  const handleRefreshClick = () => {
    loadFiles(currentPath);
  };

  // パンくずリストの生成
  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const path = '/' + pathParts.slice(0, index + 1).join('/');
    return (
      <Link
        key={path}
        color="inherit"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleBreadcrumbClick(path);
        }}
      >
        {part}
      </Link>
    );
  });

  return (
    <ExplorerContainer>
      <ExplorerToolbar variant="dense">
        <IconButton 
          edge="start" 
          disabled={historyIndex <= 0}
          onClick={handleBackClick}
        >
          <ArrowBackIcon />
        </IconButton>
        <IconButton 
          disabled={historyIndex >= history.length - 1}
          onClick={handleForwardClick}
        >
          <ArrowForwardIcon />
        </IconButton>
        <IconButton onClick={handleRefreshClick}>
          <RefreshIcon />
        </IconButton>
        <Breadcrumbs sx={{ ml: 2, flexGrow: 1 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleBreadcrumbClick('/');
            }}
          >
            Root
          </Link>
          {breadcrumbs}
        </Breadcrumbs>
      </ExplorerToolbar>
      
      <ExplorerContent>
        <Sidebar elevation={0}>
          <List dense>
            <ListItem onClick={() => navigateTo('/home')}>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem component="button" onClick={() => navigateTo('/usr')}>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="Applications" />
            </ListItem>
            <ListItem component="button" onClick={() => navigateTo('/etc')}>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="Configuration" />
            </ListItem>
          </List>
        </Sidebar>
        
        <FileList>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <List>
              {files.map((file) => (
                <ListItem 
                  component="button"
                  key={file.name}
                  onClick={() => handleFileClick(file)}
                >
                  <ListItemIcon>
                    {file.isDirectory ? <FolderIcon /> : <InsertDriveFileIcon />}
                  </ListItemIcon>
                  <ListItemText primary={file.name} />
                </ListItem>
              ))}
            </List>
          )}
        </FileList>
      </ExplorerContent>
    </ExplorerContainer>
  );
};

export default FileExplorer;
