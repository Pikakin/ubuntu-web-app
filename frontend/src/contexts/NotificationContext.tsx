import { Alert, AlertColor, Snackbar } from '@mui/material';
import React, { createContext, useState, useContext } from 'react';

interface Notification {
  id: number;
  message: string;
  type: AlertColor;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: AlertColor) => void;
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const addNotification = (message: string, type: AlertColor = 'info') => {
    const id = Date.now();
    const newNotification = { id, message, type };
    setNotifications((prev) => [...prev, newNotification]);
    
    if (!currentNotification) {
      setCurrentNotification(newNotification);
    }
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    
    if (currentNotification?.id === id) {
      setCurrentNotification(null);
    }
  };

  const handleClose = () => {
    if (currentNotification) {
      removeNotification(currentNotification.id);
    }
  };

  // 次の通知を表示
  React.useEffect(() => {
    if (!currentNotification && notifications.length > 0) {
      setCurrentNotification(notifications[0]);
    }
  }, [currentNotification, notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      
      {currentNotification && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleClose} 
            severity={currentNotification.type} 
            sx={{ width: '100%' }}
          >
            {currentNotification.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};
