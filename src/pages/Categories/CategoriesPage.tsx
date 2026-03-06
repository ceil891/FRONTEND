import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Checkbox, Chip, MenuItem,
  FormControl, InputLabel, Select, CircularProgress, TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { Category } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { categoryAPI, BackendCategory } from '../../api/client';

export const CategoriesPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);

  // ================= LOGIC API (GIỮ NGUYÊN 100%) =================
  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      if (response.data.success) {
        const backendCats = response.data.data || [];
        const mappedCats: Category[] = backendCats.map((cat: BackendCategory) => ({
          id: cat.id.toString(),
          name: cat.name,
          description: cat.description || undefined,
          parentId: cat.parentId?.toString(),
          image: cat.image || undefined,
          isActive: cat.isActive,
          createdAt: new Date(cat.createdAt),
          updatedAt: new Date(cat.updatedAt),
        }));
        setCategories(mappedCats);
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách danh mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '', description: '', parentId: '', isActive: true,
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name, description: category.description || '',
        parentId: category.parentId || '', isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', parentId: '', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', parentId: '', isActive: true });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'warning');
      return;
    }
    try {
      if (editingCategory) {
        const response = await categoryAPI.update(parseInt(editingCategory.id), {
          name: formData.name, description: formData.description || undefined,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
          isActive: formData.isActive,
        });
        if (response.data.success) {
          showToast('Cập nhật danh mục thành công', 'success');
          loadCategories();
        }
      } else {
        const response = await categoryAPI.create({
          name: formData.name, description: formData.description || undefined,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
          isActive: formData.isActive,
        });
        if (response.data.success) {
          showToast('Thêm danh mục thành công', 'success');
          loadCategories();
        }
      }
      handleCloseDialog();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lưu danh mục', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        const response = await categoryAPI.delete(parseInt(id));
        if (response.data.success) {
          showToast('Xóa danh mục thành công', 'success');
          loadCategories();
        }
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi xóa danh mục', 'error');
      }
    }
  };

  const getParentName = (parentId?: string) => {
    if (!parentId) return null;
    const parent = categories.find(cat => cat.id === parentId);
    return parent?.name || null;
  };

  const topLevelCategories = categories.filter(cat => !cat.parentId);
  
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH MỤC SẢN PHẨM
        </Typography>
      </Box>

      {/* ================= BẢNG GIAO DIỆN CHUẨN RIC ================= */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Tên danh mục..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm Danh Mục</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Danh Sách</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {['Tên Danh Mục', 'Danh Mục Cha', 'Mô Tả', 'Trạng Thái'].map((col) => (
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
                   <TableRow>
                     <TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell>
                   </TableRow>
                ) : filteredCategories.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>Chưa có danh mục nào</TableCell>
                   </TableRow>
                ) : (
                  filteredCategories.map((row, index) => (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      
                      {/* Cột Thao tác */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Box onClick={() => handleOpenDialog(row)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                          <Box onClick={() => handleDelete(row.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><DeleteIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>
                      
                      {/* Dữ liệu */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>
                        {row.name}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0284c7', fontWeight: 500, p: 1.5 }}>
                        {getParentName(row.parentId) || '---'}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                        {row.description || '---'}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        {row.isActive ? 
                          <Chip label="Hoạt động" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                          <Chip label="Ngừng" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
               {filteredCategories.length > 0 ? `1 - ${filteredCategories.length} of ${filteredCategories.length} items` : 'No items to display'}
             </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG FORM (GIỮ NGUYÊN HOÀN TOÀN TỪ CODE CŨ) ================= */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editingCategory ? 'CHỈNH SỬA DANH MỤC' : 'THÊM DANH MỤC MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth size="small" label="Tên Danh Mục (*)"
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
            />
            <TextField
              fullWidth size="small" label="Mô Tả"
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline rows={3}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Danh Mục Cha</InputLabel>
              <Select
                label="Danh Mục Cha"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              >
                <MenuItem value="">Không có (Danh mục gốc)</MenuItem>
                {topLevelCategories
                  .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                  .map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight={600}>Trạng thái:</Typography>
              <Chip
                label={formData.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                color={formData.isActive ? 'success' : 'default'}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            {editingCategory ? 'Lưu Cập Nhật' : 'Lưu Danh Mục'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};