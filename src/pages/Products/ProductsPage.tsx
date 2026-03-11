import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, FormControl,
  InputLabel, Select, Chip, CircularProgress, Pagination, Badge
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  ListAlt as ListAltIcon, Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Cancel as CancelIcon, PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { Product } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { categoryAPI, productAPI, variantAPI, BackendSanPham, BackendBienTheSanPham } from '../../api/client';

const unitAPI = {
  getAll: async () => ({ data: [{ donViId: 1, tenDonVi: 'Cái' }, { donViId: 2, tenDonVi: 'Hộp' }, { donViId: 3, tenDonVi: 'Kg' }] })
};

export const ProductsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({ code: '', name: '', description: '', categoryId: '', price: '', costPrice: '', unit: 'Cái', barcode: '', isActive: true });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // ================= QUẢN LÝ ẢNH CHÍNH & ẢNH PHỤ =================
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [subImageFiles, setSubImageFiles] = useState<File[]>([]);
  const [subImagePreviews, setSubImagePreviews] = useState<string[]>([]);

  // ================= QUẢN LÝ BIẾN THỂ =================
  const [openVariantDialog, setOpenVariantDialog] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<BackendBienTheSanPham[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantForm, setVariantForm] = useState({ tenBienThe: '', maSku: '', giaBan: '', giaNhap: '', maVach: '' });

  useEffect(() => { void loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([productAPI.getAll(), categoryAPI.getAll()]);

      const backendProducts = prodRes.data || [];
      const mappedProducts: Product[] = backendProducts.map((sp: BackendSanPham) => ({
        id: String(sp.sanPhamId),
        code: sp.maSku,
        name: sp.tenSanPham,
        description: sp.moTa || undefined,
        categoryId: sp.danhMuc?.danhMucId ? String(sp.danhMuc.danhMucId) : '',
        price: Number(sp.giaBan ?? 0),
        costPrice: sp.giaNhap != null ? Number(sp.giaNhap) : undefined,
        unit: 'Cái', 
        barcode: sp.maVach || undefined,
        isActive: !!sp.hoatDong,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setProducts(mappedProducts);

      // @ts-ignore
      if (catRes.data?.success) {
        // @ts-ignore
        setCategories((catRes.data.data || []).map((c: any) => ({ id: String(c.id), name: c.name || c.tenDanhMuc || c.ten || 'Danh mục' })));
      }
    } catch (error: any) {
      showToast('Lỗi khi tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || p.categoryId === categoryFilter;
    return matchSearch && matchCategory;
  });

  // ================= XỬ LÝ ẢNH =================
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSubImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setSubImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeSubImage = (index: number) => {
    setSubImageFiles(prev => prev.filter((_, i) => i !== index));
    setSubImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Helper upload từng file lên Cloudinary
  const uploadSingleFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'products');
    const res = await fetch('http://localhost:8080/api/v1/cloudinary/upload?folder=products', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    return data.secure_url;
  };

  // ================= XỬ LÝ FORM SẢN PHẨM =================
  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ code: product.code, name: product.name, description: product.description || '', categoryId: product.categoryId, price: product.price.toString(), costPrice: product.costPrice?.toString() || '', unit: product.unit || 'Cái', barcode: product.barcode || '', isActive: product.isActive });
    } else {
      setEditingProduct(null);
      setFormData({ code: '', name: '', description: '', categoryId: '', price: '', costPrice: '', unit: 'Cái', barcode: '', isActive: true });
    }
    setFormErrors({});
    setMainImageFile(null); setMainImagePreview(null);
    setSubImageFiles([]); setSubImagePreviews([]);
    setOpenDialog(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = 'Mã sản phẩm là bắt buộc';
    if (!formData.name.trim()) errors.name = 'Tên sản phẩm là bắt buộc';
    if (!formData.categoryId) errors.categoryId = 'Vui lòng chọn danh mục';
    if (!formData.price || Number(formData.price) <= 0) errors.price = 'Giá bán phải lớn hơn 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return showToast('Vui lòng điền đầy đủ thông tin', 'warning');
    
    try {
      setLoading(true);
      let uploadedUrls: string[] = [];

      // 1. Upload Ảnh Chính
      if (mainImageFile) {
        try {
          const url = await uploadSingleFile(mainImageFile);
          if (url) uploadedUrls.push(url);
        } catch (e) { console.warn("Lỗi upload ảnh chính", e); }
      }

      // 2. Upload các Ảnh Phụ
      if (subImageFiles.length > 0) {
        try {
          const subUrls = await Promise.all(subImageFiles.map(file => uploadSingleFile(file)));
          uploadedUrls = [...uploadedUrls, ...subUrls.filter(u => u)];
        } catch (e) { console.warn("Lỗi upload ảnh phụ", e); }
      }

      const payload = {
        maSku: formData.code,
        tenSanPham: formData.name,
        danhMucId: Number(formData.categoryId),
        donViId: 1, 
        giaBan: Number(formData.price),
        giaNhap: formData.costPrice ? Number(formData.costPrice) : undefined,
        maVach: formData.barcode || undefined,
        moTa: formData.description || undefined,
        hoatDong: formData.isActive,
        hinhAnhUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined, // Array URL: index 0 là ảnh chính
      };

      if (editingProduct) {
        await productAPI.update(Number(editingProduct.id), payload);
        showToast('Cập nhật sản phẩm thành công', 'success');
      } else {
        await productAPI.create(payload);
        showToast('Thêm sản phẩm thành công', 'success');
      }

      await loadInitialData();
      setOpenDialog(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi khi lưu sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try { setLoading(true); await productAPI.delete(Number(id)); showToast('Xóa sản phẩm thành công', 'success'); await loadInitialData(); } 
    catch (error) { showToast('Lỗi khi xóa sản phẩm', 'error'); } 
    finally { setLoading(false); }
  };

  // ================= XỬ LÝ BIẾN THỂ =================
  const handleOpenVariant = async (product: Product) => {
    setVariantProduct(product); setOpenVariantDialog(true); setVariantForm({ tenBienThe: '', maSku: '', giaBan: '', giaNhap: '', maVach: '' }); await loadVariants(Number(product.id));
  };
  const loadVariants = async (productId: number) => {
    try { setVariantLoading(true); const res = await variantAPI.getByProductId(productId); /* @ts-ignore */ setVariants(res.data?.data || res.data || []); } 
    catch (error) { showToast('Lỗi tải dữ liệu biến thể', 'error'); } finally { setVariantLoading(false); }
  };
  const createVariant = async () => {
    if (!variantProduct || !variantForm.tenBienThe || !variantForm.maSku) return showToast('Vui lòng nhập Tên và SKU', 'warning');
    try { setVariantLoading(true); await variantAPI.create({ sanPhamId: Number(variantProduct.id), tenBienThe: variantForm.tenBienThe, maSku: variantForm.maSku, giaBan: Number(variantForm.giaBan) || 0, giaNhap: Number(variantForm.giaNhap) || 0, maVach: variantForm.maVach, hoatDong: true }); showToast('Tạo thành công', 'success'); setVariantForm({ tenBienThe: '', maSku: '', giaBan: '', giaNhap: '', maVach: '' }); await loadVariants(Number(variantProduct.id)); } 
    catch (error) { showToast('Lỗi tạo biến thể', 'error'); } finally { setVariantLoading(false); }
  };
  const deleteVariant = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    try { setVariantLoading(true); await variantAPI.delete(id); showToast('Đã xóa', 'success'); if (variantProduct) await loadVariants(Number(variantProduct.id)); } 
    catch (error) { showToast('Lỗi xóa', 'error'); } finally { setVariantLoading(false); }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}><Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>DANH MỤC SẢN PHẨM</Typography></Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField size="small" placeholder="Tìm: Mã SP / Tên SP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ width: 250, bgcolor: 'white', mr: 1 }} />
            <FormControl size="small" sx={{ minWidth: 180, mr: 1 }}>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ bgcolor: 'white' }}>
                <MenuItem value="ALL">Tất cả danh mục</MenuItem>
                {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button size="small" variant="contained" onClick={() => handleOpenDialog()} startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', boxShadow: 'none' }}>Tạo Sản Phẩm</Button>
            <Button size="small" variant="contained" onClick={() => showToast('Đang kết nối máy in...', 'info')} startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', textTransform: 'none', boxShadow: 'none' }}>In Mã Vạch</Button>
            <Button size="small" variant="contained" onClick={() => showToast('Đang xuất file Excel...', 'info')} startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', textTransform: 'none', boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  {['Mã SP', 'Tên Sản Phẩm', 'Danh Mục', 'Giá Bán', 'Giá Nhập', 'Trạng Thái', 'Thao Tác'].map((col, i) => (
                    <TableCell key={i} align={col.includes('Giá') || col === 'Thao Tác' ? 'right' : 'left'} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>
                      {col} {col !== 'Thao Tác' && <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1', verticalAlign: 'middle', ml: 0.5 }} />}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && products.length === 0 ? <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow> :
                filteredProducts.map((product) => (
                  <TableRow key={product.id} hover sx={{ bgcolor: !product.isActive ? '#f871711a' : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{product.code}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{product.name}</Typography>{product.barcode && <Typography variant="caption" color="text.secondary">Mã vạch: {product.barcode}</Typography>}</TableCell>
                    <TableCell>{categories.find((c) => c.id === product.categoryId)?.name || product.categoryId}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(product.price)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>{product.costPrice ? formatCurrency(product.costPrice) : '---'}</TableCell>
                    <TableCell><Chip label={product.isActive ? 'Đang bán' : 'Ngừng bán'} size="small" sx={{ bgcolor: product.isActive ? '#dcfce7' : '#fee2e2', color: product.isActive ? '#166534' : '#b91c1c', fontWeight: 600, border: 'none' }} /></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Box title="Biến thể" onClick={() => handleOpenVariant(product)} sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }}><ListAltIcon sx={{ fontSize: 16 }} /></Box>
                        {isSuperAdmin() && (
                          <>
                            <Box title="Sửa" onClick={() => handleOpenDialog(product)} sx={{ bgcolor: '#f39c12', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }}><EditIcon sx={{ fontSize: 16 }} /></Box>
                            <Box title="Xóa" onClick={() => handleDelete(product.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }}><DeleteIcon sx={{ fontSize: 16 }} /></Box>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}><Pagination count={1} size="small" shape="rounded" color="primary" /><Typography variant="body2" color="text.secondary">Hiển thị {filteredProducts.length} sản phẩm</Typography></Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG THÊM / SỬA SẢN PHẨM ================= */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>{editingProduct ? 'CHỈNH SỬA SẢN PHẨM' : 'THÊM SẢN PHẨM MỚI'}</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" fullWidth label="Mã Sản Phẩm (*)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} error={!!formErrors.code} helperText={formErrors.code} />
              <TextField size="small" fullWidth label="Mã Vạch (Barcode)" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
            </Box>
            <TextField size="small" fullWidth label="Tên Sản Phẩm (*)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={!!formErrors.name} helperText={formErrors.name} />
            <FormControl size="small" fullWidth error={!!formErrors.categoryId}>
              <InputLabel>Danh Mục (*)</InputLabel>
              <Select label="Danh Mục (*)" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" fullWidth label="Giá Bán (VNĐ) (*)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} error={!!formErrors.price} helperText={formErrors.price} />
              <TextField size="small" fullWidth label="Giá Nhập (VNĐ)" type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} />
            </Box>
            <TextField size="small" fullWidth label="Mô Tả Sản Phẩm" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            
            {/* KHU VỰC UPLOAD ẢNH */}
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#334155' }}>HÌNH ẢNH SẢN PHẨM</Typography>
              
              {/* Ảnh Chính */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Ảnh đại diện (Ảnh chính)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Button component="label" variant="outlined" startIcon={<PhotoCameraIcon />} sx={{ textTransform: 'none', height: 'fit-content' }}>
                    Chọn ảnh chính
                    <input hidden type="file" accept="image/*" onChange={handleMainImageChange} />
                  </Button>
                  {mainImagePreview && (
                    <Box sx={{ position: 'relative' }}>
                      <Box component="img" src={mainImagePreview} sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, border: '2px solid #3b82f6' }} />
                      <Chip label="Main" size="small" color="primary" sx={{ position: 'absolute', top: -10, right: -10, height: 20, fontSize: 10 }} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Ảnh Phụ */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Ảnh phụ (Nhiều ảnh)</Typography>
                <Button component="label" variant="outlined" size="small" sx={{ mb: 2, textTransform: 'none' }}>
                  Thêm ảnh phụ
                  <input hidden type="file" accept="image/*" multiple onChange={handleSubImagesChange} />
                </Button>
                
                {subImagePreviews.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {subImagePreviews.map((preview, index) => (
                      <Badge key={index} badgeContent={<CancelIcon sx={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => removeSubImage(index)} />}>
                        <Box component="img" src={preview} sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid #cbd5e1' }} />
                      </Badge>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy Bỏ</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#00a65a', textTransform: 'none', boxShadow: 'none' }}>
             {loading ? <CircularProgress size={24} color="inherit" /> : 'Lưu Sản Phẩm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= DIALOG QUẢN LÝ BIẾN THỂ ================= */}
      <Dialog open={openVariantDialog} onClose={() => setOpenVariantDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>BIẾN THỂ: {variantProduct?.name}</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 2fr 1fr', gap: 1, mb: 3 }}>
            <TextField size="small" label="Tên (Màu Đỏ - Size M)" value={variantForm.tenBienThe} onChange={(e) => setVariantForm((p) => ({ ...p, tenBienThe: e.target.value }))} />
            <TextField size="small" label="SKU *" value={variantForm.maSku} onChange={(e) => setVariantForm((p) => ({ ...p, maSku: e.target.value }))} />
            <TextField size="small" label="Giá bán" type="number" value={variantForm.giaBan} onChange={(e) => setVariantForm((p) => ({ ...p, giaBan: e.target.value }))} />
            <TextField size="small" label="Giá nhập" type="number" value={variantForm.giaNhap} onChange={(e) => setVariantForm((p) => ({ ...p, giaNhap: e.target.value }))} />
            <TextField size="small" label="Mã vạch" value={variantForm.maVach} onChange={(e) => setVariantForm((p) => ({ ...p, maVach: e.target.value }))} />
            <Button variant="contained" onClick={createVariant} disabled={variantLoading} sx={{ bgcolor: '#00a65a', textTransform: 'none' }}>Thêm</Button>
          </Box>
          <TableContainer>
            <Table size="small"><TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow><TableCell>SKU</TableCell><TableCell>Tên</TableCell><TableCell>Mã vạch</TableCell><TableCell align="center">Xóa</TableCell></TableRow></TableHead>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.bienTheId}><TableCell>{v.maSku}</TableCell><TableCell>{v.tenBienThe}</TableCell><TableCell>{v.maVach}</TableCell>
                  <TableCell align="center"><DeleteIcon sx={{ color: '#dd4b39', cursor: 'pointer', fontSize: 18 }} onClick={() => deleteVariant(v.bienTheId)} /></TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
};