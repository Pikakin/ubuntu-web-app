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
  Box,
  Typography,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Key as KeyIcon
} from '@mui/icons-material';
import { ChangePasswordRequest } from '../../types/user';
import { userService } from '../../services/userService';

interface ChangePasswordDialogProps {
  open: boolean;
  username: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  username,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    username: username,
    newPassword: '',
    forceChange: false
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.newPassword) {
      setError('新しいパスワードを入力してください');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (formData.newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await userService.changePassword(formData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: username,
      newPassword: '',
      forceChange: false
    });
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  // パスワード強度チェック
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const strengthLabels = ['非常に弱い', '弱い', '普通', '強い', '非常に強い'];
  const strengthColors = ['error', 'error', 'warning', 'info', 'success'] as const;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyIcon />
          パスワード変更: {username}
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ユーザー名"
            value={username}
            disabled
            fullWidth
          />

          <TextField
            label="新しいパスワード"
            type={showPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            required
            fullWidth
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

          {/* パスワード強度表示 */}
          {formData.newPassword && (
            <Box>
              <Typography variant="caption" color={strengthColors[passwordStrength]}>
                パスワード強度: {strengthLabels[passwordStrength]}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                {[0, 1, 2, 3, 4].map((level) => (
                  <Box
                    key={level}
                    sx={{
                      height: 4,
                      flex: 1,
                      backgroundColor: level <= passwordStrength 
                        ? `${strengthColors[passwordStrength]}.main` 
                        : 'grey.300',
                      borderRadius: 2
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            label="パスワード確認"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            error={confirmPassword !== '' && formData.newPassword !== confirmPassword}
            helperText={
              confirmPassword !== '' && formData.newPassword !== confirmPassword
                ? 'パスワードが一致しません'
                : ''
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.forceChange}
                onChange={(e) => setFormData({ ...formData, forceChange: e.target.checked })}
              />
            }
            label="次回ログイン時にパスワード変更を強制"
          />

          {/* パスワード要件 */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>パスワード要件:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>6文字以上（推奨: 8文字以上）</li>
              <li>大文字・小文字・数字・記号を組み合わせる</li>
              <li>辞書にある単語や個人情報は避ける</li>
            </ul>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || formData.newPassword !== confirmPassword}
        >
          {loading ? '変更中...' : 'パスワード変更'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};