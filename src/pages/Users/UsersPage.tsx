import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip, MenuItem,
  FormControl, InputLabel, Select, Avatar, CircularProgress, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Lock as LockIcon, LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

// IMPORT API THỰC TẾ
import { userAPI, storeAPI } from '../../api/client';

export const UsersPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: 'STAFF', storeId: '',
  });

  useEffect(() => {
    loadUsers();
    loadStores();
  }, []);

  // 1. Tải danh sách người dùng (Xử lý bao lô data)
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setUsers(items);
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Tải danh sách cửa hàng cho menu Select
  const loadStores = async () => {
    try {
      const response = await storeAPI.getAll();
      const responseData = response.data as any;
      setStores(Array.isArray(responseData) ? responseData : (responseData?.data || []));
    } catch (error) {}
  };

  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '', // Không hiện mật khẩu cũ vì lý do bảo mật
        phone: user.phone || '',
        role: user.role || 'STAFF',
        storeId: user.storeId ? user.storeId.toString() : '',
      });
    } else {
      setEditingUser(null);
      setFormData({ fullName: '', email: '', password: '', phone: '', role: 'STAFF', storeId: '' });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    // Validate nhanh
    if (!formData.fullName || !formData.email || (!editingUser && !formData.password)) {
       return showToast('Vui lòng điền đủ các trường bắt buộc (*)', 'warning');
    }

    const payload = {
      ...formData,
      // Đảm bảo gửi đúng kiểu dữ liệu Backend cần
      storeId: formData.storeId ? parseInt(formData.storeId) : null
    };

    try {
      if (editingUser) {
        await userAPI.update(editingUser.id, payload);
        showToast('Cập nhật người dùng thành công', 'success');
      } else {
        await userAPI.create(payload);
        showToast('Tạo tài khoản thành công', 'success');
      }
      setOpenDialog(false);
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lưu dữ liệu', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này vĩnh viễn?')) {
      try {
        await userAPI.delete(id);
        showToast('Đã thực hiện thành công', 'success');
        loadUsers();
      } catch (error: any) {
        showToast('Lỗi khi thực hiện thao tác', 'error');
      }
    }
  };

  // 3. Hàm xử lý Khóa / Mở khóa tài khoản
  const handleToggleLock = async (user: any) => {
    // Vì backend đã tự xử lý logic đảo trạng thái, ta chỉ cần xác định text để hiện thông báo
    const isCurrentlyActive = user.status === 'ACTIVE' || user.isActive === true; 
    const actionText = isCurrentlyActive ? 'khóa' : 'mở khóa';

    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của ${user.fullName}?`)) {
      try {
        // Gọi API mới, CHỈ truyền id, KHÔNG truyền body {status} nữa
        await userAPI.toggleStatus(user.id);
        
        showToast(`Đã ${actionText} tài khoản thành công`, 'success');
        loadUsers(); // Tải lại danh sách sau khi cập nhật
      } catch (error: any) {
        // Hiển thị lỗi từ backend trả về (nếu có)
        const errorMsg = error.response?.data?.message || error.message || `Lỗi khi ${actionText} tài khoản`;
        showToast(errorMsg, 'error');
      }
    }
  };

  // Hàm dịch Role sang tiếng Việt để hiển thị trên bảng
  const getRoleLabel = (role: string) => {
    const roles: any = { 
        'SUPER_ADMIN': 'Siêu Quản Trị', 
        'ADMIN': 'Quản Trị', 
        'MANAGER': 'Quản Lý', 
        'STAFF': 'Nhân Viên' ,
    };
    return roles[role] || role;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>QUẢN LÝ NGƯỜI DÙNG</Typography>
        {isSuperAdmin() && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' } }}>
            Thêm Người Dùng
          </Button>
        )}
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Họ Tên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Số Điện Thoại</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vai Trò</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Đơn Vị</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: user.status === 'ACTIVE' ? '#1976d2' : '#9e9e9e', width: 32, height: 32, fontSize: '0.8rem' }}>
                          {user.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: user.status === 'ACTIVE' ? 'inherit' : 'text.disabled' }}>
                          {user.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: user.status === 'ACTIVE' ? 'inherit' : 'text.disabled' }}>{user.email}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: user.status === 'ACTIVE' ? 'inherit' : 'text.disabled' }}>{user.phone}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={getRoleLabel(user.role)} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                        {user.status && user.status !== 'ACTIVE' && (
                          <Chip label="Đã khóa" size="small" color="error" sx={{ fontWeight: 600, height: 24 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: user.status === 'ACTIVE' ? 'inherit' : 'text.disabled' }}>{user.storeName || 'Toàn hệ thống'}</TableCell>
                    <TableCell align="right">
                      {isSuperAdmin() && (
                        <>
                          <IconButton 
                            size="small" 
                            color={user.status === 'ACTIVE' ? 'warning' : 'success'} 
                            onClick={() => handleToggleLock(user)}
                            title={user.status === 'ACTIVE' ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.status === 'ACTIVE' ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                          </IconButton>
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(user)} title="Chỉnh sửa">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(user.id)} title="Xóa">
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
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Pagination count={1} size="small" color="primary" />
             <Typography variant="body2" color="text.secondary">Tổng: {users.length} nhân viên</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog Thêm/Sửa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>
            {editingUser ? 'CHỈNH SỬA THÔNG TIN' : 'TẠO TÀI KHOẢN MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField fullWidth size="small" label="Họ và Tên (*)" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          <TextField fullWidth size="small" label="Email (Tên đăng nhập) (*)" value={formData.email} disabled={!!editingUser} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <TextField fullWidth size="small" label={editingUser ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu (*)"} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <TextField fullWidth size="small" label="Số điện thoại (*)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Vai Trò (*)</InputLabel>
                <Select label="Vai Trò (*)" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <MenuItem value="SUPER_ADMIN">Siêu Quản Trị</MenuItem>
                  <MenuItem value="ADMIN">Quản Trị Viên</MenuItem>
                  <MenuItem value="MANAGER">Quản Lý Cửa Hàng</MenuItem>
                  <MenuItem value="STAFF">Nhân Viên</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Cửa Hàng Làm Việc</InputLabel>
                <Select label="Cửa Hàng Làm Việc" value={formData.storeId} onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}>
                  <MenuItem value="">Trụ sở chính (Toàn hệ thống)</MenuItem>
                  {stores.map((s) => <MenuItem key={s.id} value={s.id.toString()}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', boxShadow: 'none' }}>Lưu thông tin</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};