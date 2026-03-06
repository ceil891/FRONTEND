import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip, MenuItem,
  FormControl, InputLabel, Select, Avatar, CircularProgress, Checkbox, Pagination, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Lock as LockIcon, LockOpen as LockOpenIcon, Print as PrintIcon,
  FileDownload as ExcelIcon, FilterAlt as FilterIcon, ManageAccounts as AccountIcon
} from '@mui/icons-material';
import { User, UserRole } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { userAPI, storeAPI, BackendUser, BackendStore } from '../../api/client';

export const UsersPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '', role: UserRole.STAFF, storeId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);

  // ================= LOGIC API (GIỮ NGUYÊN) =================
  useEffect(() => {
    loadUsers();
    loadStores();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      if (response.data.success) {
        const backendUsers = response.data.data || [];
        const mappedUsers: User[] = backendUsers.map((user: BackendUser) => ({
          id: user.id.toString(),
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role as UserRole,
          storeId: user.storeId?.toString(),
          isActive: user.isActive,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        }));
        setUsers(mappedUsers);
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách người dùng', 'error');
    } finally { setLoading(false); }
  };

  const loadStores = async () => {
    try {
      const response = await storeAPI.getAll();
      if (response.data.success) {
        const backendStores = response.data.data || [];
        setStores(backendStores.map((store: BackendStore) => ({ id: store.id.toString(), name: store.name })));
      }
    } catch (error) {}
  };

  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return { label: 'Siêu Quản Trị', color: '#dc2626', bg: '#fee2e2' };
      case UserRole.ADMIN: return { label: 'Quản Trị', color: '#991b1b', bg: '#fef2f2' };
      case UserRole.MANAGER: return { label: 'Quản Lý', color: '#b45309', bg: '#fef3c7' };
      case UserRole.STAFF: return { label: 'Nhân Viên', color: '#0369a1', bg: '#e0f2fe' };
      default: return { label: role, color: '#475569', bg: '#f1f5f9' };
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ fullName: user.fullName, email: user.email, password: '', phone: user.phone, role: user.role, storeId: user.storeId || '' });
    } else {
      setEditingUser(null);
      setFormData({ fullName: '', email: '', password: '', phone: '', role: UserRole.STAFF, storeId: '' });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({ fullName: '', email: '', password: '', phone: '', role: UserRole.STAFF, storeId: '' });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Họ và tên là bắt buộc';
    if (!formData.email.trim()) errors.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email không hợp lệ';
    if (!editingUser && !formData.password) errors.password = 'Mật khẩu là bắt buộc';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) { showToast('Vui lòng điền đủ thông tin', 'warning'); return; }
    try {
      setIsSaving(true);
      const payload = { ...formData, storeId: formData.storeId ? Number(formData.storeId) : undefined };
      if (editingUser) await userAPI.update(editingUser.id, payload as any);
      else await userAPI.create(payload as any);
      showToast('Lưu người dùng thành công', 'success');
      await loadUsers();
      handleCloseDialog();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi khi lưu', 'error');
    } finally { setIsSaving(false); }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const targetUser = users.find(u => u.id === id);
      if (!targetUser) return;
      const actionText = targetUser.isActive ? 'khóa' : 'mở khóa';
      if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản này?`)) return;
      await userAPI.toggleActive(id);
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
      showToast('Cập nhật trạng thái thành công!', 'success');
    } catch (error: any) { showToast('Lỗi cập nhật', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa vĩnh viễn người dùng này?')) return;
    try {
      await userAPI.delete(id);
      setUsers(users.filter(u => u.id !== id));
      showToast('Đã xóa thành công', 'success');
    } catch (error: any) { showToast('Lỗi khi xóa', 'error'); }
  };

  // ================= GIAO DIỆN CHUẨN RIC =================
  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Tên/Email người dùng..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            {isSuperAdmin() && (
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm Người Dùng</Button>
            )}
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Danh Sách</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 100, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {['Thông tin người dùng', 'Email / Tài khoản', 'Số điện thoại', 'Vai trò', 'Cửa hàng gán', 'Trạng thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && users.length === 0 ? (
                   <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : filteredUsers.map((user, index) => {
                  const role = getRoleInfo(user.role);
                  return (
                    <TableRow key={user.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      
                      {/* Cột Thao tác */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Box onClick={() => handleOpenDialog(user)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Sửa"><EditIcon sx={{ fontSize: 14 }} /></Box>
                          <Box onClick={() => handleToggleActive(user.id)} sx={{ bgcolor: user.isActive ? '#f39c12' : '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title={user.isActive ? "Khóa" : "Mở"}>
                             {user.isActive ? <LockIcon sx={{ fontSize: 14 }} /> : <LockOpenIcon sx={{ fontSize: 14 }} />}
                          </Box>
                          <Box onClick={() => handleDelete(user.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Xóa"><DeleteIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: role.bg, color: role.color, width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700 }}>{user.fullName.charAt(0)}</Avatar>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">{user.fullName}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0284c7', fontWeight: 500, p: 1.5 }}>{user.email}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{user.phone}</TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip label={role.label} size="small" sx={{ bgcolor: role.bg, color: role.color, fontWeight: 700, borderRadius: 1 }} />
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                        {user.storeId ? stores.find(s => s.id === user.storeId)?.name || 'Cửa hàng ' + user.storeId : 'Toàn hệ thống'}
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        {user.isActive ? 
                          <Chip label="Hoạt động" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                          <Chip label="Đã Khóa" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{filteredUsers.length} items</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG FORM (GIỮ NGUYÊN HOÀN TOÀN) ================= */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>{editingUser ? 'CHỈNH SỬA TÀI KHOẢN' : 'THÊM TÀI KHOẢN MỚI'}</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField fullWidth size="small" label="Họ và Tên (*)" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} error={!!formErrors.fullName} helperText={formErrors.fullName} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Email (*)" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!!editingUser} error={!!formErrors.email} helperText={formErrors.email} />
              <TextField fullWidth size="small" label="Số Điện Thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} error={!!formErrors.phone} helperText={formErrors.phone} />
            </Box>
            <TextField fullWidth size="small" label={editingUser ? "Mật Khẩu Mới (Bỏ trống nếu giữ nguyên)" : "Mật Khẩu (*)"} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={!!formErrors.password} helperText={formErrors.password} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small"><InputLabel>Vai Trò</InputLabel><Select label="Vai Trò" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}><MenuItem value={UserRole.SUPER_ADMIN}>Siêu Quản Trị</MenuItem><MenuItem value={UserRole.ADMIN}>Quản Trị</MenuItem><MenuItem value={UserRole.MANAGER}>Quản Lý</MenuItem><MenuItem value={UserRole.STAFF}>Nhân Viên</MenuItem></Select></FormControl>
              <FormControl fullWidth size="small" disabled={formData.role === UserRole.ADMIN || formData.role === UserRole.SUPER_ADMIN}><InputLabel>Cửa Hàng</InputLabel><Select label="Cửa Hàng" value={formData.storeId} onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}><MenuItem value="">Toàn hệ thống</MenuItem>{stores.map((s) => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}</Select></FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={handleCloseDialog} disabled={isSaving} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            {isSaving ? 'Đang Lưu...' : editingUser ? 'Cập Nhật' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};