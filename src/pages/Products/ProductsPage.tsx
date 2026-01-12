import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Product } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const ProductsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    price: '',
    costPrice: '',
    unit: 'Cái',
    barcode: '',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock data - Thay thế bằng API call
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      code: 'SP001',
      name: 'Coca Cola 330ml',
      description: 'Nước ngọt có ga',
      categoryId: 'cat1',
      price: 15000,
      costPrice: 10000,
      unit: 'Lon',
      barcode: '8934567890123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      code: 'SP002',
      name: 'Pepsi 330ml',
      description: 'Nước ngọt có ga',
      categoryId: 'cat1',
      price: 15000,
      costPrice: 10000,
      unit: 'Lon',
      barcode: '8934567890124',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      code: 'SP003',
      name: 'Bánh mì thịt nướng',
      description: 'Bánh mì kẹp thịt nướng',
      categoryId: 'cat2',
      price: 25000,
      costPrice: 15000,
      unit: 'Cái',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() || '',
        unit: product.unit,
        barcode: product.barcode || '',
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        categoryId: '',
        price: '',
        costPrice: '',
        unit: 'Cái',
        barcode: '',
        isActive: true,
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      categoryId: '',
      price: '',
      costPrice: '',
      unit: 'Cái',
      barcode: '',
      isActive: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = 'Mã sản phẩm là bắt buộc';
    if (!formData.name.trim()) errors.name = 'Tên sản phẩm là bắt buộc';
    if (!formData.categoryId) errors.categoryId = 'Vui lòng chọn danh mục';
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = 'Giá bán phải lớn hơn 0';
    }
    if (formData.costPrice && Number(formData.costPrice) <= 0) {
      errors.costPrice = 'Giá nhập phải lớn hơn 0';
    }
    if (!formData.unit.trim()) errors.unit = 'Đơn vị là bắt buộc';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    if (editingProduct) {
      // Update product
      setProducts(products.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              code: formData.code,
              name: formData.name,
              description: formData.description,
              categoryId: formData.categoryId,
              price: Number(formData.price),
              costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
              unit: formData.unit,
              barcode: formData.barcode || undefined,
              isActive: formData.isActive,
              updatedAt: new Date(),
            }
          : p
      ));
      showToast('Cập nhật sản phẩm thành công', 'success');
    } else {
      // Create new product
      const newProduct: Product = {
        id: Date.now().toString(),
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        unit: formData.unit,
        barcode: formData.barcode || undefined,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProducts([...products, newProduct]);
      showToast('Thêm sản phẩm thành công', 'success');
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setProducts(products.filter(p => p.id !== id));
      showToast('Xóa sản phẩm thành công', 'success');
    }
  };

  const mockCategories = [
    { id: 'cat1', name: 'Đồ Uống' },
    { id: 'cat2', name: 'Thực Phẩm' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản Lý Sản Phẩm
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
            Thêm Sản Phẩm
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã SP</TableCell>
                  <TableCell>Tên Sản Phẩm</TableCell>
                  <TableCell>Danh Mục</TableCell>
                  <TableCell align="right">Giá Bán</TableCell>
                  <TableCell align="right">Giá Nhập</TableCell>
                  <TableCell>Đơn Vị</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>
                        {product.name}
                      </Typography>
                      {product.description && (
                        <Typography variant="caption" color="text.secondary">
                          {product.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>Danh mục {product.categoryId}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(product.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {product.costPrice ? formatCurrency(product.costPrice) : 'N/A'}
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.isActive ? 'Hoạt động' : 'Ngừng'}
                        color={product.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {isSuperAdmin() && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(product)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(product.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Mã Sản Phẩm"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                error={!!formErrors.code}
                helperText={formErrors.code}
              />
              <TextField
                fullWidth
                label="Mã Vạch"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </Box>
            <TextField
              fullWidth
              label="Tên Sản Phẩm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              fullWidth
              label="Mô Tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth required error={!!formErrors.categoryId}>
              <InputLabel>Danh Mục</InputLabel>
              <Select
                label="Danh Mục"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {mockCategories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
              {formErrors.categoryId && (
                <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                  {formErrors.categoryId}
                </Typography>
              )}
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Giá Bán (VNĐ)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                error={!!formErrors.price}
                helperText={formErrors.price}
                InputProps={{
                  inputProps: { min: 0, step: 1000 },
                }}
              />
              <TextField
                fullWidth
                label="Giá Nhập (VNĐ)"
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                error={!!formErrors.costPrice}
                helperText={formErrors.costPrice}
                InputProps={{
                  inputProps: { min: 0, step: 1000 },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Đơn Vị"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
                error={!!formErrors.unit}
                helperText={formErrors.unit}
                select
                SelectProps={{ native: true }}
              >
                <option value="Cái">Cái</option>
                <option value="Lon">Lon</option>
                <option value="Chai">Chai</option>
                <option value="Kg">Kg</option>
                <option value="Thùng">Thùng</option>
              </TextField>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Typography>Trạng thái:</Typography>
                <Chip
                  label={formData.isActive ? 'Hoạt động' : 'Ngừng'}
                  color={formData.isActive ? 'success' : 'default'}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
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
            {editingProduct ? 'Cập Nhật' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
