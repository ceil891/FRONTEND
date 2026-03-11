import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, FormatSize as SizeIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

// Dữ liệu mẫu (Thay bằng API sau)
const mockSizes = [
  { id: 1, name: 'S', description: 'Size Nhỏ', isActive: true },
  { id: 2, name: 'M', description: 'Size Trung bình', isActive: true },
  { id: 3, name: 'L', description: 'Size Lớn', isActive: true },
];

export const SizePage: React.FC = () => {
  const [sizes, setSizes] = useState(mockSizes);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const filteredSizes = sizes.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, description: item.description, isActive: item.isActive });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return showToast('Vui lòng nhập tên kích thước', 'warning');
    
    // TODO: Gọi API Create/Update ở đây
    showToast(editingItem ? 'Cập nhật thành công' : 'Tạo mới thành công', 'success');
    setOpenDialog(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Chắc chắn muốn xóa kích thước này?')) {
      // TODO: Gọi API Delete ở đây
      setSizes(sizes.filter(s => s.id !== id));
      showToast('Đã xóa thành công', 'success');
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SizeIcon color="primary" fontSize="large" />
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ KÍCH THƯỚC
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
            <TextField 
              size="small" placeholder="Tìm kiếm size..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ width: 300, bgcolor: 'white' }}
            />
            {isSuperAdmin() && (
              <Button size="small" variant="contained" onClick={() => handleOpenDialog()} startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', boxShadow: 'none' }}>
                Thêm Kích Thước
              </Button>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 80 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên Size</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mô tả chi tiết</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  {isSuperAdmin() && <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSizes.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{row.name}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>
                      <Chip label={row.isActive ? 'Hoạt động' : 'Ngừng'} size="small" color={row.isActive ? 'success' : 'default'} />
                    </TableCell>
                    {isSuperAdmin() && (
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(row)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}><Pagination count={1} size="small" color="primary" /><Typography variant="body2" color="text.secondary">Tổng: {filteredSizes.length} bản ghi</Typography></Box>
        </CardContent>
      </Card>

      {/* Dialog Thêm/Sửa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>{editingItem ? 'SỬA KÍCH THƯỚC' : 'THÊM KÍCH THƯỚC'}</DialogTitle>
        <DialogContent sx={{ pt: '20px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth size="small" label="Ký hiệu Size (VD: S, M, L, 39, 40...)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} required />
          <TextField fullWidth size="small" label="Mô tả chi tiết" multiline rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, boxShadow: 'none' }}>Lưu lại</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};