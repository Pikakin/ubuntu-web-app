import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Speed as SpeedIcon,
  Computer as ComputerIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { api } from '../services/api';

interface SystemResources {
  cpu: CPUStats;
  memory: MemoryStats;
  disk: DiskStats[];
  network: NetworkStats[];
}

interface CPUStats {
  usage: number;
  cores: number;
  load_average: [number, number, number];
  processes: ProcessInfo[];
}

interface MemoryStats {
  total: number;
  available: number;
  used: number;
  cached: number;
  buffers: number;
  swap: SwapStats;
}

interface SwapStats {
  total: number;
  used: number;
  free: number;
}

interface DiskStats {
  device: string;
  mountpoint: string;
  filesystem: string;
  total: number;
  used: number;
  available: number;
  usage: number;
}

interface NetworkStats {
  interface: string;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  status: string;
}

interface ProcessInfo {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  memory: number;
  vsz: number;
  rss: number;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SystemResourcesMonitor: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Process management
  const [killProcessDialog, setKillProcessDialog] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<ProcessInfo | null>(null);
  const [signal, setSignal] = useState('TERM');
  const [priorityDialog, setPriorityDialog] = useState(false);
  const [priority, setPriority] = useState(0);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextProcess, setContextProcess] = useState<ProcessInfo | null>(null);

  useEffect(() => {
    loadResources();
    const interval = setInterval(loadResources, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await api.get('/resources');
      setResources(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load system resources');
    } finally {
      setLoading(false);
    }
  };

  const killProcess = async () => {
    if (!selectedProcess) return;

    try {
      setLoading(true);
      await api.post('/resources/kill', {
        pid: selectedProcess.pid,
        signal: signal,
      });
      setSuccess(`Process ${selectedProcess.name} (PID: ${selectedProcess.pid}) killed`);
      setKillProcessDialog(false);
      setSelectedProcess(null);
      setSignal('TERM');
      loadResources();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to kill process');
    } finally {
      setLoading(false);
    }
  };

  const setProcessPriority = async () => {
    if (!selectedProcess) return;

    try {
      setLoading(true);
      await api.post('/resources/priority', {
        pid: selectedProcess.pid,
        priority: priority,
      });
      setSuccess(`Process ${selectedProcess.name} priority set to ${priority}`);
      setPriorityDialog(false);
      setSelectedProcess(null);
      setPriority(0);
      loadResources();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set process priority');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getMemoryUsageColor = (usage: number) => {
    if (usage < 50) return 'success';
    if (usage < 80) return 'warning';
    return 'error';
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, process: ProcessInfo) => {
    setAnchorEl(event.currentTarget);
    setContextProcess(process);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setContextProcess(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!resources) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        System Resources Monitor
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadResources}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="system resources tabs">
          <Tab label="Overview" />
          <Tab label="Processes" />
          <Tab label="Storage" />
          <Tab label="Network" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* CPU Card */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SpeedIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">CPU Usage</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={resources.cpu.usage} 
                  color={resources.cpu.usage > 80 ? 'error' : 'primary'}
                  sx={{ height: 10, borderRadius: 5, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {resources.cpu.usage.toFixed(1)}% ({resources.cpu.cores} cores)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Load: {resources.cpu.load_average[0].toFixed(2)}, {resources.cpu.load_average[1].toFixed(2)}, {resources.cpu.load_average[2].toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Memory Card */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MemoryIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Memory Usage</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(resources.memory.used / resources.memory.total) * 100} 
                  color={getMemoryUsageColor((resources.memory.used / resources.memory.total) * 100)}
                  sx={{ height: 10, borderRadius: 5, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {formatBytes(resources.memory.used)} / {formatBytes(resources.memory.total)} 
                  ({((resources.memory.used / resources.memory.total) * 100).toFixed(1)}%)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available: {formatBytes(resources.memory.available)}
                </Typography>
                {resources.memory.swap.total > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Swap: {formatBytes(resources.memory.swap.used)} / {formatBytes(resources.memory.swap.total)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Processes */}
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Processes by CPU</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>PID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>CPU%</TableCell>
                        <TableCell>Memory%</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resources.cpu.processes
                        .sort((a, b) => b.cpu - a.cpu)
                        .slice(0, 10)
                        .map((process) => (
                          <TableRow key={process.pid}>
                            <TableCell>{process.pid}</TableCell>
                            <TableCell>{process.name}</TableCell>
                            <TableCell>{process.user}</TableCell>
                            <TableCell>{process.cpu.toFixed(1)}%</TableCell>
                            <TableCell>{process.memory.toFixed(1)}%</TableCell>
                            <TableCell>
                              <Chip 
                                label={process.stat} 
                                size="small" 
                                color={process.stat === 'R' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>User</TableCell>
                <TableCell>CPU%</TableCell>
                <TableCell>Memory%</TableCell>
                <TableCell>VSZ</TableCell>
                <TableCell>RSS</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.cpu.processes.map((process) => (
                <TableRow key={process.pid}>
                  <TableCell>{process.pid}</TableCell>
                  <TableCell>{process.name}</TableCell>
                  <TableCell>{process.user}</TableCell>
                  <TableCell>{process.cpu.toFixed(1)}%</TableCell>
                  <TableCell>{process.memory.toFixed(1)}%</TableCell>
                  <TableCell>{formatBytes(process.vsz * 1024)}</TableCell>
                  <TableCell>{formatBytes(process.rss * 1024)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={process.stat} 
                      size="small" 
                      color={process.stat === 'R' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuClick(e, process)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={2}>
          {resources.disk.map((disk) => (
            // @ts-ignore
            <Grid item xs={12} md={6} key={disk.device}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <StorageIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">{disk.device}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {disk.mountpoint} ({disk.filesystem})
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={disk.usage} 
                    color={disk.usage > 90 ? 'error' : disk.usage > 70 ? 'warning' : 'primary'}
                    sx={{ height: 10, borderRadius: 5, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(disk.used)} / {formatBytes(disk.total)} ({disk.usage.toFixed(1)}%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available: {formatBytes(disk.available)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={2}>
          {resources.network.map((network) => (
            // @ts-ignore
            <Grid item xs={12} md={6} key={network.interface}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <NetworkIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">{network.interface}</Typography>
                    <Chip 
                      label={network.status} 
                      size="small" 
                      color={network.status === 'up' ? 'success' : 'default'}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    RX: {formatBytes(network.rx_bytes)} ({network.rx_packets} packets)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    TX: {formatBytes(network.tx_bytes)} ({network.tx_packets} packets)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Kill Process Dialog */}
      <Dialog open={killProcessDialog} onClose={() => setKillProcessDialog(false)}>
        <DialogTitle>Kill Process</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to kill process "{selectedProcess?.name}" (PID: {selectedProcess?.pid})?
          </Typography>
          <TextField
            select
            label="Signal"
            value={signal}
            onChange={(e) => setSignal(e.target.value)}
            fullWidth
            SelectProps={{
              native: true,
            }}
          >
            <option value="TERM">TERM (15) - Terminate</option>
            <option value="KILL">KILL (9) - Force Kill</option>
            <option value="INT">INT (2) - Interrupt</option>
            <option value="HUP">HUP (1) - Hang Up</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKillProcessDialog(false)}>Cancel</Button>
          <Button onClick={killProcess} color="error" disabled={loading}>
            Kill Process
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Priority Dialog */}
      <Dialog open={priorityDialog} onClose={() => setPriorityDialog(false)}>
        <DialogTitle>Set Process Priority</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Set priority for process "{selectedProcess?.name}" (PID: {selectedProcess?.pid})
          </Typography>
          <TextField
            type="number"
            label="Priority (nice value)"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            fullWidth
            inputProps={{ min: -20, max: 19 }}
            helperText="Lower values = higher priority (-20 to 19)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriorityDialog(false)}>Cancel</Button>
          <Button onClick={setProcessPriority} disabled={loading}>
            Set Priority
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setSelectedProcess(contextProcess);
          setKillProcessDialog(true);
          handleMenuClose();
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Kill Process
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedProcess(contextProcess);
          setPriorityDialog(true);
          handleMenuClose();
        }}>
          <SettingsIcon sx={{ mr: 1 }} />
          Set Priority
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SystemResourcesMonitor;
