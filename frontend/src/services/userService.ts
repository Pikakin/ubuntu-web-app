import axios from 'axios';
import { User, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from '../types/user';

// 修正: APIベースURLを完全なURLに変更
const API_BASE = 'http://localhost:8080/api/users';

// 修正: 認証ヘッダーを自動付与するaxiosインスタンス作成
const apiClient = axios.create({
  baseURL: API_BASE,
});

// 修正: リクエストインターセプターで認証トークンを自動付与
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userService = {
  // 修正: apiClientを使用するように変更
  async getUsers(): Promise<{ users: User[]; total: number }> {
    const response = await apiClient.get('');
    return response.data;
  },

  // ユーザー作成
  async createUser(userData: CreateUserRequest): Promise<void> {
    await apiClient.post('', userData);
  },

  // ユーザー更新
  async updateUser(username: string, userData: UpdateUserRequest): Promise<void> {
    await apiClient.put(`/${username}`, userData);
  },

  // ユーザー削除
  async deleteUser(username: string, removeHome: boolean = false): Promise<void> {
    await apiClient.delete(`/${username}?removeHome=${removeHome}`);
  },

  // パスワード変更
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/change-password', passwordData);
  },

  // 利用可能なシェル一覧取得
  getAvailableShells(): string[] {
    return [
      '/bin/bash',
      '/bin/zsh',
      '/bin/fish',
      '/bin/sh',
      '/usr/bin/zsh',
      '/usr/bin/fish'
    ];
  },

  // 一般的なグループ一覧取得
  getCommonGroups(): string[] {
    return [
      'sudo',
      'adm',
      'dialout',
      'cdrom',
      'floppy',
      'audio',
      'video',
      'plugdev',
      'users',
      'docker',
      'www-data'
    ];
  }
};