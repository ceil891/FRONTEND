import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, ColorLens as ColorIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

// IMPORT API VÀ TYPES
import { colorAPI } from '../../api/client';
import { BackendColor } from '../../types/api.types';

export const ColorPage: React.FC = () => {
  // Đổi thành state rỗng
  const [colors, setColors] = useState<BackendColor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BackendColor | null>(null);
  
  const [formData, setFormData] = useState({ name: '', hexCode: '#000000', isActive: true });
  
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  // Load danh sách màu sắc từ Backend
  const fetchColors = async () => {
    try {
      const res = await colorAPI.getAll();
      const responseData = res.data as any;
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setColors(items);
    } catch (error: any) {
      showToast(error.message || 'Lỗi tải danh sách màu sắc', 'error');
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const filteredColors = colors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenDialog = (item?: BackendColor) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, hexCode: item.hexCode, isActive: item.status === 'ACTIVE' });
    } else {
      setEditingItem(null);
      setFormData({ name: '', hexCode: '#000000', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return showToast('Vui lòng nhập tên màu', 'warning');
    
    const payload = {
      name: formData.name,
      hexCode: formData.hexCode,
      status: formData.isActive ? 'ACTIVE' : 'INACTIVE'
    };

    try {
      if (editingItem) {
        await colorAPI.update(editingItem.id, payload);
        showToast('Cập nhật thành công', 'success');
      } else {
        await colorAPI.create(payload);
        showToast('Tạo mới thành công', 'success');
      }
      setOpenDialog(false);
      fetchColors(); // Load lại data
    } catch (error: any) {
      showToast(error.message || 'Có lỗi xảy ra khi lưu', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Chắc chắn muốn xóa màu này?')) {
      try {
        await colorAPI.delete(id);
        showToast('Đã xóa thành công', 'success');
        fetchColors(); // Load lại data
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi xóa màu sắc', 'error');
      }
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ColorIcon color="primary" fontSize="large" />
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ MÀU SẮC
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
            <TextField 
              size="small" placeholder="Tìm kiếm màu sắc..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ width: 300, bgcolor: 'white' }}
            />
            {isSuperAdmin() && (
              <Button size="small" variant="contained" onClick={() => handleOpenDialog()} startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', boxShadow: 'none' }}>
                Thêm Màu
              </Button>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 80 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên màu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mã hiển thị</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  {isSuperAdmin() && <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredColors.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: row.hexCode, border: '1px solid #ddd' }} />
                        <Typography variant="body2" color="text.secondary">{row.hexCode}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'} size="small" color={row.status === 'ACTIVE' ? 'success' : 'default'} />
                    </TableCell>
                    {isSuperAdmin() && (
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(row)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                
                {filteredColors.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        Chưa có dữ liệu màu sắc
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}><Pagination count={1} size="small" color="primary" /><Typography variant="body2" color="text.secondary">Tổng: {filteredColors.length} bản ghi</Typography></Box>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>{editingItem ? 'SỬA MÀU SẮC' : 'THÊM MÀU SẮC'}</DialogTitle>
        <DialogContent sx={{ pt: '20px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth size="small" label="Tên màu (VD: Đỏ, Xanh...)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField fullWidth size="small" type="color" label="Chọn mã màu" value={formData.hexCode} onChange={e => setFormData({...formData, hexCode: e.target.value})} />
            <Typography variant="body2" sx={{ width: 80 }}>{formData.hexCode}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, boxShadow: 'none' }}>Lưu lại</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};