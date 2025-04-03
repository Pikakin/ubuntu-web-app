import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
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

// 代替のグリッドレイアウト
const GridContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: theme.spacing(3),
}));

const GridItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'colSpan'
})<{ colSpan?: { xs: number; md?: number } }>(({ theme, colSpan }) => ({
  gridColumn: colSpan?.xs ? `span ${colSpan.xs}` : 'span 12',
  [theme.breakpoints.up('md')]: {
    gridColumn: colSpan?.md ? `span ${colSpan.md}` : undefined,
  },
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
    
    // 1秒ごとに更新するインターバルを設定
    const interval = setInterval(fetchMetrics, 1000);
    
    // クリーンアップ関数
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
      
      <GridContainer>
        <GridItem colSpan={{ xs: 12, md: 6 }}>
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
        </GridItem>
        
        <GridItem colSpan={{ xs: 12, md: 6 }}>
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
        </GridItem>
        
        <GridItem colSpan={{ xs: 12, md: 6 }}>
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
        </GridItem>
        
        <GridItem colSpan={{ xs: 12, md: 6 }}>
          <MetricCard>
            <Typography variant="h6">System Uptime</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {uptime}
            </Typography>
          </MetricCard>
        </GridItem>

        <GridItem colSpan={{ xs: 12 }}>
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
        </GridItem>
      </GridContainer>
    </DashboardContainer>
  );
};

export default Dashboard;
