import { User } from '../types/user';

export const mockUsers: User[] = [
  {
    username: 'admin',
    uid: 1000,
    gid: 1000,
    fullName: 'System Administrator',
    homeDir: '/home/admin',
    shell: '/bin/bash',
    lastLogin: '2024-01-15T10:30:00Z',
    isLocked: false,
    isSystem: false,
    groups: ['sudo', 'adm', 'dialout'],
    hasSudo: true
  },
  {
    username: 'user1',
    uid: 1001,
    gid: 1001,
    fullName: 'Test User',
    homeDir: '/home/user1',
    shell: '/bin/bash',
    isLocked: false,
    isSystem: false,
    groups: ['users'],
    hasSudo: false
  },
  {
    username: 'www-data',
    uid: 33,
    gid: 33,
    fullName: 'www-data',
    homeDir: '/var/www',
    shell: '/usr/sbin/nologin',
    isLocked: false,
    isSystem: true,
    groups: ['www-data'],
    hasSudo: false
  }
];