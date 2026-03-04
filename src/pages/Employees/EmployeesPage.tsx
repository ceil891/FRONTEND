import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select, Chip, CircularProgress, Tooltip, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  Badge as BadgeIcon, Storefront as StoreIcon, Work as WorkIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { userAPI, storeAPI, BackendUser, BackendStore } from '../../api/client';

// ✅ SỬA LẠI TÊN QUYỀN ĐỂ KHỚP VỚI BACKEND (THÊM CHỮ ROLE_)
const ROLE_MAP: Record<string, { label: string; color: "warning" | "primary" }> = {
  'ROLE_MANAGER': { label: 'Quản Lý Cửa Hàng', color: 'warning' },
  'ROLE_STAFF': { label: 'Thu Ngân (POS)', color: 'primary' },
};

export const EmployeesPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<BackendUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [storeFilter, setStoreFilter] = useState('ALL');
  
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<BackendUser[]>([]);
  const [stores, setStores] = useState<BackendStore[]>([]);

  // ✅ CẬP NHẬT MẶC ĐỊNH LÀ ROLE_STAFF
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '', 
    role: 'ROLE_STAFF', storeId: '' as string | number, isActive: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, storesRes] = await Promise.all([
        userAPI.getAll(), 
        storeAPI.getAll()
      ]);
      
      const listUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data as any)?.data || (usersRes.data as any)?.content || [];
      const listStores = Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data as any)?.data || (storesRes.data as any)?.content || [];

      // ✅ LỌC THEO ĐÚNG TÊN QUYỀN MỚI
      const listEmployees = listUsers.filter((u: BackendUser) => u.role === 'ROLE_MANAGER' || u.role === 'ROLE_STAFF');

      setEmployees(listEmployees);
      setStores(listStores);
    } catch (err: any) {
      showToast('Lỗi khi tải dữ liệu nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const storeMap = useMemo(() => {
    const map: Record<number, string> = {};
    stores.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [stores]);

  const handleOpenDialog = (employee?: BackendUser) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        email: employee.email, 
        password: '', 
        fullName: employee.fullName, 
        phone: employee.phone || '', 
        role: employee.role || 'ROLE_STAFF', 
        storeId: employee.storeId || '', 
        isActive: employee.isActive,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        email: '', password: '', fullName: '', phone: '', 
        role: 'ROLE_STAFF', storeId: '', isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?")) {
      try {
        await userAPI.delete(id);
        showToast('Xóa nhân viên thành công!', 'success');
        await loadData();
      } catch (err: any) {
        showToast('Không thể xóa: ' + (err.response?.data?.message || err.message), 'error');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.email || !formData.fullName || !formData.role) {
      return showToast("Vui lòng nhập các trường bắt buộc (*)", "error");
    }
    if (!editingEmployee && !formData.password) {
      return showToast("Vui lòng cấp mật khẩu để nhân viên đăng nhập", "error");
    }
    // ✅ CẬP NHẬT ĐIỀU KIỆN KIỂM TRA
    if (!formData.storeId && formData.role === 'ROLE_STAFF') {
      return showToast("Thu ngân bắt buộc phải được gắn vào một cửa hàng!", "warning");
    }

    try {
      setSaving(true);
      const payload = {
        email: formData.email,
        password: formData.password || undefined,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        storeId: formData.storeId ? Number(formData.storeId) : undefined,
        isActive: formData.isActive
      };

      if (editingEmployee) {
        await userAPI.update(editingEmployee.id, payload as any);
        showToast('Cập nhật nhân viên thành công!', 'success');
      } else {
        await userAPI.create(payload as any);
        showToast('Thêm nhân viên mới thành công!', 'success');
      }
      setOpenDialog(false);
      await loadData();
    } catch (err: any) {
      showToast('Lỗi lưu dữ liệu: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.phone?.includes(searchQuery);
    const matchRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchStore = storeFilter === 'ALL' || String(emp.storeId) === storeFilter;
    return matchSearch && matchRole && matchStore;
  });

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <BadgeIcon color="primary" /> Quản Lý Nhân Sự Cửa Hàng
        </Typography>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
          Thêm Nhân Viên
        </Button>
      </Box>

      {/* BỘ LỌC VÀ TÌM KIẾM */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            flex={1} sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
            size="small" placeholder="Tìm tên, email hoặc SĐT nhân viên..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ borderRadius: 2, bgcolor: '#fff' }}>
              <MenuItem value="ALL">Tất cả chức vụ</MenuItem>
              <MenuItem value="ROLE_MANAGER">Chỉ Quản Lý</MenuItem>
              <MenuItem value="ROLE_STAFF">Chỉ Thu Ngân</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} sx={{ borderRadius: 2, bgcolor: '#fff' }}>
              <MenuItem value="ALL">Tất cả cửa hàng</MenuItem>
              {stores.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* BẢNG DANH SÁCH NHÂN VIÊN */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell width="60px" align="center" sx={{ fontWeight: 700, color: '#334155', py: 2 }}>#</TableCell>
                <TableCell width="250px" sx={{ fontWeight: 700, color: '#334155' }}>Thông Tin Nhân Viên</TableCell>
                <TableCell width="180px" sx={{ fontWeight: 700, color: '#334155' }}>Chức Vụ</TableCell>
                <TableCell width="200px" sx={{ fontWeight: 700, color: '#334155' }}>Nơi Làm Việc</TableCell>
                <TableCell width="120px" align="center" sx={{ fontWeight: 700, color: '#334155' }}>Tình Trạng</TableCell>
                <TableCell width="100px" align="center" sx={{ fontWeight: 700, color: '#334155' }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : filteredEmployees.map((emp) => (
                <TableRow key={emp.id} hover sx={{ '& > td': { py: 1.5, borderBottom: '1px solid #f8fafc' } }}>
                  
                  <TableCell align="center">
                    <Avatar sx={{ width: 42, height: 42, bgcolor: emp.role === 'ROLE_MANAGER' ? '#fef3c7' : '#e0f2fe', color: emp.role === 'ROLE_MANAGER' ? '#d97706' : '#0284c7', fontSize: '1.1rem', fontWeight: 700 }}>
                      {emp.fullName.charAt(0).toUpperCase()}
                    </Avatar>
                  </TableCell>
                  
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{emp.fullName}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                       {emp.email} {emp.phone ? `• ${emp.phone}` : ''}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      icon={<WorkIcon fontSize="small"/>}
                      label={ROLE_MAP[emp.role]?.label || emp.role} 
                      color={ROLE_MAP[emp.role]?.color || 'default'}
                      size="small" sx={{ fontWeight: 600, borderRadius: 1.5 }} 
                    />
                  </TableCell>
                  
                <TableCell>
  {(() => {
    // Ép kiểu any để tìm các tên biến phổ biến từ Spring Boot
    const e = emp as any;
    // Bắt mọi trường hợp Backend có thể trả về: storeId, cuaHangId, hoặc object cuaHang
    const actualStoreId = e.storeId || e.cuaHangId || (e.cuaHang && (e.cuaHang.id || e.cuaHang.cuaHangId));

    if (actualStoreId) {
      return (
        <Chip 
          icon={<StoreIcon fontSize="small"/>} 
          label={storeMap[actualStoreId] || 'Không xác định'} 
          size="small" variant="outlined" 
          sx={{ color: '#334155', borderColor: '#cbd5e1', fontWeight: 500 }} 
        />
      );
    }
    
    return (
      <Typography variant="body2" color="error.main" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
        Chưa xếp cửa hàng
      </Typography>
    );
  })()}
</TableCell>

                  <TableCell align="center">
                    <Chip 
                      label={emp.isActive ? 'Đang làm việc' : 'Đã nghỉ việc'} 
                      size="small" 
                      sx={{ bgcolor: emp.isActive ? '#dcfce7' : '#f1f5f9', color: emp.isActive ? '#16a34a' : '#64748b', fontWeight: 600, border: 'none' }}
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" onClick={() => handleOpenDialog(emp)} sx={{ color: '#0ea5e9', bgcolor: '#f0f9ff' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sa thải / Xóa">
                        <IconButton size="small" onClick={() => handleDelete(emp.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredEmployees.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <BadgeIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Chưa có nhân viên nào khớp với tìm kiếm.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* DIALOG THÊM / SỬA NHÂN VIÊN */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #f1f5f9', pb: 2, color: '#0f172a' }}>
          {editingEmployee ? 'Hồ Sơ Nhân Viên' : 'Tiếp Nhận Nhân Viên Mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            
            <TextField fullWidth size="small" label="Họ và Tên Nhân Viên (*)" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Email Đăng Nhập POS (*)" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!!editingEmployee} required />
              <TextField fullWidth size="small" label="Số điện thoại liên hệ" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Box>

            <TextField 
              fullWidth size="small" 
              label={editingEmployee ? "Đổi mật khẩu POS (Để trống nếu giữ nguyên)" : "Mật khẩu POS khởi tạo (*)"} 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              required={!editingEmployee} 
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* ✅ CHỈ CHO CHỌN 2 QUYỀN MỚI */}
              <FormControl fullWidth size="small" required>
                <InputLabel>Vị trí công việc</InputLabel>
                <Select label="Vị trí công việc" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <MenuItem value="ROLE_MANAGER">Quản Lý Cửa Hàng</MenuItem>
                  <MenuItem value="ROLE_STAFF">Thu Ngân Bán Hàng</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Nơi làm việc</InputLabel>
                <Select label="Nơi làm việc" value={formData.storeId} onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}>
                  <MenuItem value=""><em>-- Chưa phân bổ --</em></MenuItem>
                  {stores.map(store => (
                    <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Chip 
                label={formData.isActive ? 'Tình trạng: Đang làm việc' : 'Tình trạng: Đã nghỉ việc / Bị khóa'} 
                color={formData.isActive ? 'success' : 'default'} 
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} 
                sx={{ cursor: 'pointer', fontWeight: 600, py: 2 }} 
              />
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2, boxShadow: 'none', fontWeight: 600 }}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Lưu Hồ Sơ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};