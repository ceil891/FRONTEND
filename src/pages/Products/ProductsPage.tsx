import React, { useEffect, useState } from 'react';
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
import {
  categoryAPI,
  productAPI,
  
  type BackendSanPham,

} from '../../api/client';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<BackendDonVi[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, unitRes] = await Promise.all([
        productAPI.getAll(),
        categoryAPI.getAll(),
        unitAPI.getAll(),
      ]);

      const backendProducts = prodRes.data || [];
      const mappedProducts: Product[] = backendProducts.map((sp: BackendSanPham) => ({
        id: String(sp.sanPhamId),
        code: sp.maSku,
        name: sp.tenSanPham,
        description: sp.moTa || undefined,
        categoryId: sp.danhMucId ? String(sp.danhMucId) : '',
        price: Number(sp.giaBan ?? 0),
        costPrice: sp.giaNhap != null ? Number(sp.giaNhap) : undefined,
        unit: sp.tenDonVi || 'Cái',
        barcode: sp.maVach || undefined,
        isActive: !!sp.hoatDong,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setProducts(mappedProducts);

      if (catRes.data.success) {
        const list = catRes.data.data || [];
        setCategories(
          list.map((c: any) => ({
            id: String(c.id),
            name: c.name || c.tenDanhMuc || c.ten || 'Danh mục',
          })),
        );
      }

      const unitList = unitRes.data || [];
      setUnits(unitList);
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      setImageFile(null);
      setImagePreview(null);
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
    setImageFile(null);
    setImagePreview(null);
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

    void saveToBackend();
  };

  const saveToBackend = async () => {
    try {
      setLoading(true);

      let uploadedUrls: string[] | undefined;
      if (imageFile) {
        const form = new FormData();
        form.append('file', imageFile);
        form.append('folder', 'products');
        const res = await fetch('http://localhost:8080/api/v1/cloudinary/upload?folder=products', {
          method: 'POST',
          body: form,
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls = [data.secure_url];
        }
      }

      const selectedUnit =
        units.find((u) => u.tenDonVi === formData.unit) ||
        units[0];

      const payload = {
        maSku: formData.code,
        tenSanPham: formData.name,
        danhMucId: Number(formData.categoryId),
        donViId: selectedUnit ? selectedUnit.donViId : 1,
        giaBan: Number(formData.price),
        giaNhap: formData.costPrice ? Number(formData.costPrice) : undefined,
        maVach: formData.barcode || undefined,
        moTa: formData.description || undefined,
        hoatDong: formData.isActive,
        thuongHieu: undefined,
        hinhAnhUrls: uploadedUrls,
      };

      if (editingProduct) {
        await productAPI.update(Number(editingProduct.id), payload);
        showToast('Cập nhật sản phẩm thành công', 'success');
      } else {
        await productAPI.create(payload);
        showToast('Thêm sản phẩm thành công', 'success');
      }

      await loadInitialData();
      handleCloseDialog();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || error.message || 'Lỗi khi lưu sản phẩm',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      setLoading(true);
      await productAPI.delete(Number(id));
      showToast('Xóa sản phẩm thành công', 'success');
      await loadInitialData();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || error.message || 'Lỗi khi xóa sản phẩm',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

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
                    <TableCell>
                      {categories.find((c) => c.id === product.categoryId)?.name ||
                        product.categoryId}
                    </TableCell>
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
              <Button
                component="label"
                variant="outlined"
                sx={{ alignSelf: 'flex-end', mt: 0.5 }}
              >
                Chọn Hình Ảnh
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    } else {
                      setImagePreview(null);
                    }
                  }}
                />
              </Button>
            </Box>
            {imagePreview && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption">Xem trước hình ảnh:</Typography>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="preview"
                  sx={{
                    display: 'block',
                    mt: 1,
                    width: 160,
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: 2,
                  }}
                />
              </Box>
            )}
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
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
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

      {/* ===== Dialog quản lý biến thể ===== */}
      <Dialog open={openVariantDialog} onClose={() => setOpenVariantDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Biến thể sản phẩm: {variantProduct?.name}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 2fr 1fr', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              label="Tên biến thể"
              value={variantForm.tenBienThe}
              onChange={(e) => setVariantForm((p) => ({ ...p, tenBienThe: e.target.value }))}
            />
            <TextField
              size="small"
              label="SKU biến thể *"
              value={variantForm.maSku}
              onChange={(e) => setVariantForm((p) => ({ ...p, maSku: e.target.value }))}
            />
            <TextField
              size="small"
              label="Giá bán"
              value={variantForm.giaBan}
              onChange={(e) => setVariantForm((p) => ({ ...p, giaBan: e.target.value }))}
            />
            <TextField
              size="small"
              label="Giá nhập"
              value={variantForm.giaNhap}
              onChange={(e) => setVariantForm((p) => ({ ...p, giaNhap: e.target.value }))}
            />
            <TextField
              size="small"
              label="Mã vạch"
              value={variantForm.maVach}
              onChange={(e) => setVariantForm((p) => ({ ...p, maVach: e.target.value }))}
            />
            <Button variant="contained" onClick={createVariant} sx={{ textTransform: 'none' }}>
              Tạo
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Tên biến thể</TableCell>
                  <TableCell align="right">Giá bán</TableCell>
                  <TableCell align="right">Giá nhập</TableCell>
                  <TableCell>Mã vạch</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Xóa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variantLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Chưa có biến thể
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((v) => (
                    <TableRow key={v.bienTheId}>
                      <TableCell>{v.bienTheId}</TableCell>
                      <TableCell>{v.maSku}</TableCell>
                      <TableCell>{v.tenBienThe}</TableCell>
                      <TableCell align="right">{Number(v.giaBan ?? 0).toLocaleString('vi-VN')}</TableCell>
                      <TableCell align="right">{Number(v.giaNhap ?? 0).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>{v.maVach}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={v.hoatDong ? 'Đang bán' : 'Ngưng bán'}
                          size="small"
                          color={v.hoatDong ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" color="error" onClick={() => deleteVariant(v.bienTheId)}>
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVariantDialog(false)} sx={{ textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};