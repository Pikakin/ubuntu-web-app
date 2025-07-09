import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Menu,
  MenuProps,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  GetApp as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Folder as FolderIcon,
  BugReport as BugReportIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { api } from '../services/api';

interface PythonVersion {
  version: string;
  path: string;
  current: boolean;
}

interface VirtualEnv {
  name: string;
  path: string;
  python: string;
  packages: PythonPackage[];
  active: boolean;
  created: string;
  size: string;
}

interface PythonPackage {
  name: string;
  version: string;
  latest?: string;
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

const PythonManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pythonVersions, setPythonVersions] = useState<PythonVersion[]>([]);
  const [virtualEnvs, setVirtualEnvs] = useState<VirtualEnv[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<VirtualEnv | null>(null);
  const [packages, setPackages] = useState<PythonPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [createEnvDialog, setCreateEnvDialog] = useState(false);
  const [installPackageDialog, setInstallPackageDialog] = useState(false);
  const [requirementsDialog, setRequirementsDialog] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);

  // Form states
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvType, setNewEnvType] = useState('venv');
  const [selectedPython, setSelectedPython] = useState('');
  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [requirements, setRequirements] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PythonPackage[]>([]);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextEnv, setContextEnv] = useState<VirtualEnv | null>(null);

  useEffect(() => {
    loadPythonVersions();
    loadVirtualEnvs();
  }, []);

  useEffect(() => {
    if (selectedEnv) {
      loadPackages(selectedEnv);
    }
  }, [selectedEnv]);

  const loadPythonVersions = async () => {
    try {
      const response = await api.get('/python/versions');
      setPythonVersions(response.data.versions || []);
    } catch (err) {
      setError('Failed to load Python versions');
    }
  };

  const loadVirtualEnvs = async () => {
    try {
      const response = await api.get('/python/environments');
      setVirtualEnvs(response.data.environments || []);
    } catch (err) {
      setError('Failed to load virtual environments');
    }
  };

  const loadPackages = async (env: VirtualEnv) => {
    try {
      setLoading(true);
      const response = await api.get(`/python/packages`, {
        params: {
          env_path: env.path,
          env_name: env.name,
          env_type: env.name.includes('conda') ? 'conda' : 'pip',
        },
      });
      setPackages(response.data.packages || []);
    } catch (err) {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const createVirtualEnv = async () => {
    try {
      setLoading(true);
      await api.post('/python/environments', {
        name: newEnvName,
        python_path: selectedPython,
        type: newEnvType,
      });
      setSuccess('Virtual environment created successfully');
      setCreateEnvDialog(false);
      setNewEnvName('');
      setSelectedPython('');
      setNewEnvType('venv');
      loadVirtualEnvs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create virtual environment');
    } finally {
      setLoading(false);
    }
  };

  const deleteVirtualEnv = async (env: VirtualEnv) => {
    try {
      setLoading(true);
      await api.delete('/python/environments', {
        data: {
          name: env.name,
          type: env.name.includes('conda') ? 'conda' : 'venv',
        },
        params: {
          path: env.path,
        },
      });
      setSuccess('Virtual environment deleted successfully');
      loadVirtualEnvs();
      if (selectedEnv?.name === env.name) {
        setSelectedEnv(null);
        setPackages([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete virtual environment');
    } finally {
      setLoading(false);
    }
  };

  const installPackage = async () => {
    if (!selectedEnv) return;
    
    try {
      setLoading(true);
      await api.post('/python/packages/install', {
        env_path: selectedEnv.path,
        env_name: selectedEnv.name,
        env_type: selectedEnv.name.includes('conda') ? 'conda' : 'pip',
        package_name: packageName,
        version: packageVersion,
      });
      setSuccess('Package installed successfully');
      setInstallPackageDialog(false);
      setPackageName('');
      setPackageVersion('');
      loadPackages(selectedEnv);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to install package');
    } finally {
      setLoading(false);
    }
  };

  const uninstallPackage = async (packageName: string) => {
    if (!selectedEnv) return;
    
    try {
      setLoading(true);
      await api.delete('/python/packages', {
        data: {
          env_path: selectedEnv.path,
          env_name: selectedEnv.name,
          env_type: selectedEnv.name.includes('conda') ? 'conda' : 'pip',
          package_name: packageName,
        },
      });
      setSuccess('Package uninstalled successfully');
      loadPackages(selectedEnv);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to uninstall package');
    } finally {
      setLoading(false);
    }
  };

  const generateRequirements = async () => {
    if (!selectedEnv) return;
    
    try {
      setLoading(true);
      const response = await api.get('/python/requirements', {
        params: {
          env_path: selectedEnv.path,
          env_name: selectedEnv.name,
          env_type: selectedEnv.name.includes('conda') ? 'conda' : 'pip',
        },
      });
      setRequirements(response.data.requirements);
      setRequirementsDialog(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate requirements');
    } finally {
      setLoading(false);
    }
  };

  const installRequirements = async () => {
    if (!selectedEnv) return;
    
    try {
      setLoading(true);
      await api.post('/python/requirements/install', {
        env_path: selectedEnv.path,
        env_name: selectedEnv.name,
        env_type: selectedEnv.name.includes('conda') ? 'conda' : 'pip',
        requirements: requirements,
      });
      setSuccess('Requirements installed successfully');
      setRequirementsDialog(false);
      setRequirements('');
      loadPackages(selectedEnv);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to install requirements');
    } finally {
      setLoading(false);
    }
  };

  const searchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/python/packages/search', {
        params: { q: searchQuery },
      });
      setSearchResults(response.data.packages || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search packages');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, env: VirtualEnv) => {
    setAnchorEl(event.currentTarget);
    setContextEnv(env);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setContextEnv(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Python Manager
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="python manager tabs">
          <Tab label="Python Versions" />
          <Tab label="Virtual Environments" />
          <Tab label="Package Manager" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPythonVersions}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={2}>
          {pythonVersions.map((version) => (
            // @ts-ignore
            <Grid item xs={12} md={6} key={version.version}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Python {version.version}
                      {version.current && <Chip label="Current" color="primary" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {version.path}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateEnvDialog(true)}
            sx={{ mr: 1 }}
          >
            Create Environment
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadVirtualEnvs}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={2}>
          {virtualEnvs.map((env) => (
            // @ts-ignore
            <Grid item xs={12} md={6} key={env.name}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      {env.name}
                      {env.active && <Chip label="Active" color="success" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                    <IconButton onClick={(e) => handleMenuClick(e, env)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {env.python}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {env.path}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => setSelectedEnv(env)}
                    startIcon={<FolderIcon />}
                  >
                    Manage Packages
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => deleteVirtualEnv(env)}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {!selectedEnv ? (
          <Alert severity="info">
            Please select a virtual environment from the "Virtual Environments" tab to manage packages.
          </Alert>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Packages in {selectedEnv.name}
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setInstallPackageDialog(true)}
                  sx={{ mr: 1 }}
                >
                  Install Package
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() => setSearchDialog(true)}
                  sx={{ mr: 1 }}
                >
                  Search PyPI
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={generateRequirements}
                  sx={{ mr: 1 }}
                >
                  Export Requirements
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setRequirementsDialog(true)}
                >
                  Import Requirements
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Package Name</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.name}>
                        <TableCell>{pkg.name}</TableCell>
                        <TableCell>{pkg.version}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => uninstallPackage(pkg.name)}
                            startIcon={<DeleteIcon />}
                          >
                            Uninstall
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </TabPanel>

      {/* Create Environment Dialog */}
      <Dialog open={createEnvDialog} onClose={() => setCreateEnvDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Virtual Environment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Environment Name"
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Environment Type</InputLabel>
            <Select
              value={newEnvType}
              onChange={(e) => setNewEnvType(e.target.value)}
              label="Environment Type"
            >
              <MenuItem value="venv">venv</MenuItem>
              <MenuItem value="virtualenv">virtualenv</MenuItem>
              <MenuItem value="conda">conda</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Python Version</InputLabel>
            <Select
              value={selectedPython}
              onChange={(e) => setSelectedPython(e.target.value)}
              label="Python Version"
            >
              {pythonVersions.map((version) => (
                <MenuItem key={version.version} value={version.path}>
                  Python {version.version}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateEnvDialog(false)}>Cancel</Button>
          <Button onClick={createVirtualEnv} disabled={!newEnvName || !selectedPython || loading}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Install Package Dialog */}
      <Dialog open={installPackageDialog} onClose={() => setInstallPackageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Install Package</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Package Name"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Version (optional)"
            value={packageVersion}
            onChange={(e) => setPackageVersion(e.target.value)}
            fullWidth
            placeholder="e.g., 1.0.0"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallPackageDialog(false)}>Cancel</Button>
          <Button onClick={installPackage} disabled={!packageName || loading}>
            Install
          </Button>
        </DialogActions>
      </Dialog>

      {/* Requirements Dialog */}
      <Dialog open={requirementsDialog} onClose={() => setRequirementsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Requirements.txt</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={10}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            fullWidth
            placeholder="Paste your requirements.txt content here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequirementsDialog(false)}>Cancel</Button>
          <Button onClick={installRequirements} disabled={!requirements || loading}>
            Install Requirements
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={searchDialog} onClose={() => setSearchDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Search PyPI Packages</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  searchPackages();
                }
              }}
            />
            <Button variant="contained" onClick={searchPackages} disabled={!searchQuery || loading}>
              Search
            </Button>
          </Box>
          <List>
            {searchResults.map((pkg) => (
              <ListItem key={pkg.name} divider>
                <ListItemText
                  primary={pkg.name}
                  secondary={`Version: ${pkg.version}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => {
                      setPackageName(pkg.name);
                      setPackageVersion(pkg.version);
                      setSearchDialog(false);
                      setInstallPackageDialog(true);
                    }}
                  >
                    Install
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (contextEnv) setSelectedEnv(contextEnv);
          handleMenuClose();
        }}>
          <FolderIcon sx={{ mr: 1 }} />
          Manage Packages
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextEnv) deleteVirtualEnv(contextEnv);
          handleMenuClose();
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Environment
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PythonManager;
