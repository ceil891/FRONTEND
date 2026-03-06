import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select, Chip, CircularProgress, Tooltip, Avatar, Checkbox, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Storefront as StoreIcon, Work as WorkIcon, Badge as BadgeIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { userAPI, storeAPI, BackendUser, BackendStore } from '../../api/client';

// ✅ MAPPING QUYỀN VỚI MÀU SẮC CHUẨN UI
const ROLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  'ROLE_MANAGER': { label: 'Quản Lý', color: '#b45309', bg: '#fef3c7' },
  'ROLE_STAFF': { label: 'Thu Ngân', color: '#0369a1', bg: '#e0f2fe' },
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

  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '', 
    role: 'ROLE_STAFF', storeId: '' as string | number, isActive: true,
  });

  // ================= LOGIC API (GIỮ NGUYÊN) =================
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, storesRes] = await Promise.all([userAPI.getAll(), storeAPI.getAll()]);
      const listUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data as any)?.data || (usersRes.data as any)?.content || [];
      const listStores = Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data as any)?.data || (storesRes.data as any)?.content || [];
      const listEmployees = listUsers.filter((u: BackendUser) => u.role === 'ROLE_MANAGER' || u.role === 'ROLE_STAFF');
      setEmployees(listEmployees);
      setStores(listStores);
    } catch (err: any) {
      showToast('Lỗi khi tải dữ liệu nhân viên', 'error');
    } finally { setLoading(false); }
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
        email: employee.email, password: '', fullName: employee.fullName, 
        phone: employee.phone || '', role: employee.role || 'ROLE_STAFF', 
        storeId: employee.storeId || '', isActive: employee.isActive,
      });
    } else {
      setEditingEmployee(null);
      setFormData({ email: '', password: '', fullName: '', phone: '', role: 'ROLE_STAFF', storeId: '', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?")) {
      try {
        await userAPI.delete(id);
        showToast('Xóa nhân viên thành công!', 'success');
        await loadData();
      } catch (err: any) { showToast('Không thể xóa: ' + (err.message), 'error'); }
    }
  };

  const handleSave = async () => {
    if (!formData.email || !formData.fullName || !formData.role) return showToast("Vui lòng nhập các trường bắt buộc (*)", "error");
    if (!editingEmployee && !formData.password) return showToast("Vui lòng cấp mật khẩu", "error");
    
    try {
      setSaving(true);
      const payload = { ...formData, storeId: formData.storeId ? Number(formData.storeId) : undefined };
      if (editingEmployee) await userAPI.update(editingEmployee.id, payload as any);
      else await userAPI.create(payload as any);

      showToast('Lưu nhân viên thành công!', 'success');
      setOpenDialog(false);
      await loadData();
    } catch (err: any) { showToast('Lỗi lưu dữ liệu', 'error'); } finally { setSaving(false); }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchStore = storeFilter === 'ALL' || String(emp.storeId) === storeFilter;
    return matchSearch && matchRole && matchStore;
  });

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ NHÂN VIÊN
        </Typography>
      </Box>

      {/* ================= BẢNG CHUẨN RIC ================= */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Tên/Email/SĐT..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150, mr: 1 }}>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ bgcolor: 'white', '& .MuiSelect-select': { py: 0.8, fontSize: '0.875rem' } }}>
                <MenuItem value="ALL">Tất cả chức vụ</MenuItem>
                <MenuItem value="ROLE_MANAGER">Quản lý</MenuItem>
                <MenuItem value="ROLE_STAFF">Thu ngân</MenuItem>
              </Select>
            </FormControl>

            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Excel</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xóa</Button>
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
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {['Họ Tên Nhân Viên', 'Email / Tài Khoản', 'Chức Vụ', 'Cửa Hàng Làm Việc', 'Số Điện Thoại', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : filteredEmployees.map((emp, index) => {
                  const roleInfo = ROLE_MAP[emp.role] || { label: emp.role, color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <TableRow key={emp.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Box onClick={() => handleOpenDialog(emp)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                          <Box onClick={() => handleDelete(emp.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><DeleteIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: roleInfo.bg, color: roleInfo.color, width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700 }}>{emp.fullName.charAt(0)}</Avatar>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">{emp.fullName}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0284c7', fontWeight: 500, p: 1.5 }}>{emp.email}</TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip label={roleInfo.label} size="small" sx={{ bgcolor: roleInfo.bg, color: roleInfo.color, fontWeight: 700, borderRadius: 1 }} />
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                        {storeMap[emp.storeId!] || 'Chưa phân cửa hàng'}
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{emp.phone || '---'}</TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip label={emp.isActive ? 'Đang làm việc' : 'Đã nghỉ việc'} size="small" sx={{ bgcolor: emp.isActive ? '#dcfce7' : '#f1f5f9', color: emp.isActive ? '#166534' : '#64748b', fontWeight: 600, borderRadius: 1 }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{filteredEmployees.length} items</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG FORM (GIỮ NGUYÊN LOGIC) ================= */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>{editingEmployee ? 'HỒ SƠ NHÂN VIÊN' : 'THÊM NHÂN VIÊN MỚI'}</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField fullWidth size="small" label="Họ tên (*)" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Email / Tài khoản (*)" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!!editingEmployee} required />
              <TextField fullWidth size="small" label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Box>
            <TextField fullWidth size="small" label={editingEmployee ? "Đổi mật khẩu (Bỏ trống nếu không đổi)" : "Mật khẩu khởi tạo (*)"} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingEmployee} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small"><InputLabel>Chức vụ</InputLabel><Select label="Chức vụ" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}><MenuItem value="ROLE_MANAGER">Quản lý</MenuItem><MenuItem value="ROLE_STAFF">Thu ngân</MenuItem></Select></FormControl>
              <FormControl fullWidth size="small"><InputLabel>Cửa hàng</InputLabel><Select label="Cửa hàng" value={formData.storeId} onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}><MenuItem value=""><em>-- Trống --</em></MenuItem>{stores.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Typography variant="body2" fontWeight={600}>Trạng thái:</Typography><Chip label={formData.isActive ? 'Đang làm việc' : 'Đã nghỉ việc'} color={formData.isActive ? 'success' : 'default'} onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} sx={{ cursor: 'pointer', fontWeight: 600 }} /></Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Lưu Hồ Sơ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};