import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, CircularProgress,
  Checkbox, Pagination, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, LocationOn as LocationIcon,
  Phone as PhoneIcon, Email as EmailIcon, Delete as DeleteIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Storefront as StoreIcon
} from '@mui/icons-material';
import { Store } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { storeAPI, BackendStore } from '../../api/client';

export const StoresPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    code: '', name: '', address: '', phone: '', email: '', isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stores, setStores] = useState<Store[]>([]);

  // ================= LOGIC API (GIỮ NGUYÊN) =================
  useEffect(() => { loadStores(); }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getAll();
      if (response.data.success) {
        const backendStores = response.data.data || [];
        const mappedStores: Store[] = backendStores.map((store: BackendStore) => ({
          id: store.id.toString(),
          code: store.code,
          name: store.name,
          address: store.address,
          phone: store.phone,
          email: store.email || undefined,
          managerId: store.managerId?.toString(),
          isActive: store.isActive,
          createdAt: new Date(store.createdAt),
          updatedAt: new Date(store.updatedAt),
        }));
        setStores(mappedStores);
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách cửa hàng', 'error');
    } finally { setLoading(false); }
  };

  const handleOpenDialog = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        code: store.code, name: store.name, address: store.address,
        phone: store.phone, email: store.email || '', isActive: store.isActive,
      });
    } else {
      setEditingStore(null);
      setFormData({ code: '', name: '', address: '', phone: '', email: '', isActive: true });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStore(null);
    setFormData({ code: '', name: '', address: '', phone: '', email: '', isActive: true });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = 'Mã là bắt buộc';
    if (!formData.name.trim()) errors.name = 'Tên là bắt buộc';
    if (!formData.address.trim()) errors.address = 'Địa chỉ là bắt buộc';
    if (!formData.phone.trim()) errors.phone = 'SĐT là bắt buộc';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) { showToast('Vui lòng điền đủ thông tin', 'warning'); return; }
    try {
      if (editingStore) {
        const response = await storeAPI.update(parseInt(editingStore.id), {
          name: formData.name, address: formData.address,
          phone: formData.phone, email: formData.email || undefined,
          isActive: formData.isActive,
        });
        if (response.data.success) showToast('Cập nhật thành công', 'success');
      } else {
        const response = await storeAPI.create({
          code: formData.code, name: formData.name, address: formData.address,
          phone: formData.phone, email: formData.email || undefined,
          isActive: formData.isActive,
        });
        if (response.data.success) showToast('Thêm mới thành công', 'success');
      }
      loadStores();
      handleCloseDialog();
    } catch (error: any) { showToast('Lỗi khi lưu', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa cửa hàng này?')) return;
    try {
      const response = await storeAPI.delete(parseInt(id));
      if (response.data.success) {
        showToast('Xóa thành công', 'success');
        loadStores();
      }
    } catch (error: any) { showToast('Lỗi khi xóa', 'error'); }
  };

  // ================= GIAO DIỆN CHUẨN RIC =================
  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH CHI NHÁNH / CỬA HÀNG
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã/Tên chi nhánh..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            {isSuperAdmin() && (
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm Chi Nhánh</Button>
            )}
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Danh Sách</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Tổng quan các địa điểm kinh doanh trong toàn hệ thống</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {['Mã CH', 'Tên Chi Nhánh', 'Địa Chỉ', 'Số Điện Thoại', 'Email', 'Trạng Thái'].map((col) => (
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
                ) : filteredStores.length === 0 ? (
                   <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>Chưa có chi nhánh nào</TableCell></TableRow>
                ) : (
                  filteredStores.map((store, index) => (
                    <TableRow key={store.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Box onClick={() => handleOpenDialog(store)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                          <Box onClick={() => handleDelete(store.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><DeleteIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{store.code}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', p: 1.5 }}>{store.name}</TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LocationIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /> {store.address}</Box>
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{store.phone}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{store.email || '---'}</TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip 
                          label={store.isActive ? 'Hoạt động' : 'Tạm dừng'} 
                          size="small" 
                          sx={{ 
                            bgcolor: store.isActive ? '#dcfce7' : '#f1f5f9', 
                            color: store.isActive ? '#166534' : '#64748b', 
                            fontWeight: 600, borderRadius: 1 
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{filteredStores.length} chi nhánh</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG FORM (GIỮ NGUYÊN LOGIC) ================= */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editingStore ? 'CẬP NHẬT CHI NHÁNH' : 'THÊM CHI NHÁNH MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Mã Cửa Hàng (*)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} error={!!formErrors.code} helperText={formErrors.code} disabled={!!editingStore} />
              <TextField fullWidth size="small" label="Tên Cửa Hàng (*)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={!!formErrors.name} helperText={formErrors.name} />
            </Box>
            <TextField fullWidth size="small" label="Địa Chỉ (*)" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} multiline rows={2} error={!!formErrors.address} helperText={formErrors.address} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Số Điện Thoại (*)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} error={!!formErrors.phone} helperText={formErrors.phone} />
              <TextField fullWidth size="small" label="Email liên hệ" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight={600}>Trạng thái:</Typography>
              <Chip label={formData.isActive ? 'Đang hoạt động' : 'Tạm dừng'} color={formData.isActive ? 'success' : 'default'} onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} sx={{ cursor: 'pointer', fontWeight: 600 }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            {editingStore ? 'Cập Nhật' : 'Lưu Chi Nhánh'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};