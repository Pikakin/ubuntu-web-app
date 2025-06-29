import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { User } from '../types/user';
import { userService } from '../services/userService';
import { CreateUserDialog } from './dialogs/CreateUserDialog';
import { EditUserDialog } from './dialogs/EditUserDialog';
import { ChangePasswordDialog } from './dialogs/ChangePasswordDialog';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSystemUsers, setShowSystemUsers] = useState(false);
  
  // ダイアログ状態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // ユーザー一覧読み込み
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError('ユーザー一覧の取得に失敗しました');
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング処理
  useEffect(() => {
    let filtered = users;

    // システムユーザーフィルター
    if (!showSystemUsers) {
      filtered = filtered.filter(user => !user.isSystem);
    }

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, showSystemUsers]);

  useEffect(() => {
    loadUsers();
  }, []);

  // ユーザー削除
  const handleDeleteUser = async (username: string, removeHome: boolean) => {
    try {
      await userService.deleteUser(username, removeHome);
      await loadUsers();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError('ユーザーの削除に失敗しました');
      console.error('Failed to delete user:', err);
    }
  };

  // ユーザー作成成功時
  const handleUserCreated = () => {
    loadUsers();
    setCreateDialogOpen(false);
  };

  // ユーザー更新成功時
  const handleUserUpdated = () => {
    loadUsers();
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  // パスワード変更成功時
  const handlePasswordChanged = () => {
    setPasswordDialogOpen(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        {/* ヘッダー */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="primary" />
            <Typography variant="h5" component="h1">
              ユーザー管理
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            新規ユーザー作成
          </Button>
        </Box>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* フィルター・検索 */}
        <Box display="flex" gap={2} mb={3} alignItems="center">
          <TextField
            placeholder="ユーザー名または表示名で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showSystemUsers}
                onChange={(e) => setShowSystemUsers(e.target.checked)}
              />
            }
            label="システムユーザーを表示"
          />
        </Box>

        {/* ユーザー一覧テーブル */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ユーザー名</TableCell>
                <TableCell>表示名</TableCell>
                <TableCell>UID</TableCell>
                <TableCell>ホームディレクトリ</TableCell>
                <TableCell>シェル</TableCell>
                <TableCell>グループ</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.username}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {user.username}
                      {user.hasSudo && (
                        <Tooltip title="管理者権限">
                          <AdminIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{user.fullName || '-'}</TableCell>
                  <TableCell>{user.uid}</TableCell>
                  <TableCell>{user.homeDir}</TableCell>
                  <TableCell>{user.shell}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {user.groups.slice(0, 3).map((group) => (
                        <Chip
                          key={group}
                          label={group}
                          size="small"
                          color={group === 'sudo' ? 'warning' : 'default'}
                        />
                      ))}
                      {user.groups.length > 3 && (
                        <Chip
                          label={`+${user.groups.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {user.isLocked ? (
                        <Chip
                          icon={<LockIcon />}
                          label="ロック"
                          color="error"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<LockOpenIcon />}
                          label="アクティブ"
                          color="success"
                          size="small"
                        />
                      )}
                      {user.isSystem && (
                        <Chip
                          label="システム"
                          color="info"
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="編集">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="パスワード変更">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <KeyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={user.isSystem}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 結果が空の場合 */}
        {filteredUsers.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              {searchTerm ? '検索条件に一致するユーザーが見つかりません' : 'ユーザーが存在しません'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ダイアログ */}
      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleUserCreated}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={editDialogOpen}
            user={selectedUser}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={handleUserUpdated}
          />

          <ChangePasswordDialog
            open={passwordDialogOpen}
            username={selectedUser.username}
            onClose={() => {
              setPasswordDialogOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={handlePasswordChanged}
          />
        </>
      )}

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>ユーザー削除の確認</DialogTitle>
        <DialogContent>
          <Typography>
            ユーザー「{selectedUser?.username}」を削除しますか？
          </Typography>
          <FormControlLabel
            control={<Switch />}
            label="ホームディレクトリも削除する"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            color="error"
            onClick={() => selectedUser && handleDeleteUser(selectedUser.username, false)}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManager;