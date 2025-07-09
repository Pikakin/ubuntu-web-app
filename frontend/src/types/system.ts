export interface SystemResources {
  timestamp: string;
  cpu: {
    usagePercent: number;
    temperature: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    available: number;
    used: number;
    percent: number;
    swap: {
      total: number;
      used: number;
      percent: number;
    };
  };
  disk: {
    total: number;
    used: number;
    available: number;
    percent: number;
    devices: Array<{
      device: string;
      mountpoint: string;
      fstype: string;
      total: number;
      used: number;
      percent: number;
    }>;
  };
  network: {
    bytesRecv: number;
    bytesSent: number;
    interfaces: Array<{
      name: string;
      bytesRecv: number;
      bytesSent: number;
      status: string;
    }>;
  };
  processes: Array<{
    pid: number;
    name: string;
    cpu: number;
    memory: number;
    status: string;
    username: string;
    command: string;
  }>;
  load: {
    load1: number;
    load5: number;
    load15: number;
  };
  uptime: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
  username: string;
  command: string;
}

export interface SystemAlert {
  type: 'cpu' | 'memory' | 'disk' | 'temperature';
  message: string;
  severity: 'warning' | 'error';
  timestamp: Date;
}
