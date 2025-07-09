import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    LinearProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Switch,
    FormControlLabel,
    CircularProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Memory as MemoryIcon,
    Thermostat as ThermostatIcon,
    ElectricBolt as ElectricBoltIcon,
    Speed as SpeedIcon,
    Refresh as RefreshIcon,
    PlayArrow as PlayArrowIcon,
    Settings as SettingsIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
    getCUDAInfo,
    getCUDAToolkitInfo,
    getCuDNNInfo,
    getCUDAEnvironment,
    setCUDAEnvironment,
    runCUDATest,
    connectGPUStatsWebSocket,
} from '../services/api';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
}));

const GPUStatBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
}));

interface GPUInfo {
    name: string;
    driver_version: string;
    cuda_version: string;
    memory_total: number;
    memory_used: number;
    memory_free: number;
    gpu_utilization: number;
    memory_utilization: number;
    temperature: number;
    power_draw: number;
    power_limit: number;
    fan_speed: number;
    index: number;
}

interface CUDAToolkit {
    version: string;
    path: string;
    installed: boolean;
}

interface CuDNNInfo {
    version: string;
    path: string;
    installed: boolean;
}

interface CUDAEnvironment {
    cuda_home: string;
    cuda_path: string;
    ld_library_path: string;
    cudnn_path: string;
    nvcc_version: string;
}

const CudaManager: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [gpuInfo, setGpuInfo] = useState<GPUInfo[]>([]);
    const [cudaToolkits, setCudaToolkits] = useState<CUDAToolkit[]>([]);
    const [cudnnInfo, setCudnnInfo] = useState<CuDNNInfo | null>(null);
    const [cudaEnvironment, setCudaEnv] = useState<CUDAEnvironment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [envDialogOpen, setEnvDialogOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testResult, setTestResult] = useState<string>('');
    const [testLoading, setTestLoading] = useState(false);
    const [realtimeMonitoring, setRealtimeMonitoring] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        loadData();
        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [gpuData, toolkitData, cudnnData, envData] = await Promise.all([
                getCUDAInfo(),
                getCUDAToolkitInfo(),
                getCuDNNInfo(),
                getCUDAEnvironment(),
            ]);

            setGpuInfo(gpuData.gpus || []);
            setCudaToolkits(toolkitData.toolkits || []);
            setCudnnInfo(cudnnData.cudnn || null);
            setCudaEnv(envData.environment || null);

            if (gpuData.error) {
                setError(gpuData.error);
            }
        } catch (err) {
            setError('Failed to load CUDA information');
            console.error('Error loading CUDA data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRealtimeToggle = () => {
        if (realtimeMonitoring) {
            if (ws) {
                ws.close();
                setWs(null);
            }
            setRealtimeMonitoring(false);
        } else {
            const socket = connectGPUStatsWebSocket();
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.gpus) {
                    setGpuInfo(data.gpus);
                }
            };
            setWs(socket);
            setRealtimeMonitoring(true);
        }
    };

    const handleRunTest = async (testType: string) => {
        setTestLoading(true);
        try {
            const result = await runCUDATest(testType);
            setTestResult(result.output || 'Test completed');
            setTestDialogOpen(true);
        } catch (err) {
            setTestResult('Test failed: ' + (err as Error).message);
            setTestDialogOpen(true);
        } finally {
            setTestLoading(false);
        }
    };

    const handleSaveEnvironment = async (env: CUDAEnvironment) => {
        try {
            await setCUDAEnvironment(env);
            setCudaEnv(env);
            setEnvDialogOpen(false);
        } catch (err) {
            console.error('Error saving environment:', err);
        }
    };

    const formatMemory = (mb: number) => {
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(1)} GB`;
        }
        return `${mb} MB`;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">CUDA Manager</Typography>
                <Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={realtimeMonitoring}
                                onChange={handleRealtimeToggle}
                                color="primary"
                            />
                        }
                        label="Real-time Monitoring"
                    />
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={loadData} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {error && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab label="GPU Information" />
                <Tab label="CUDA Toolkit" />
                <Tab label="cuDNN" />
                <Tab label="Environment" />
                <Tab label="Testing" />
            </Tabs>

            {/* GPU Information Tab */}
            {tabValue === 0 && (
                <Grid container spacing={3}>
                    {gpuInfo.length === 0 ? (
                        <Grid size={12}>
                            <Alert severity="info">
                                No NVIDIA GPUs detected. Please ensure nvidia-smi is installed and working.
                            </Alert>
                        </Grid>
                    ) : (
                        gpuInfo.map((gpu, index) => (
                            <Grid size={{ xs: 12, md: 6 }} key={index}>
                                <StyledCard>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {gpu.name} (GPU {gpu.index})
                                        </Typography>

                                        <Grid container spacing={2}>
                                            <Grid size={6}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Driver Version
                                                </Typography>
                                                <Typography variant="body1">{gpu.driver_version}</Typography>
                                            </Grid>
                                            <Grid size={6}>
                                                <Typography variant="body2" color="textSecondary">
                                                    CUDA Version
                                                </Typography>
                                                <Typography variant="body1">{gpu.cuda_version}</Typography>
                                            </Grid>
                                        </Grid>

                                        <Box mt={2}>
                                            <GPUStatBox>
                                                <MemoryIcon color="primary" />
                                                <Box flex={1}>
                                                    <Typography variant="body2">
                                                        Memory: {formatMemory(gpu.memory_used)} / {formatMemory(gpu.memory_total)}
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(gpu.memory_used / gpu.memory_total) * 100}
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                            </GPUStatBox>

                                            <GPUStatBox>
                                                <SpeedIcon color="primary" />
                                                <Box flex={1}>
                                                    <Typography variant="body2">
                                                        GPU Utilization: {gpu.gpu_utilization}%
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={gpu.gpu_utilization}
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                            </GPUStatBox>

                                            <GPUStatBox>
                                                <ThermostatIcon color="primary" />
                                                <Typography variant="body2">
                                                    Temperature: {gpu.temperature}°C
                                                </Typography>
                                            </GPUStatBox>

                                            <GPUStatBox>
                                                <ElectricBoltIcon color="primary" />
                                                <Typography variant="body2">
                                                    Power: {gpu.power_draw}W / {gpu.power_limit}W
                                                </Typography>
                                            </GPUStatBox>
                                        </Box>
                                    </CardContent>
                                </StyledCard>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* CUDA Toolkit Tab */}
            {tabValue === 1 && (
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    CUDA Toolkit Installations
                                </Typography>
                                {cudaToolkits.length === 0 ? (
                                    <Alert severity="info">
                                        No CUDA Toolkit installations found. Please install CUDA Toolkit.
                                    </Alert>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Version</TableCell>
                                                    <TableCell>Path</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {cudaToolkits.map((toolkit, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{toolkit.version}</TableCell>
                                                        <TableCell>{toolkit.path}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={toolkit.installed ? 'Installed' : 'Not Installed'}
                                                                color={toolkit.installed ? 'success' : 'error'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>
            )}

            {/* cuDNN Tab */}
            {tabValue === 2 && (
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    cuDNN Information
                                </Typography>
                                {!cudnnInfo || !cudnnInfo.installed ? (
                                    <Alert severity="info">
                                        cuDNN not found. Please install cuDNN for deep learning acceleration.
                                    </Alert>
                                ) : (
                                    <Box>
                                        <Typography variant="body1" gutterBottom>
                                            Version: {cudnnInfo.version}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            Path: {cudnnInfo.path}
                                        </Typography>
                                        <Chip
                                            label="Installed"
                                            color="success"
                                            size="small"
                                        />
                                    </Box>
                                )}
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>
            )}

            {/* Environment Tab */}
            {tabValue === 3 && (
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <StyledCard>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">
                                        CUDA Environment Variables
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<SettingsIcon />}
                                        onClick={() => setEnvDialogOpen(true)}
                                    >
                                        Configure
                                    </Button>
                                </Box>

                                {cudaEnvironment && (
                                    <Box>
                                        <Typography variant="body2" color="textSecondary">CUDA_HOME</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {cudaEnvironment.cuda_home || 'Not set'}
                                        </Typography>

                                        <Typography variant="body2" color="textSecondary">NVCC Version</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {cudaEnvironment.nvcc_version || 'Not available'}
                                        </Typography>

                                        <Typography variant="body2" color="textSecondary">PATH</Typography>
                                        <Typography variant="body1" gutterBottom sx={{ wordBreak: 'break-all' }}>
                                            {cudaEnvironment.cuda_path || 'Not set'}
                                        </Typography>

                                        <Typography variant="body2" color="textSecondary">LD_LIBRARY_PATH</Typography>
                                        <Typography variant="body1" gutterBottom sx={{ wordBreak: 'break-all' }}>
                                            {cudaEnvironment.ld_library_path || 'Not set'}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>
            )}

            {/* Testing Tab */}
            {tabValue === 4 && (
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    CUDA Testing
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            startIcon={<PlayArrowIcon />}
                                            onClick={() => handleRunTest('deviceQuery')}
                                            disabled={testLoading}
                                        >
                                            Device Query Test
                                        </Button>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            startIcon={<PlayArrowIcon />}
                                            onClick={() => handleRunTest('bandwidthTest')}
                                            disabled={testLoading}
                                        >
                                            Bandwidth Test
                                        </Button>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            startIcon={<PlayArrowIcon />}
                                            onClick={() => handleRunTest('python')}
                                            disabled={testLoading}
                                        >
                                            Python CUDA Test
                                        </Button>
                                    </Grid>
                                </Grid>

                                {testLoading && (
                                    <Box mt={2} display="flex" justifyContent="center">
                                        <CircularProgress />
                                    </Box>
                                )}
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>
            )}

            {/* Environment Configuration Dialog */}
            <Dialog open={envDialogOpen} onClose={() => setEnvDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Configure CUDA Environment</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="CUDA_HOME"
                            defaultValue={cudaEnvironment?.cuda_home || ''}
                            margin="normal"
                            id="cuda-home"
                        />
                        <TextField
                            fullWidth
                            label="CUDA PATH"
                            defaultValue={cudaEnvironment?.cuda_path || ''}
                            margin="normal"
                            id="cuda-path"
                        />
                        <TextField
                            fullWidth
                            label="LD_LIBRARY_PATH"
                            defaultValue={cudaEnvironment?.ld_library_path || ''}
                            margin="normal"
                            id="ld-library-path"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEnvDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            const cudaHome = (document.getElementById('cuda-home') as HTMLInputElement)?.value;
                            const cudaPath = (document.getElementById('cuda-path') as HTMLInputElement)?.value;
                            const ldPath = (document.getElementById('ld-library-path') as HTMLInputElement)?.value;

                            handleSaveEnvironment({
                                cuda_home: cudaHome,
                                cuda_path: cudaPath,
                                ld_library_path: ldPath,
                                cudnn_path: '',
                                nvcc_version: cudaEnvironment?.nvcc_version || '',
                            });
                        }}
                        variant="contained"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Test Result Dialog */}
            <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Test Results</DialogTitle>
                <DialogContent>
                    <Paper sx={{ p: 2, mt: 1, backgroundColor: '#f5f5f5' }}>
                        <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {testResult}
                        </Typography>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CudaManager;
