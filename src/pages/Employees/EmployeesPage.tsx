import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select, Chip, CircularProgress, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon,
  Block as BlockIcon, CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import apiClient, { userAPI, storeAPI } from '../../api/client'; 

const ROLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  'ADMIN': { label: 'Quản trị viên', color: '#1e293b', bg: '#f1f5f9' },
  'MANAGER': { label: 'Quản lý cửa hàng', color: '#b45309', bg: '#fef3c7' },
  'CASHIER': { label: 'Thu ngân', color: '#0369a1', bg: '#e0f2fe' },
  'WAREHOUSE_STAFF': { label: 'Nhân viên kho', color: '#15803d', bg: '#dcfce7' },
  'SALES_STAFF': { label: 'Nhân viên bán hàng', color: '#7e22ce', bg: '#f3e8ff' },
};

export const EmployeesPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '', 
    role: 'CASHIER', storeId: '' as string | number, isActive: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, storesRes] = await Promise.all([userAPI.getAll(), storeAPI.getAll()]);
      const listUsers = (usersRes.data as any)?.data || usersRes.data || [];
      const listStores = (storesRes.data as any)?.data || storesRes.data || [];
      
      setEmployees(listUsers.filter((u: any) => 
        ['ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE_STAFF', 'SALES_STAFF'].includes(u.role)
      ));
      setStores(listStores);
    } catch (err: any) {
      showToast('Lỗi khi tải dữ liệu nhân viên', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const storeMap = useMemo(() => {
    const map: Record<number, string> = {};
    stores.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [stores]);

  const handleOpenDialog = (employee?: any) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        email: employee.email, 
        password: '', 
        fullName: employee.fullName, 
        phone: employee.phone || '', 
        role: employee.role || 'CASHIER',
        storeId: employee.storeId || '', 
        isActive: employee.isActive ?? true,
      });
    } else {
      setEditingEmployee(null);
      setFormData({ email: '', password: '', fullName: '', phone: '', role: 'CASHIER', storeId: '', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.email || !formData.fullName) return showToast("Vui lòng nhập Email và Họ tên", "warning");

    try {
      setSaving(true);
      const payload = { 
        ...formData, 
        storeId: formData.storeId ? Number(formData.storeId) : null,
        phone: formData.phone.trim() || null 
      };

      if (editingEmployee) {
        await userAPI.update(editingEmployee.id, payload);
        showToast('Cập nhật thành công!', 'success');
      } else {
        await userAPI.create(payload);
        showToast('Thêm nhân viên thành công!', 'success');
      }

      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi lưu dữ liệu', 'error');
    } finally { setSaving(false); }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await apiClient.patch(`/api/core/employees/${id}/toggle-status`);
      showToast('Đã thay đổi trạng thái nhân viên', 'success');
      loadData();
    } catch (error) {
      showToast('Lỗi cập nhật trạng thái', 'error');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (roleFilter === 'ALL' || emp.role === roleFilter)
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>QUẢN LÝ NHÂN VIÊN</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', textTransform: 'none' }}>
            Thêm Nhân Viên
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid #f1f5f9' }}>
            <TextField 
              size="small" placeholder="Tìm tên/email..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
              sx={{ width: 250, bgcolor: 'white' }} 
            />
            <FormControl size="small" sx={{ width: 180 }}>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <MenuItem value="ALL">Tất cả chức vụ</MenuItem>
                <MenuItem value="ADMIN">Quản trị viên</MenuItem>
                <MenuItem value="MANAGER">Quản lý cửa hàng</MenuItem>
                <MenuItem value="CASHIER">Thu ngân</MenuItem>
                <MenuItem value="WAREHOUSE_STAFF">Nhân viên kho</MenuItem>
                <MenuItem value="SALES_STAFF">Nhân viên bán hàng</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nhân Viên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Chức Vụ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cửa Hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SĐT</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : filteredEmployees.map((emp) => {
                  const roleInfo = ROLE_MAP[emp.role] || { label: emp.role, color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <TableRow key={emp.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: roleInfo.bg, color: roleInfo.color, width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}>
                            {emp.fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{emp.fullName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell><Chip label={roleInfo.label} size="small" sx={{ bgcolor: roleInfo.bg, color: roleInfo.color, fontWeight: 700 }} /></TableCell>
                      <TableCell>{storeMap[emp.storeId!] || '---'}</TableCell>
                      <TableCell>{emp.phone || '---'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={emp.isActive ? 'Đang làm' : 'Đã nghỉ'} 
                          size="small" 
                          color={emp.isActive ? "success" : "default"} 
                          onClick={() => handleToggleStatus(emp.id)}
                          sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(emp)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="warning" onClick={() => handleToggleStatus(emp.id)}>
                            {emp.isActive ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>
            {editingEmployee ? 'CHỈNH SỬA HỒ SƠ' : 'THÊM NHÂN VIÊN MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField fullWidth size="small" label="Họ tên (*)" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField fullWidth size="small" label="Email (*)" value={formData.email} disabled={!!editingEmployee} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <TextField fullWidth size="small" label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </Box>

          <TextField 
            fullWidth size="small" 
            label={editingEmployee ? "Mật khẩu (Để trống nếu giữ nguyên)" : "Mật khẩu (*)"} 
            type="password" 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
             <FormControl size="small">
                <InputLabel>Chức vụ</InputLabel>
                <Select label="Chức vụ" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <MenuItem value="ADMIN">Quản trị viên</MenuItem>
                    <MenuItem value="MANAGER">Quản lý cửa hàng</MenuItem>
                    <MenuItem value="CASHIER">Thu ngân</MenuItem>
                    <MenuItem value="WAREHOUSE_STAFF">Nhân viên kho</MenuItem>
                    <MenuItem value="SALES_STAFF">Nhân viên bán hàng</MenuItem>
                </Select>
             </FormControl>
             <FormControl size="small">
                <InputLabel>Cửa hàng</InputLabel>
                <Select label="Cửa hàng" value={formData.storeId} onChange={(e) => setFormData({...formData, storeId: e.target.value})}>
                    <MenuItem value="">Hệ thống</MenuItem>
                    {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
             </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#00a65a' }}>
            Lưu Hồ Sơ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};