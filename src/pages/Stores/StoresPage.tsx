import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Store } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const StoresPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock data - Thay thế bằng API call
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      code: 'CH001',
      name: 'Cửa Hàng Trung Tâm',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      phone: '0901234567',
      email: 'store1@example.com',
      managerId: 'user-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      code: 'CH002',
      name: 'Cửa Hàng Chi Nhánh 1',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      phone: '0901234568',
      email: 'store2@example.com',
      managerId: 'user-2',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      code: 'CH003',
      name: 'Cửa Hàng Chi Nhánh 2',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      phone: '0901234569',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const handleOpenDialog = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        code: store.code,
        name: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email || '',
        isActive: store.isActive,
      });
    } else {
      setEditingStore(null);
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        isActive: true,
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStore(null);
    setFormData({
      code: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      isActive: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = 'Mã cửa hàng là bắt buộc';
    if (!formData.name.trim()) errors.name = 'Tên cửa hàng là bắt buộc';
    if (!formData.address.trim()) errors.address = 'Địa chỉ là bắt buộc';
    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    if (editingStore) {
      // Update store
      setStores(stores.map(s =>
        s.id === editingStore.id
          ? {
              ...s,
              code: formData.code,
              name: formData.name,
              address: formData.address,
              phone: formData.phone,
              email: formData.email || undefined,
              isActive: formData.isActive,
              updatedAt: new Date(),
            }
          : s
      ));
      showToast('Cập nhật cửa hàng thành công', 'success');
    } else {
      // Create new store
      const newStore: Store = {
        id: Date.now().toString(),
        code: formData.code,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email || undefined,
        managerId: undefined,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setStores([...stores, newStore]);
      showToast('Thêm cửa hàng thành công', 'success');
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cửa hàng này?')) {
      setStores(stores.filter(s => s.id !== id));
      showToast('Xóa cửa hàng thành công', 'success');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản Lý Cửa Hàng
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
            Thêm Cửa Hàng
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {stores.map((store) => (
          <Grid item xs={12} md={6} lg={4} key={store.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {store.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {store.code}
                    </Typography>
                  </Box>
                  <Chip
                    label={store.isActive ? 'Hoạt động' : 'Ngừng'}
                    color={store.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">{store.address}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{store.phone}</Typography>
                  </Box>
                  {store.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{store.email}</Typography>
                    </Box>
                  )}
                </Box>
                {isSuperAdmin() && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(store)}
                      sx={{
                        flex: 1,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(store.id)}
                      sx={{
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                        },
                      }}
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

      {/* Add/Edit Store Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStore ? 'Chỉnh Sửa Cửa Hàng' : 'Thêm Cửa Hàng Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Mã Cửa Hàng"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              error={!!formErrors.code}
              helperText={formErrors.code}
            />
            <TextField
              fullWidth
              label="Tên Cửa Hàng"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              fullWidth
              label="Địa Chỉ"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
              required
              error={!!formErrors.address}
              helperText={formErrors.address}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Số Điện Thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                error={!!formErrors.phone}
                helperText={formErrors.phone}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Trạng thái hoạt động:</Typography>
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
            {editingStore ? 'Cập Nhật' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
