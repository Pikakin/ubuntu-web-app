import React, { useState } from 'react';
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
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Add as AddIcon
} from '@mui/icons-material';
import { CreateUserRequest } from '../../types/user';
import { userService } from '../../services/userService';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    fullName: '',
    shell: '/bin/bash',
    createHome: true,
    initialGroups: [],
    grantSudo: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState('');

  const availableShells = userService.getAvailableShells();
  const commonGroups = userService.getCommonGroups();

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      setError('ユーザー名とパスワードは必須です');
      return;
    }

    if (formData.username.length < 3) {
      setError('ユーザー名は3文字以上で入力してください');
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await userService.createUser(formData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'ユーザーの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      shell: '/bin/bash',
      createHome: true,
      initialGroups: [],
      grantSudo: false
    });
    setError(null);
    setNewGroup('');
    onClose();
  };

  const addGroup = () => {
    if (newGroup && !formData.initialGroups.includes(newGroup)) {
      setFormData({
        ...formData,
        initialGroups: [...formData.initialGroups, newGroup]
      });
      setNewGroup('');
    }
  };

  const removeGroup = (groupToRemove: string) => {
    setFormData({
      ...formData,
      initialGroups: formData.initialGroups.filter(group => group !== groupToRemove)
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>新規ユーザー作成</DialogTitle>
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
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            fullWidth
            helperText="3文字以上の英数字とアンダースコア"
          />

          <TextField
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            fullWidth
            helperText="6文字以上"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="表示名（フルネーム）"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            fullWidth
            helperText="省略可能"
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

          {/* オプション */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.createHome}
                onChange={(e) => setFormData({ ...formData, createHome: e.target.checked })}
              />
            }
            label="ホームディレクトリを作成"
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.grantSudo}
                onChange={(e) => setFormData({ ...formData, grantSudo: e.target.checked })}
              />
            }
            label="管理者権限（sudo）を付与"
          />

          {/* グループ管理 */}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            初期グループ
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
                  .filter(group => !formData.initialGroups.includes(group))
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
          {formData.initialGroups.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.initialGroups.map((group) => (
                <Chip
                  key={group}
                  label={group}
                  onDelete={() => removeGroup(group)}
                  color={group === 'sudo' ? 'warning' : 'default'}
                />
              ))}
            </Box>
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
          {loading ? '作成中...' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};