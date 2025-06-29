// 修正: 認証ヘッダーを統一するためのaxiosインスタンス作成
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// 修正: axiosインスタンスを作成して認証ヘッダーを自動付与
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// 修正: リクエストインターセプターで認証トークンを自動付与
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 認証トークンを取得する関数
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// 修正: ログイン処理のURL修正
export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await axios.post(`http://localhost:8080/api/auth/login`, { 
      username, 
      password 
    });
    
    if (response.data.token) {
      // トークンをローカルストレージに保存
      localStorage.setItem('auth_token', response.data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

// 修正: apiClientを使用するように変更
export const fetchSystemInfo = async (): Promise<string> => {
  try {
    const response = await apiClient.get('/system/info');
    
    // レスポンスの形式に合わせて整形
    const { hostname, kernel, os } = response.data;
    return `Hostname: ${hostname}\nKernel: ${kernel}\nOS: ${os}`;
  } catch (error) {
    console.error('Error fetching system info:', error);
    throw error;
  }
};

// コマンドを実行
export const executeCommand = async (command: string): Promise<string> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/system/execute`, 
      { command },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );
    return response.data.output;
  } catch (error) {
    console.error('Error executing command:', error);
    throw error;
  }
};

// サービス一覧を取得
export const getServices = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/services`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

// サービスの状態を取得
export const getServiceStatus = async (service: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/services/${service}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting service status:', error);
    throw error;
  }
};

// サービスを制御（開始、停止、再起動）
export const controlService = async (service: string, action: 'start' | 'stop' | 'restart') => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/services/control`,
      { service, action },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error controlling service:', error);
    throw error;
  }
};

// WebSocketコネクションを確立
export const connectWebSocket = (): WebSocket => {
  const token = getAuthToken();
  const ws = new WebSocket(`ws://localhost:8080/api/ws${token ? `?token=${token}` : ''}`);
  
  ws.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
};

// ファイル一覧を取得
export const getFileList = async (path: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/files`, {
      params: { path },
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting file list:', error);
    throw error;
  }
};

// ファイル内容を取得
export const getFileContent = async (path: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/files/content`, {
      params: { path },
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
};

// ディレクトリを作成
export const createDirectory = async (path: string, name: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/files/directory`, 
      { path, name },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating directory:', error);
    throw error;
  }
};

// ファイルまたはディレクトリを削除
export const deleteFile = async (path: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_BASE_URL}/files`, {
      params: { path },
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// ファイル内容を保存
export const saveFileContent = async (path: string, content: string) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/files/content`, 
      { path, content },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving file content:', error);
    throw error;
  }
};
