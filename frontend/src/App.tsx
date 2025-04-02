import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Desktop from './components/Desktop';
import Login from './components/Login';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0078d7',
    },
    secondary: {
      main: '#e1e1e1',
    },
    background: {
      default: '#f0f0f0',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初期化時に認証状態を確認
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  // ローディング中は何も表示しない
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? 
              <Navigate to="/" /> : 
              <Login onLogin={handleLogin} />
          } />
          <Route 
            path="/*" 
            element={
              isAuthenticated ? 
                <Desktop /> : 
                <Navigate to="/login" />
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
