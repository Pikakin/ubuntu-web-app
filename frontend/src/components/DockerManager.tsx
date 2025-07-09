import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  LinearProgress,
  Fab,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Snackbar,
  CircularProgress,
  Divider,
  Badge,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Delete,
  Visibility,
  Add,
  GetApp,
  CloudDownload,
  NetworkWifi,
  Description,
  Computer,
  Timeline,
  CleaningServices,
  Settings,
  ExpandMore,
  FileCopy,
  Search,
  FilterList,
  Code,
  Save,
  FolderOpen,
  PlayCircle,
  StopCircle,
  RestartAlt,
  DeveloperBoard,
  Memory,
  Speed,
  NetworkCheck,
  Storage,
  Info,
  Warning,
  Error,
  CheckCircle,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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
      id={`docker-tabpanel-${index}`}
      aria-labelledby={`docker-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: string;
  ports: string[];
  mounts: string[];
  labels: Record<string, string>;
  network_mode: string;
  ip_address: string;
  size: string;
}

interface Image {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
  virtual_size: string;
  labels: string[];
}

interface Network {
  id: string;
  name: string;
  driver: string;
  scope: string;
  internal: boolean;
  gateway: string;
  subnet: string;
}

interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  labels: string;
  size: string;
}

interface ContainerStats {
  id: string;
  name: string;
  cpu_perc: string;
  mem_usage: string;
  mem_perc: string;
  net_io: string;
  block_io: string;
  pids: string;
}

interface ComposeProject {
  name: string;
  path: string;
  services: string[];
  status: string;
  containers: Container[];
  networks: string[];
  volumes: string[];
}

const DockerManager: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('auth_token');
  const [tabValue, setTabValue] = useState(0);
  const [containers, setContainers] = useState<Container[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [stats, setStats] = useState<ContainerStats[]>([]);
  const [composeProjects, setComposeProjects] = useState<ComposeProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Dialog states
  const [createContainerDialog, setCreateContainerDialog] = useState(false);
  const [pullImageDialog, setPullImageDialog] = useState(false);
  const [createNetworkDialog, setCreateNetworkDialog] = useState(false);
  const [createVolumeDialog, setCreateVolumeDialog] = useState(false);
  const [logsDialog, setLogsDialog] = useState(false);
  const [composeEditorDialog, setComposeEditorDialog] = useState(false);
  const [dockerInfoDialog, setDockerInfoDialog] = useState(false);
  
  // Selected items
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedProject, setSelectedProject] = useState<ComposeProject | null>(null);
  const [containerLogs, setContainerLogs] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [dockerInfo, setDockerInfo] = useState<any>(null);
  
  // Form states
  const [newContainer, setNewContainer] = useState({
    name: '',
    image: '',
    command: '',
    ports: [''],
    volumes: [''],
    environment: [''],
    network: '',
    auto_restart: false,
    labels: {}
  });
  
  const [newImage, setNewImage] = useState('');
  const [newNetwork, setNewNetwork] = useState({ name: '', driver: 'bridge' });
  const [newVolume, setNewVolume] = useState({ name: '', driver: 'local' });
  
  const logsRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadContainers(),
        loadImages(),
        loadNetworks(),
        loadVolumes(),
        loadComposeProjects(),
        loadStats(),
      ]);
    } catch (err) {
      setError('Failed to load Docker data');
    } finally {
      setLoading(false);
    }
  };

  const loadContainers = async () => {
    try {
      const response = await axios.get('/api/docker/containers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContainers(response.data);
    } catch (err) {
      console.error('Failed to load containers:', err);
    }
  };

  const loadImages = async () => {
    try {
      const response = await axios.get('/api/docker/images', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImages(response.data);
    } catch (err) {
      console.error('Failed to load images:', err);
    }
  };

  const loadNetworks = async () => {
    try {
      const response = await axios.get('/api/docker/networks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNetworks(response.data);
    } catch (err) {
      console.error('Failed to load networks:', err);
    }
  };

  const loadVolumes = async () => {
    try {
      const response = await axios.get('/api/docker/volumes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVolumes(response.data);
    } catch (err) {
      console.error('Failed to load volumes:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/docker/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadComposeProjects = async () => {
    try {
      const response = await axios.get('/api/docker/compose/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComposeProjects(response.data);
    } catch (err) {
      console.error('Failed to load compose projects:', err);
    }
  };

  const loadDockerInfo = async () => {
    try {
      const response = await axios.get('/api/docker/info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDockerInfo(response.data);
      setDockerInfoDialog(true);
    } catch (err) {
      setError('Failed to load Docker info');
    }
  };

  const handleContainerAction = async (action: string, containerId: string) => {
    setLoading(true);
    try {
      await axios.post(`/api/docker/containers/${containerId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Container ${action} successfully`);
      await loadContainers();
    } catch (err) {
      setError(`Failed to ${action} container`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContainer = async (containerId: string) => {
    if (!window.confirm('Are you sure you want to delete this container?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/docker/containers/${containerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Container deleted successfully');
      await loadContainers();
    } catch (err) {
      setError('Failed to delete container');
    } finally {
      setLoading(false);
    }
  };

  const handlePullImage = async () => {
    if (!newImage.trim()) return;
    
    setLoading(true);
    try {
      await axios.post('/api/docker/images/pull', { image: newImage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Image pulled successfully');
      setNewImage('');
      setPullImageDialog(false);
      await loadImages();
    } catch (err) {
      setError('Failed to pull image');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/docker/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Image deleted successfully');
      await loadImages();
    } catch (err) {
      setError('Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContainer = async () => {
    setLoading(true);
    try {
      await axios.post('/api/docker/containers', newContainer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Container created successfully');
      setCreateContainerDialog(false);
      resetContainerForm();
      await loadContainers();
    } catch (err) {
      setError('Failed to create container');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNetwork = async () => {
    setLoading(true);
    try {
      await axios.post('/api/docker/networks', newNetwork, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Network created successfully');
      setCreateNetworkDialog(false);
      setNewNetwork({ name: '', driver: 'bridge' });
      await loadNetworks();
    } catch (err) {
      setError('Failed to create network');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVolume = async () => {
    setLoading(true);
    try {
      await axios.post('/api/docker/volumes', newVolume, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Volume created successfully');
      setCreateVolumeDialog(false);
      setNewVolume({ name: '', driver: 'local' });
      await loadVolumes();
    } catch (err) {
      setError('Failed to create volume');
    } finally {
      setLoading(false);
    }
  };

  const handleShowLogs = async (container: Container) => {
    setSelectedContainer(container);
    setLogsDialog(true);
    
    try {
      const response = await axios.get(`/api/docker/containers/${container.id}/logs?tail=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContainerLogs(response.data.logs);
    } catch (err) {
      setError('Failed to load container logs');
    }
  };

  const handleStreamLogs = (container: Container) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `ws://localhost:8080/api/docker/containers/${container.id}/logs/stream?token=${token}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      setContainerLogs(prev => prev + event.data + '\n');
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleCleanup = async () => {
    if (!window.confirm('Are you sure you want to clean up unused Docker resources?')) return;
    
    setLoading(true);
    try {
      await axios.post('/api/docker/cleanup', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Docker cleanup completed');
      await loadData();
    } catch (err) {
      setError('Failed to cleanup Docker resources');
    } finally {
      setLoading(false);
    }
  };

  const resetContainerForm = () => {
    setNewContainer({
      name: '',
      image: '',
      command: '',
      ports: [''],
      volumes: [''],
      environment: [''],
      network: '',
      auto_restart: false,
      labels: {}
    });
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Up')) return 'success';
    if (status.includes('Exited')) return 'error';
    return 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('Up')) return <CheckCircle color="success" />;
    if (status.includes('Exited')) return <Error color="error" />;
    return <Warning color="warning" />;
  };

  const filteredContainers = containers.filter(container => {
    const matchesSearch = container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         container.image.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'running' && container.state === 'running') ||
                         (filterStatus === 'stopped' && container.state !== 'running');
    return matchesSearch && matchesStatus;
  });

  const runningContainers = containers.filter(c => c.state === 'running').length;
  const stoppedContainers = containers.filter(c => c.state !== 'running').length;

  return (
    <Box sx={{ width: '100%' }}>
      {loading && <LinearProgress />}
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DeveloperBoard sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Docker Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Badge badgeContent={runningContainers} color="success">
            <Chip label={`${containers.length} Containers`} />
          </Badge>
          <Badge badgeContent={images.length} color="primary">
            <Chip label="Images" />
          </Badge>
          <Tooltip title="Docker Info">
            <IconButton onClick={loadDockerInfo}>
              <Info />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cleanup">
            <IconButton onClick={handleCleanup}>
              <CleaningServices />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
        <Tab label="Containers" />
        <Tab label="Images" />
        <Tab label="Networks" />
        <Tab label="Volumes" />
        <Tab label="Compose" />
        <Tab label="Statistics" />
      </Tabs>

      {/* Containers Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search containers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search />
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="stopped">Stopped</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateContainerDialog(true)}
          >
            Create Container
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Image</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Ports</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContainers.map((container) => (
                <TableRow key={container.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(container.status)}
                      <Typography sx={{ ml: 1 }}>{container.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{container.image}</TableCell>
                  <TableCell>
                    <Chip 
                      label={container.status}
                      color={getStatusColor(container.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{container.created}</TableCell>
                  <TableCell>
                    {container.ports.map((port, index) => (
                      <Chip key={index} label={port} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {container.state === 'running' ? (
                        <IconButton
                          size="small"
                          onClick={() => handleContainerAction('stop', container.id)}
                        >
                          <Stop />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleContainerAction('start', container.id)}
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleContainerAction('restart', container.id)}
                      >
                        <Refresh />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleShowLogs(container)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteContainer(container.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Images Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<CloudDownload />}
            onClick={() => setPullImageDialog(true)}
          >
            Pull Image
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Repository</TableCell>
                <TableCell>Tag</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>{image.repository}</TableCell>
                  <TableCell>{image.tag}</TableCell>
                  <TableCell>{image.size}</TableCell>
                  <TableCell>{image.created}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Networks Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateNetworkDialog(true)}
          >
            Create Network
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Scope</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {networks.map((network) => (
                <TableRow key={network.id}>
                  <TableCell>{network.name}</TableCell>
                  <TableCell>{network.driver}</TableCell>
                  <TableCell>{network.scope}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        // Delete network logic
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Volumes Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateVolumeDialog(true)}
          >
            Create Volume
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Mountpoint</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {volumes.map((volume) => (
                <TableRow key={volume.name}>
                  <TableCell>{volume.name}</TableCell>
                  <TableCell>{volume.driver}</TableCell>
                  <TableCell>{volume.mountpoint}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        // Delete volume logic
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Compose Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setComposeEditorDialog(true)}
          >
            New Project
          </Button>
        </Box>

        <Grid container spacing={2}>
          {composeProjects.map((project) => (
            <Grid size={{ xs: 12, md: 6 }} key={project.name}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{project.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.path}
                  </Typography>
                  <Chip 
                    label={project.status}
                    color={project.status === 'running' ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<PlayCircle />}>
                    Start
                  </Button>
                  <Button size="small" startIcon={<StopCircle />}>
                    Stop
                  </Button>
                  <Button size="small" startIcon={<Code />}>
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={5}>
        <Grid container spacing={2}>
          {stats.map((stat) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={stat.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{stat.name}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Speed sx={{ mr: 1 }} />
                    <Typography variant="body2">CPU: {stat.cpu_perc}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Memory sx={{ mr: 1 }} />
                    <Typography variant="body2">Memory: {stat.mem_usage} ({stat.mem_perc})</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NetworkCheck sx={{ mr: 1 }} />
                    <Typography variant="body2">Network: {stat.net_io}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Storage sx={{ mr: 1 }} />
                    <Typography variant="body2">Block I/O: {stat.block_io}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Computer sx={{ mr: 1 }} />
                    <Typography variant="body2">PIDs: {stat.pids}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Dialogs */}
      {/* Create Container Dialog */}
      <Dialog open={createContainerDialog} onClose={() => setCreateContainerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Container</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Container Name"
            value={newContainer.name}
            onChange={(e) => setNewContainer({...newContainer, name: e.target.value})}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Image"
            value={newContainer.image}
            onChange={(e) => setNewContainer({...newContainer, image: e.target.value})}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Command"
            value={newContainer.command}
            onChange={(e) => setNewContainer({...newContainer, command: e.target.value})}
          />
          <FormControlLabel
            control={
              <Switch
                checked={newContainer.auto_restart}
                onChange={(e) => setNewContainer({...newContainer, auto_restart: e.target.checked})}
              />
            }
            label="Auto Restart"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateContainerDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateContainer} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Pull Image Dialog */}
      <Dialog open={pullImageDialog} onClose={() => setPullImageDialog(false)}>
        <DialogTitle>Pull Image</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Image Name"
            placeholder="nginx:latest"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPullImageDialog(false)}>Cancel</Button>
          <Button onClick={handlePullImage} variant="contained">Pull</Button>
        </DialogActions>
      </Dialog>

      {/* Create Network Dialog */}
      <Dialog open={createNetworkDialog} onClose={() => setCreateNetworkDialog(false)}>
        <DialogTitle>Create Network</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Network Name"
            value={newNetwork.name}
            onChange={(e) => setNewNetwork({...newNetwork, name: e.target.value})}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Driver</InputLabel>
            <Select
              value={newNetwork.driver}
              onChange={(e) => setNewNetwork({...newNetwork, driver: e.target.value})}
            >
              <MenuItem value="bridge">Bridge</MenuItem>
              <MenuItem value="host">Host</MenuItem>
              <MenuItem value="overlay">Overlay</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateNetworkDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateNetwork} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Create Volume Dialog */}
      <Dialog open={createVolumeDialog} onClose={() => setCreateVolumeDialog(false)}>
        <DialogTitle>Create Volume</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Volume Name"
            value={newVolume.name}
            onChange={(e) => setNewVolume({...newVolume, name: e.target.value})}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Driver</InputLabel>
            <Select
              value={newVolume.driver}
              onChange={(e) => setNewVolume({...newVolume, driver: e.target.value})}
            >
              <MenuItem value="local">Local</MenuItem>
              <MenuItem value="nfs">NFS</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateVolumeDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateVolume} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Container Logs Dialog */}
      <Dialog open={logsDialog} onClose={() => setLogsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Container Logs - {selectedContainer?.name}
          <Box sx={{ float: 'right' }}>
            <IconButton onClick={() => selectedContainer && handleStreamLogs(selectedContainer)}>
              <Timeline />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper
            ref={logsRef}
            sx={{
              height: 400,
              p: 2,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflow: 'auto',
              backgroundColor: '#1e1e1e',
              color: '#ffffff',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{containerLogs}</pre>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Docker Info Dialog */}
      <Dialog open={dockerInfoDialog} onClose={() => setDockerInfoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Docker System Information</DialogTitle>
        <DialogContent>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
            {JSON.stringify(dockerInfo, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDockerInfoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DockerManager;
