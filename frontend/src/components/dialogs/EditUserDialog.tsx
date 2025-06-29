import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { User, UpdateUserRequest } from '../../types/user';
import { userService } from '../../services/userService';

interface EditUserDialogProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  user,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    fullName: '',
    shell: '',
    groups: [],
    isLocked: false,
    hasSudo: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState('');

  const availableShells = userService.getAvailableShells();
  const commonGroups = userService.getCommonGroups();

  // ユーザー情報をフォームに設定
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        shell: user.shell || '/bin/bash',
        groups: [...user.groups],
        isLocked: user.isLocked,
        hasSudo: user.hasSudo
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await userService.updateUser(user.username, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ユーザーの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setNewGroup('');
    onClose();
  };

  const addGroup = () => {
    if (newGroup && !formData.groups.includes(newGroup)) {
      setFormData({
        ...formData,
        groups: [...formData.groups, newGroup]
      });
      setNewGroup('');
    }
  };

  const removeGroup = (groupToRemove: string) => {
    setFormData({
      ...formData,
      groups: formData.groups.filter(group => group !== groupToRemove)
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>ユーザー編集: {user.username}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* 基本情報 */}
          <TextField
            label="ユーザー名"
            value={user.username}
            disabled
            fullWidth
            helperText="ユーザー名は変更できません"
          />

          <TextField
            label="表示名（フルネーム）"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            fullWidth
          />

          {/* シェル選択 */}
          <FormControl fullWidth>
            <InputLabel>デフォルトシェル</InputLabel>
            <Select
              value={formData.shell}
              onChange={(e) => setFormData({ ...formData, shell: e.target.value })}
              label="デフォルトシェル"
            >
              {availableShells.map((shell) => (
                <MenuItem key={shell} value={shell}>
                  {shell}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ユーザー情報表示 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="UID"
              value={user.uid}
              disabled
              sx={{ flex: 1 }}
            />
            <TextField
              label="ホームディレクトリ"
              value={user.homeDir}
              disabled
              sx={{ flex: 2 }}
            />
          </Box>

          {/* アカウント状態 */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.isLocked}
                onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
              />
            }
            label="アカウントをロック"
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.hasSudo}
                onChange={(e) => setFormData({ ...formData, hasSudo: e.target.checked })}
              />
            }
            label="管理者権限（sudo）"
          />

          {/* グループ管理 */}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            所属グループ
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
              <InputLabel>グループ選択</InputLabel>
              <Select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                label="グループ選択"
              >
                {commonGroups
                  .filter(group => !formData.groups.includes(group))
                  .map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={addGroup}
              disabled={!newGroup}
              startIcon={<AddIcon />}
            >
              追加
            </Button>
          </Box>

          <TextField
            label="カスタムグループ"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addGroup();
              }
            }}
            fullWidth
            helperText="既存のグループ名を入力してEnter"
          />

          {/* 選択されたグループ表示 */}
          {formData.groups.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.groups.map((group) => (
                <Chip
                  key={group}
                  label={group}
                  onDelete={() => removeGroup(group)}
                  color={group === 'sudo' ? 'warning' : 'default'}
                />
              ))}
            </Box>
          )}

          {/* システムユーザー警告 */}
          {user.isSystem && (
            <Alert severity="warning">
              このユーザーはシステムユーザーです。変更には注意してください。
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? '更新中...' : '更新'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
