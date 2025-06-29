export interface User {
  username: string;
  uid: number;
  gid: number;
  fullName: string;
  homeDir: string;
  shell: string;
  lastLogin?: string;
  isLocked: boolean;
  isSystem: boolean;
  groups: string[];
  hasSudo: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName?: string;
  shell?: string;
  createHome: boolean;
  initialGroups: string[];
  grantSudo: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  shell?: string;
  groups: string[];
  isLocked: boolean;
  hasSudo: boolean;
}

export interface ChangePasswordRequest {
  username: string;
  newPassword: string;
  forceChange: boolean;
}