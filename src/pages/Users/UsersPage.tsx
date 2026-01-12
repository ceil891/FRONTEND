import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { User, UserRole } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const UsersPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.STAFF,
    storeId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock data - Thay thế bằng API call
  const [users, setUsers] = useState<User[]>([
    {
      id: '0',
      email: 'super@example.com',
      fullName: 'Super Admin',
      phone: '0900000000',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '1',
      email: 'admin@example.com',
      fullName: 'Nguyễn Văn Admin',
      phone: '0901234567',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'manager@example.com',
      fullName: 'Trần Thị Manager',
      phone: '0901234568',
      role: UserRole.MANAGER,
      storeId: 'store-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      email: 'staff@example.com',
      fullName: 'Lê Văn Staff',
      phone: '0901234569',
      role: UserRole.STAFF,
      storeId: 'store-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Siêu Quản Trị';
      case UserRole.ADMIN:
        return 'Quản Trị';
      case UserRole.MANAGER:
        return 'Quản Lý';
      case UserRole.STAFF:
        return 'Nhân Viên';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'error';
      case UserRole.ADMIN:
        return 'error';
      case UserRole.MANAGER:
        return 'warning';
      case UserRole.STAFF:
        return 'info';
      default:
        return 'default';
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        password: '',
        phone: user.phone,
        role: user.role,
        storeId: user.storeId || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: UserRole.STAFF,
        storeId: '',
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: UserRole.STAFF,
      storeId: '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Họ và tên là bắt buộc';
    if (!formData.email.trim()) {
      errors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    if (!editingUser && !formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    if (editingUser) {
      // Update user
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              role: formData.role,
              storeId: formData.storeId || undefined,
              updatedAt: new Date(),
            }
          : u
      ));
      showToast('Cập nhật người dùng thành công', 'success');
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        storeId: formData.storeId || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUsers([...users, newUser]);
      showToast('Thêm người dùng thành công', 'success');
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setUsers(users.filter(u => u.id !== id));
      showToast('Xóa người dùng thành công', 'success');
    }
  };

  const mockStores = [
    { id: 'store-1', name: 'Cửa Hàng 1' },
    { id: 'store-2', name: 'Cửa Hàng 2' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản Lý Người Dùng
        </Typography>
        {isSuperAdmin() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              },
            }}
          >
            Thêm Người Dùng
          </Button>
        )}
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người Dùng</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Số Điện Thoại</TableCell>
                  <TableCell>Vai Trò</TableCell>
                  <TableCell>Cửa Hàng</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500 }}>
                          {user.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.storeId ? `Cửa hàng ${user.storeId}` : 'Toàn hệ thống'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Hoạt động' : 'Khóa'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {isSuperAdmin() && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(user)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={user.isActive ? 'warning' : 'success'}
                            onClick={() => {
                              setUsers(users.map(u =>
                                u.id === user.id ? { ...u, isActive: !u.isActive, updatedAt: new Date() } : u
                              ));
                              showToast(user.isActive ? 'Khóa tài khoản thành công' : 'Mở khóa tài khoản thành công', 'success');
                            }}
                            sx={{
                              ml: 0.5,
                              '&:hover': {
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            {user.isActive ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(user.id)}
                            sx={{
                              ml: 0.5,
                              '&:hover': {
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Họ và Tên"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={!!editingUser}
            />
            <TextField
              fullWidth
              label={editingUser ? 'Mật Khẩu Mới (để trống nếu không đổi)' : 'Mật Khẩu'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
            <TextField
              fullWidth
              label="Số Điện Thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              error={!!formErrors.phone}
              helperText={formErrors.phone}
            />
            <FormControl fullWidth required>
              <InputLabel>Vai Trò</InputLabel>
              <Select
                label="Vai Trò"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <MenuItem value={UserRole.SUPER_ADMIN}>Siêu Quản Trị Viên</MenuItem>
                <MenuItem value={UserRole.ADMIN}>Quản Trị Viên</MenuItem>
                <MenuItem value={UserRole.MANAGER}>Quản Lý Cửa Hàng</MenuItem>
                <MenuItem value={UserRole.STAFF}>Nhân Viên</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Cửa Hàng</InputLabel>
              <Select
                label="Cửa Hàng"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                disabled={formData.role === UserRole.ADMIN || formData.role === UserRole.SUPER_ADMIN}
              >
                <MenuItem value="">Toàn hệ thống</MenuItem>
                {mockStores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {editingUser ? 'Cập Nhật' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
