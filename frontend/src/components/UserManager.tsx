import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { executeCommand } from '../services/api';

const UserManagerContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

interface User {
  username: string;
  uid: string;
  gid: string;
  fullName: string;
  homeDir: string;
  shell: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    shell: '/bin/bash'
  });
  
  const { addNotification } = useNotification();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await executeCommand("cat /etc/passwd | awk -F: '{print $1\",\"$3\",\"$4\",\"$5\",\"$6\",\"$7}'");
      
      const parsedUsers: User[] = result
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [username, uid, gid, fullName, homeDir, shell] = line.split(',');
          return { username, uid, gid, fullName, homeDir, shell };
        })
        .filter(user => parseInt(user.uid) >= 1000 && parseInt(user.uid) < 65534); // 通常のユーザーのみ
      
      setUsers(parsedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setDialogMode('add');
    setFormData({
      username: '',
      fullName: '',
      password: '',
      shell: '/bin/bash'
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user: User) => {
    setDialogMode('edit');
    setCurrentUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      password: '',
      shell: user.shell
    });
    setOpenDialog(true);
  };

  const handleDeleteUser = async (username: string) => {
    if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
      try {
        await executeCommand(`sudo userdel -r ${username}`);
        addNotification(`User ${username} deleted successfully`, 'success');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        addNotification('Failed to delete user', 'error');
      }
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        // ユーザーを追加
        const command = `sudo useradd -m -s ${formData.shell} -c "${formData.fullName}" ${formData.username} && echo "${formData.username}:${formData.password}" | sudo chpasswd`;
        await executeCommand(command);
        addNotification(`User ${formData.username} created successfully`, 'success');
      } else {
        // ユーザーを編集
        if (currentUser) {
          const commands = [];
          
          if (formData.fullName !== currentUser.fullName) {
            commands.push(`sudo usermod -c "${formData.fullName}" ${currentUser.username}`);
          }
          
          if (formData.shell !== currentUser.shell) {
            commands.push(`sudo usermod -s ${formData.shell} ${currentUser.username}`);
          }
          
          if (formData.password) {
            commands.push(`echo "${currentUser.username}:${formData.password}" | sudo chpasswd`);
          }
          
          if (commands.length > 0) {
            await executeCommand(commands.join(' && '));
            addNotification(`User ${currentUser.username} updated successfully`, 'success');
          }
        }
      }
      
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      addNotification('Failed to save user', 'error');
    }
  };

  return (
    <UserManagerContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>
      
      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>UID</TableCell>
              <TableCell>Home Directory</TableCell>
              <TableCell>Shell</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.username}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.uid}</TableCell>
                <TableCell>{user.homeDir}</TableCell>
                <TableCell>{user.shell}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEditUser(user)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDeleteUser(user.username)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="username"
            label="Username"
            fullWidth
            value={formData.username}
            onChange={handleInputChange}
            disabled={dialogMode === 'edit'}
          />
          <TextField
            margin="dense"
            name="fullName"
            label="Full Name"
            fullWidth
            value={formData.fullName}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="shell"
            label="Shell"
            fullWidth
            value={formData.shell}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {dialogMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </UserManagerContainer>
  );
};

export default UserManager;
