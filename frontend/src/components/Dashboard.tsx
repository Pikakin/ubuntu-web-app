import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Card, CardContent, LinearProgress, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { executeCommand } from '../services/api';

const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  overflow: 'auto',
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
}));

const Dashboard: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [diskUsage, setDiskUsage] = useState(0);
  const [uptime, setUptime] = useState('');
  const [processes, setProcesses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // CPU使用率を取得
      const cpuResult = await executeCommand("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'");
      setCpuUsage(parseFloat(cpuResult.trim()));

      // メモリ使用率を取得
      const memResult = await executeCommand("free | grep Mem | awk '{print $3/$2 * 100.0}'");
      setMemoryUsage(parseFloat(memResult.trim()));

      // ディスク使用率を取得
      const diskResult = await executeCommand("df / | tail -1 | awk '{print $5}' | sed 's/%//'");
      setDiskUsage(parseFloat(diskResult.trim()));

      // アップタイムを取得
      const uptimeResult = await executeCommand("uptime -p");
      setUptime(uptimeResult.trim());

      // トップ5のプロセスを取得
      const processesResult = await executeCommand("ps aux --sort=-%cpu | head -6");
      setProcesses(processesResult.trim().split('\n'));

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMetrics();
  };

  return (
    <DashboardContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          System Dashboard
        </Typography>
        <Box>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <MetricCard>
            <Typography variant="h6">CPU Usage</Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(cpuUsage, 100)} 
              sx={{ height: 10, my: 1 }} 
              color={cpuUsage > 80 ? "error" : cpuUsage > 60 ? "warning" : "primary"}
            />
            <Typography variant="body2">{cpuUsage.toFixed(1)}%</Typography>
          </MetricCard>
        </Grid>
        
        <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <MetricCard>
            <Typography variant="h6">Memory Usage</Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(memoryUsage, 100)} 
              sx={{ height: 10, my: 1 }} 
              color={memoryUsage > 80 ? "error" : memoryUsage > 60 ? "warning" : "primary"}
            />
            <Typography variant="body2">{memoryUsage.toFixed(1)}%</Typography>
          </MetricCard>
        </Grid>
        
        <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <MetricCard>
            <Typography variant="h6">Disk Usage</Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(diskUsage, 100)} 
              sx={{ height: 10, my: 1 }} 
              color={diskUsage > 80 ? "error" : diskUsage > 60 ? "warning" : "primary"}
            />
            <Typography variant="body2">{diskUsage.toFixed(1)}%</Typography>
          </MetricCard>
        </Grid>
        
        <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <MetricCard>
            <Typography variant="h6">System Uptime</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {uptime}
            </Typography>
          </MetricCard>
        </Grid>

        <Grid component="div" sx={{ gridColumn: 'span 12' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Processes
              </Typography>
              <Paper sx={{ p: 1, bgcolor: 'background.default' }}>
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: '0.8rem' }}>
                  {processes.join('\n')}
                </pre>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;
