import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
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

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

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
    name: '',
    description: '',
    parentId: '',
    isActive: true,
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || '',
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parentId: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parentId: '',
      isActive: true,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'warning');
      return;
    }

    try {
      if (editingCategory) {
        // Update
        const response = await categoryAPI.update(parseInt(editingCategory.id), {
          name: formData.name,
          description: formData.description || undefined,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
          isActive: formData.isActive,
        });
        if (response.data.success) {
          showToast('Cập nhật danh mục thành công', 'success');
          loadCategories();
        }
      } else {
        // Create
        const response = await categoryAPI.create({
          name: formData.name,
          description: formData.description || undefined,
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
  const childCategories = categories.filter(cat => cat.parentId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" />
          Quản Lý Danh Mục
        </Typography>
        {isSuperAdmin() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              },
            }}
          >
            Thêm Danh Mục
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {topLevelCategories.map((category) => (
          <Grid item xs={12} md={6} lg={4} key={category.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {category.name}
                    </Typography>
                    {category.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {category.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={category.isActive ? 'Hoạt động' : 'Ngừng'}
                    color={category.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                {childCategories.filter(cat => cat.parentId === category.id).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Danh mục con:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {childCategories
                        .filter(cat => cat.parentId === category.id)
                        .map(child => (
                          <Chip key={child.id} label={child.name} size="small" variant="outlined" />
                        ))}
                    </Box>
                  </Box>
                )}
                {isSuperAdmin() && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(category)}
                      fullWidth
                    >
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(category.id)}
                      fullWidth
                    >
                      Xóa
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Tên Danh Mục"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mô Tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
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
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Trạng thái:</Typography>
              <Chip
                label={formData.isActive ? 'Hoạt động' : 'Ngừng'}
                color={formData.isActive ? 'success' : 'default'}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {editingCategory ? 'Cập Nhật' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
