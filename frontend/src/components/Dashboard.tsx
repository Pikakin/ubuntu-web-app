import { Box, Grid, LinearProgress, Paper, Typography } from '@mui/material';
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

  const fetchMetrics = async () => {
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
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardContainer>
      <Typography variant="h5" gutterBottom>
        System Dashboard
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
        <MetricCard>
          <Typography variant="h6">CPU Usage</Typography>
          <LinearProgress 
            variant="determinate" 
            value={cpuUsage} 
            sx={{ height: 10, my: 1 }} 
          />
          <Typography variant="body2">{cpuUsage.toFixed(1)}%</Typography>
        </MetricCard>
        
        <MetricCard>
          <Typography variant="h6">Memory Usage</Typography>
          <LinearProgress 
            variant="determinate" 
            value={memoryUsage} 
            sx={{ height: 10, my: 1 }} 
          />
          <Typography variant="body2">{memoryUsage.toFixed(1)}%</Typography>
        </MetricCard>
        
        <MetricCard>
          <Typography variant="h6">Disk Usage</Typography>
          <LinearProgress 
            variant="determinate" 
            value={diskUsage} 
            sx={{ height: 10, my: 1 }} 
          />
          <Typography variant="body2">{diskUsage.toFixed(1)}%</Typography>
        </MetricCard>
        
        <MetricCard>
          <Typography variant="h6">System Uptime</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {uptime}
          </Typography>
        </MetricCard>
      </Box>
    </DashboardContainer>
  );
};

export default Dashboard;
