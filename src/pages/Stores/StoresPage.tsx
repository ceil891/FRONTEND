import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, FormHelperText, Checkbox, Pagination, IconButton
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Lock as LockIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  LocationOn as LocationIcon, Phone as PhoneIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

// IMPORT API
import { storeAPI, areaAPI } from '../../api/client';

export const StoresPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    code: '', name: '', address: '', phone: '', email: '', 
    areaId: '', isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stores, setStores] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    loadStores();
    loadAreas();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getAll();
      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setStores(items);
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách cửa hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAreas = async () => {
    try {
      const response = await areaAPI.getAll();
      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setAreas(items.filter((a: any) => a.status === 'ACTIVE' || a.isActive === true)); 
    } catch (error: any) {
      console.error('Lỗi tải khu vực:', error);
    }
  };

  const handleOpenDialog = (store?: any) => {
    if (store) {
      setEditingStore(store);
      const matchingArea = areas.find(a => a.name === store.areaName);
      
      setFormData({
        code: store.code || '',
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
        areaId: matchingArea ? matchingArea.id.toString() : '',
        isActive: store.status === 'ACTIVE', 
      });
    } else {
      setEditingStore(null);
      setFormData({ code: '', name: '', address: '', phone: '', email: '', areaId: '', isActive: true });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStore(null);
    setFormData({ code: '', name: '', address: '', phone: '', email: '', areaId: '', isActive: true });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Tên cửa hàng là bắt buộc';
    if (!formData.address.trim()) errors.address = 'Địa chỉ là bắt buộc';
    if (!formData.areaId) errors.areaId = 'Vui lòng chọn Khu vực';
    
    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'SĐT không hợp lệ';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Vui lòng kiểm tra lại các trường báo lỗi', 'warning');
      return;
    }

    const payload = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      email: formData.email || null,
      areaId: parseInt(formData.areaId),
      status: formData.isActive ? 'ACTIVE' : 'INACTIVE' 
    };

    try {
      if (editingStore) {
        await storeAPI.update(editingStore.id, payload);
        showToast('Cập nhật cửa hàng thành công', 'success');
      } else {
        await storeAPI.create(payload);
        showToast('Thêm cửa hàng thành công', 'success');
      }
      handleCloseDialog();
      loadStores();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lưu cửa hàng', 'error');
    }
  };

  // 👉 ĐÃ SỬA: Đổi tên hàm và câu thông báo thành "Khóa"
  const handleLock = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn KHÓA cửa hàng này?')) {
      try {
        await storeAPI.delete(id); // Vẫn gọi api delete vì Backend dùng @DeleteMapping
        showToast('Khóa cửa hàng thành công', 'success');
        loadStores();
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi khóa cửa hàng', 'error');
      }
    }
  };

  const filteredStores = stores.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone || '').includes(searchQuery)
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ CỬA HÀNG
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã/Tên cửa hàng/SĐT..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            {isSuperAdmin() && (
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm Cửa Hàng</Button>
            )}
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Excel</Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 90, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao tác</TableCell>
                  
                  {['Mã CH', 'Tên Cửa Hàng', 'Khu Vực', 'Điện Thoại', 'Địa Chỉ', 'Trạng Thái'].map((col) => (
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
                ) : filteredStores.map((store, index) => (
                  <TableRow key={store.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(store)}><EditIcon fontSize="small" /></IconButton>
                      {/* 👉 ĐÃ SỬA: Dùng handleLock và có thể đổi icon thành ổ khóa (LockIcon) nếu muốn, mình vẫn giữ thùng rác cho quen thuộc nhé */}
                      <IconButton size="small" color="error" onClick={() => handleLock(store.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>{store.code}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', p: 1.5 }}>{store.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#00a65a', fontWeight: 600, p: 1.5 }}>{store.areaName}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{store.phone}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <LocationIcon fontSize="small" sx={{ color: '#94a3b8', fontSize: 16, mt: 0.2 }} />
                        {store.address}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip 
                        label={store.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'} 
                        size="small" 
                        sx={{ 
                          bgcolor: store.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', 
                          color: store.status === 'ACTIVE' ? '#166534' : '#b91c1c', 
                          fontWeight: 600, borderRadius: 1, border: 'none'
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredStores.length === 0 && !loading && (
                   <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có dữ liệu cửa hàng</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Tổng: {filteredStores.length} bản ghi</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* DIALOG FORM */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>
          {editingStore ? 'CHỈNH SỬA CỬA HÀNG' : 'THÊM CỬA HÀNG MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
              <TextField
                size="small" label="Mã Cửa Hàng (Tự động sinh)" value={formData.code} disabled
              />
              <TextField
                size="small" label="Tên Cửa Hàng (*)" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name} helperText={formErrors.name}
              />
            </Box>

            <FormControl size="small" fullWidth error={!!formErrors.areaId}>
              <InputLabel>Trực thuộc Khu vực / Vùng miền (*)</InputLabel>
              <Select
                value={formData.areaId}
                label="Trực thuộc Khu vực / Vùng miền (*)"
                onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
              >
                {areas.length === 0 ? (
                  <MenuItem value="" disabled>Chưa có khu vực nào. Hãy tạo khu vực trước!</MenuItem>
                ) : (
                  areas.map((area) => (
                    <MenuItem key={area.id} value={area.id.toString()}>
                      {area.name} - {area.code}
                    </MenuItem>
                  ))
                )}
              </Select>
              {formErrors.areaId && <FormHelperText>{formErrors.areaId}</FormHelperText>}
            </FormControl>

            <TextField
              size="small" label="Địa Chỉ (*)" value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline rows={2} error={!!formErrors.address} helperText={formErrors.address}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                size="small" label="Số Điện Thoại (*)" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={!!formErrors.phone} helperText={formErrors.phone}
              />
              <TextField
                size="small" label="Email" type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email} helperText={formErrors.email}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight={600}>Trạng thái hoạt động:</Typography>
              <Chip
                label={formData.isActive ? 'Đang hoạt động' : 'Tạm ngừng'}
                color={formData.isActive ? 'success' : 'default'}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={handleCloseDialog} color="inherit">Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', boxShadow: 'none' }}>
            {editingStore ? 'Lưu Thay Đổi' : 'Tạo Cửa Hàng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};