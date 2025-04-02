import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Toolbar,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { createDirectory, deleteFile, getFileContent, getFileList, saveFileContent } from '../services/api';

const FileExplorerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}));

const ExplorerToolbar = styled(Toolbar)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const FileListContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  overflow: 'hidden',
}));

const SidebarContainer = styled(Paper)(({ theme }) => ({
  width: 200,
  borderRight: `1px solid ${theme.palette.divider}`,
  overflow: 'auto',
}));

const MainContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
}));

const FileContentViewer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2),
  maxHeight: 'calc(100% - 32px)',
  overflow: 'auto',
}));

const PathBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
}));

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modTime: string;
}

const FileExplorer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/home');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // ダイアログの状態
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showFileContent, setShowFileContent] = useState(false);
  
  // ファイル一覧を取得
  const fetchFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFileList(path);
      setFiles(data.files || []);
      setCurrentPath(path);
      setSelectedFile(null);
      setFileContent('');
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 初期ロード
  useEffect(() => {
    fetchFiles(currentPath);
  }, []);

  // ファイルまたはディレクトリをクリック
  const handleFileClick = async (file: FileItem) => {
    if (file.isDir) {
      fetchFiles(file.path);
    } else {
      setSelectedFile(file);
      setLoading(true);
      try {
        const content = await getFileContent(file.path);
        setFileContent(content.content || '');
        setEditedContent(content.content || '');
      } catch (err) {
        setNotification({
          message: 'Failed to load file content',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // 親ディレクトリへ移動
  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    fetchFiles(parentPath);
  };

  // ホームディレクトリへ移動
  const navigateHome = () => {
    fetchFiles('/home');
  };

  // 新しいフォルダを作成
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await createDirectory(currentPath, newFolderName);
      setNewFolderDialogOpen(false);
      setNewFolderName('');
      fetchFiles(currentPath);
      setNotification({
        message: 'Folder created successfully',
        type: 'success'
      });
    } catch (err) {
      setNotification({
        message: 'Failed to create folder',
        type: 'error'
      });
    }
  };

  // ファイルまたはディレクトリを削除
  const handleDelete = async () => {
    if (!selectedFile) return;
    
    try {
      await deleteFile(selectedFile.path);
      setDeleteDialogOpen(false);
      setSelectedFile(null);
      fetchFiles(currentPath);
      setNotification({
        message: `${selectedFile.isDir ? 'Folder' : 'File'} deleted successfully`,
        type: 'success'
      });
    } catch (err) {
      setNotification({
        message: `Failed to delete ${selectedFile.isDir ? 'folder' : 'file'}`,
        type: 'error'
      });
    }
  };

  // ファイル内容を保存
  const handleSaveContent = async () => {
    if (!selectedFile) return;
    
    try {
      await saveFileContent(selectedFile.path, editedContent);
      setFileContent(editedContent);
      setIsEditing(false);
      setNotification({
        message: 'File saved successfully',
        type: 'success'
      });
    } catch (err) {
      setNotification({
        message: 'Failed to save file',
        type: 'error'
      });
    }
  };

  // ファイルサイズをフォーマット
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <FileExplorerContainer>
      <ExplorerToolbar>
        <IconButton onClick={navigateUp} disabled={currentPath === '/'}>
          <ArrowUpwardIcon />
        </IconButton>
        <IconButton onClick={navigateHome}>
          <HomeIcon />
        </IconButton>
        <IconButton onClick={() => fetchFiles(currentPath)}>
          <RefreshIcon />
        </IconButton>
        <IconButton onClick={() => setNewFolderDialogOpen(true)}>
          <CreateNewFolderIcon />
        </IconButton>
        <IconButton 
          onClick={() => setDeleteDialogOpen(true)}
          disabled={!selectedFile}
        >
          <DeleteIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {selectedFile && !selectedFile.isDir && (
          <>
            {isEditing ? (
              <>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSaveContent}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(fileContent);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="contained" 
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </>
        )}
      </ExplorerToolbar>
      
      <PathBar>
        <Typography variant="body2" sx={{ ml: 1 }}>
          Path: {currentPath}
        </Typography>
      </PathBar>
      
      <FileListContainer>
        <SidebarContainer elevation={0}>
          <List dense>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateHome}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <Divider />
            {/* ここに追加のブックマークやショートカットを追加できます */}
          </List>
        </SidebarContainer>
        
        <MainContainer>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Typography sx={{ p: 2 }}>Loading...</Typography>
          ) : files.length === 0 ? (
            <Typography sx={{ p: 2 }}>No files found</Typography>
          ) : (
            <List>
              {files.map((file) => (
                <ListItem 
                  key={file.path}
                  component="div"
                  disablePadding
                  sx={{ 
                    bgcolor: selectedFile?.path === file.path ? 'action.selected' : 'transparent'
                  }}
                >
                  <ListItemButton onClick={() => handleFileClick(file)}>
                    <ListItemIcon>
                      {file.isDir ? <FolderIcon /> : <DescriptionIcon />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      secondary={`${formatFileSize(file.size)} - ${new Date(file.modTime).toLocaleString()}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
          
          {selectedFile && !selectedFile.isDir && (
            <FileContentViewer>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  variant="outlined"
                />
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {fileContent}
                </pre>
              )}
            </FileContentViewer>
          )}
        </MainContainer>
      </FileListContainer>
      
      {/* 新しいフォルダ作成ダイアログ */}
      <Dialog open={newFolderDialogOpen} onClose={() => setNewFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} color="primary">Create</Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedFile?.name}?
            {selectedFile?.isDir && ' This will delete all contents inside the folder.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ファイル内容表示ダイアログ */}
      <Dialog 
        open={showFileContent} 
        onClose={() => setShowFileContent(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{selectedFile?.name}</DialogTitle>
        <DialogContent>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              maxHeight: '60vh', 
              overflow: 'auto',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {fileContent}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFileContent(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </FileExplorerContainer>
  );
};

export default FileExplorer;
