import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Edit as EditIcon, SettingsBackupRestore as RestoreIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Import API và Types
import { unitAPI } from '../../api/client';
import { BackendUnit } from '../../types/api.types';

export const UnitsPage: React.FC = () => {
  const [units, setUnits] = useState<BackendUnit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States cho Dialog Thêm/Sửa
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BackendUnit | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', description: '', isActive: true });

  const { showToast } = useToastStore();

  // Load danh sách ĐVT
  const fetchUnits = async () => {
    try {
      const res = await unitAPI.getAll();
      const responseData = res.data as any;
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setUnits(items);
    } catch (error: any) {
      showToast(error.message || 'Lỗi tải danh sách Đơn vị tính', 'error');
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Lọc dữ liệu theo Tên hoặc Mã
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (item?: BackendUnit) => {
    if (item) {
      setEditingItem(item);
      setFormData({ code: item.code, name: item.name, description: item.description || '', isActive: item.status === 'ACTIVE' });
    } else {
      setEditingItem(null);
      setFormData({ code: '', name: '', description: '', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) return showToast('Vui lòng nhập Mã và Tên ĐVT', 'warning');
    
    const payload = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description,
      status: formData.isActive ? 'ACTIVE' : 'INACTIVE'
    };

    try {
      if (editingItem) {
        await unitAPI.update(editingItem.id, payload);
        showToast('Cập nhật thành công', 'success');
      } else {
        await unitAPI.create(payload);
        showToast('Tạo mới thành công', 'success');
      }
      setOpenDialog(false);
      fetchUnits();
    } catch (error: any) {
      showToast(error.message || 'Có lỗi xảy ra khi lưu', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Chắc chắn muốn xóa Đơn vị tính này?')) {
      try {
        await unitAPI.delete(id);
        showToast('Đã xóa thành công', 'success');
        fetchUnits();
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi xóa Đơn vị tính', 'error');
      }
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ ĐƠN VỊ TÍNH
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã ĐVT/Tên ĐVT..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            <Button onClick={() => handleOpenDialog()} size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm ĐVT</Button>
            <Button size="small" variant="contained" startIcon={<RestoreIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Khôi phục</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Danh Sách</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>ID</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 90, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao tác</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Mã ĐVT</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Tên Đơn Vị Tính</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Ghi Chú / Mô Tả</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Trạng Thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUnits.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.id}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(row)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{row.code}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700, p: 1.5 }}>{row.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5, fontStyle: 'italic' }}>{row.description}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip 
                        label={row.status === 'ACTIVE' ? 'Sử dụng' : 'Ngừng dùng'} 
                        size="small" 
                        sx={{ 
                          bgcolor: row.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', 
                          color: row.status === 'ACTIVE' ? '#166534' : '#b91c1c', 
                          fontWeight: 600, border: 'none', borderRadius: 1 
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Tổng: {filteredUnits.length} bản ghi</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* DIALOG THÊM / SỬA */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>{editingItem ? 'SỬA ĐƠN VỊ TÍNH' : 'THÊM ĐƠN VỊ TÍNH'}</DialogTitle>
        <DialogContent sx={{ pt: '20px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth size="small" label="Mã ĐVT (VD: CAI, THUNG)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} required />
          <TextField fullWidth size="small" label="Tên ĐVT (VD: Cái, Thùng)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <TextField fullWidth size="small" label="Ghi chú / Mô tả" multiline rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, boxShadow: 'none' }}>Lưu lại</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};