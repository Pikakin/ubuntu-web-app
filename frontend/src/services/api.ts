import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// 認証トークンを取得する関数
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// ログイン処理
export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/login`, { 
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

// システム情報を取得
export const fetchSystemInfo = async (): Promise<string> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/system/info`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    return response.data.info;
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
