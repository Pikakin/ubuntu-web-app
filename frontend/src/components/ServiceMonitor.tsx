import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StopIcon from '@mui/icons-material/Stop';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { executeCommand } from '../services/api';

const ServiceMonitorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}));

const MonitorToolbar = styled(Toolbar)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ServiceTable = styled(TableContainer)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
}));

const ServiceDetailContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2),
  maxHeight: 300,
  overflow: 'auto',
}));

interface Service {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'failed' | 'unknown';
  loaded: boolean;
}

const ServiceMonitor: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceDetail, setServiceDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean, action: string, service: string} | null>(null);
  const [filterText, setFilterText] = useState('');

  // サービス一覧を取得
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await executeCommand('systemctl list-units --type=service --all --no-pager');
      
      // 出力を解析してサービス一覧を作成
      const lines = result.split('\n').filter(line => line.includes('.service'));
      const parsedServices: Service[] = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        const name = parts[0].replace('.service', '');
        const loaded = parts[1] === 'loaded';
        
        let status: 'active' | 'inactive' | 'failed' | 'unknown' = 'unknown';
        if (parts[2] === 'active') status = 'active';
        else if (parts[2] === 'inactive') status = 'inactive';
        else if (parts[2] === 'failed') status = 'failed';
        
        // 説明部分を抽出
        const descriptionStart = line.indexOf(parts[3]);
        const description = line.substring(descriptionStart).trim();
        
        return { name, description, status, loaded };
      });
      
      setServices(parsedServices);
    } catch (err) {
      setError('Failed to load services');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 初期ロード
  useEffect(() => {
    fetchServices();
  }, []);

  // サービスの詳細情報を取得
  const fetchServiceDetail = async (serviceName: string) => {
    setLoading(true);
    try {
      const result = await executeCommand(`systemctl status ${serviceName}`);
      setServiceDetail(result);
    } catch (err) {
      setNotification({
        message: 'Failed to load service details',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // サービスをクリック
  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    fetchServiceDetail(service.name);
  };

  // サービスを制御（開始、停止、再起動）
  const controlService = async (action: string, serviceName: string) => {
    setLoading(true);
    try {
      await executeCommand(`systemctl ${action} ${serviceName}`);
      fetchServices();
      if (selectedService?.name === serviceName) {
        fetchServiceDetail(serviceName);
      }
      setNotification({
        message: `Service ${action} successful`,
        type: 'success'
      });
    } catch (err) {
      setNotification({
        message: `Failed to ${action} service`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 確認ダイアログを表示
  const showConfirmDialog = (action: string, serviceName: string) => {
    setConfirmDialog({
      open: true,
      action,
      service: serviceName
    });
  };

  // 確認ダイアログでアクションを実行
  const handleConfirmAction = () => {
    if (confirmDialog) {
      controlService(confirmDialog.action, confirmDialog.service);
      setConfirmDialog(null);
    }
  };

  // フィルタリングされたサービス一覧
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(filterText.toLowerCase()) ||
    service.description.toLowerCase().includes(filterText.toLowerCase())
  );

  // サービスのステータスに応じた色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'failed': return 'error';
      default: return 'warning';
    }
  };

  return (
    <ServiceMonitorContainer>
      <MonitorToolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Service Monitor
        </Typography>
        <IconButton onClick={fetchServices}>
          <RefreshIcon />
        </IconButton>
      </MonitorToolbar>
      
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Filter services..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          size="small"
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      
      <ServiceTable>
        {loading && services.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Service Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow 
                  key={service.name}
                  hover
                  selected={selectedService?.name === service.name}
                  onClick={() => handleServiceClick(service)}
                >
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>
                    <Chip 
                      label={service.status} 
                      color={getStatusColor(service.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirmDialog('start', service.name);
                      }}
                      disabled={service.status === 'active'}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirmDialog('stop', service.name);
                      }}
                      disabled={service.status !== 'active'}
                    >
                      <StopIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirmDialog('restart', service.name);
                      }}
                      disabled={service.status !== 'active'}
                    >
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No services found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </ServiceTable>
      
      {selectedService && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">
              Service Details: {selectedService.name}
            </Typography>
            <ServiceDetailContainer>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {loading ? 'Loading...' : serviceDetail}
              </pre>
            </ServiceDetailContainer>
          </Box>
        </>
      )}
      
      {/* 確認ダイアログ */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {confirmDialog?.action} the service {confirmDialog?.service}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="primary">Confirm</Button>
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
    </ServiceMonitorContainer>
  );
};

export default ServiceMonitor;
