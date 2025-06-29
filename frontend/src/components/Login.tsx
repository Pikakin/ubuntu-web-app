import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { 
  Alert,
  Avatar,
  Box, 
  Button, 
  CircularProgress,
  Container,
  Paper, 
  TextField, 
  Typography 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100vw',
  backgroundImage: 'url(/wallpapers/login-background.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

const LoginForm = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: 10,
  maxWidth: 400,
  width: '100%',
  margin: '0 auto',
}));

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <LoginForm elevation={3}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Ubuntu Web OS
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Typography variant="body2" color="text.secondary" align="center">
              Default credentials: admin / password
            </Typography>
          </Box>
        </LoginForm>
      </Container>
    </LoginContainer>
  );
};

export default Login;
