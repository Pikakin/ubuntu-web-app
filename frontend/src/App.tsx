import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React, { useMemo, useContext } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Desktop from './components/Desktop';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsContext, SettingsProvider } from './contexts/SettingsContext';
import './App.css';

// 認証が必要なルートのラッパー
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const { settings } = useContext(SettingsContext);

  // 設定に基づいてテーマを動的に生成
  const theme = useMemo(() => createTheme({
    palette: {
      mode: settings.darkMode ? 'dark' : 'light',
      primary: {
        main: settings.accentColor === 'blue' ? '#0078d7' : 
              settings.accentColor === 'red' ? '#e81123' : 
              settings.accentColor === 'green' ? '#107c10' : 
              settings.accentColor === 'purple' ? '#5c2d91' : 
              settings.accentColor === 'orange' ? '#d83b01' : '#0078d7',
      },
      secondary: {
        main: '#e1e1e1',
      },
      background: {
        default: settings.darkMode ? '#202020' : '#f0f0f0',
        paper: settings.darkMode ? '#303030' : '#ffffff',
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
  }), [settings]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Desktop />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
