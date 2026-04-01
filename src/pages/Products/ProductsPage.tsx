import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, FormControl, InputLabel, Select, Chip, Grid,
  InputAdornment, CircularProgress, Stack, Avatar, Divider, Tooltip,
  FormControlLabel, Checkbox
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, PhotoCamera as PhotoIcon, Save as SaveIcon,
  AddCircleOutline as AddVariantIcon, RemoveCircleOutline as RemoveIcon,
  InfoOutlined as InfoIcon, Close as CloseIcon, Print as PrintIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { categoryAPI, productAPI, unitAPI, colorAPI, sizeAPI } from '../../api/client';

export const ProductsPage: React.FC = () => {
  // --- STATES QUẢN LÝ POPUP ---
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // --- STATES DỮ LIỆU ---
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [printAfterSave, setPrintAfterSave] = useState(false);

  const [formData, setFormData] = useState({
    code: '', name: '', categoryId: '', unitId: '',
    price: 0, costPrice: 0, barcode: '', description: '',
    isActive: true, variants: [] as any[]
  });

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val || 0) + 'đ';

  const extractData = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    
    const data = response.data;
    if (!data) return [];
    
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.content)) return data.content;
    if (data.data && Array.isArray(data.data.content)) return data.data.content;
    
    return [];
  };

  const getProductImage = (p: any) => {
    if (!p) return null;
    const urls = p.imageUrls || p.hinhAnhUrls || p.images;
    if (Array.isArray(urls) && urls.length > 0) return urls[0];
    if (typeof urls === 'string') {
      if (urls.startsWith('[')) {
        try { return JSON.parse(urls)[0]; } catch { return null; }
      }
      return urls; 
    }
    return p.imageUrl || p.hinhAnhUrl || p.image || null;
  };

  // 🟢 THÊM HÀM QUÉT SÂU TÌM ID CỦA DANH MỤC VÀ ĐƠN VỊ TỪ BACKEND
  const getCategoryId = (p: any) => p?.categoryId ?? p?.danhMucId ?? p?.category?.id ?? p?.danhMuc?.id ?? '';
  const getUnitId = (p: any) => p?.unitId ?? p?.donViId ?? p?.unit?.id ?? p?.donVi?.id ?? '';

  const getCategoryName = (catId: any) => {
    if (!catId) return 'N/A';
    const cat = categories.find(c => String(c.id ?? c.danhMucId) === String(catId));
    return cat ? (cat.name ?? cat.tenDanhMuc) : 'N/A';
  };

  const getUnitName = (uId: any) => {
    if (!uId) return 'N/A';
    const u = units.find(un => String(un.id ?? un.donViId) === String(uId));
    return u ? (u.name ?? u.tenDonVi) : 'N/A';
  };

  const normalizeVariant = (v: any) => {
    const cId = v.colorId ?? v.mauSacId ?? v.color?.id ?? v.color?.mauSacId ?? '';
    const sId = v.sizeId ?? v.kichThuocId ?? v.size?.id ?? v.size?.kichThuocId ?? '';
    return {
      ...v,
      colorId: cId !== '' && cId !== null ? String(cId) : '',
      sizeId: sId !== '' && sId !== null ? String(sId) : '',
      colorName: v.colorName ?? v.tenMau ?? v.color?.name ?? v.color?.tenMau ?? '',
      sizeName: v.sizeName ?? v.tenKichThuoc ?? v.size?.name ?? v.size?.tenKichThuoc ?? ''
    };
  };

  // --- API CALLS ---
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, uRes, clRes, szRes] = await Promise.all([
        productAPI.getAll().catch(e => null), 
        categoryAPI.getAll().catch(e => null),
        unitAPI.getAll().catch(e => null),
        colorAPI.getAll().catch(e => null),
        sizeAPI.getAll().catch(e => null)
      ]);

      setProducts(extractData(pRes));
      setCategories(extractData(cRes));
      setUnits(extractData(uRes));
      setColors(extractData(clRes));
      setSizes(extractData(szRes));
    } catch (error) { 
      showToast('Lỗi tải dữ liệu. Vui lòng F5 lại trang.', 'error'); 
    } finally { setLoading(false); }
  };

  useEffect(() => { loadInitialData(); }, []);

  // --- HANDLERS ---
  const handleOpenDetail = (p: any) => {
    const productWithNormalizedVariants = {
      ...p,
      variants: p.variants ? p.variants.map(normalizeVariant) : []
    };
    setSelectedProduct(productWithNormalizedVariants);
    setViewDetailOpen(true);
  };

  const handleOpenDialog = (p?: any) => {
    if (p) {
      setEditingId(p.id || p.sanPhamId);
      setFormData({
        code: p.code || p.maSku || '', 
        name: p.name || p.tenSanPham || '',
        // 🟢 FIX LỖI KHÔNG HIỆN DANH MỤC/ĐƠN VỊ KHI SỬA SẢN PHẨM
        categoryId: getCategoryId(p) !== '' ? String(getCategoryId(p)) : '', 
        unitId: getUnitId(p) !== '' ? String(getUnitId(p)) : '',
        price: p.baseRetailPrice || p.giaBan || p.price || 0, 
        costPrice: p.baseCostPrice || p.giaNhap || p.costPrice || 0,
        barcode: p.barcode || p.maVach || '', 
        description: p.description || p.moTa || '',
        isActive: p.status === 'ACTIVE' || p.hoatDong !== false, 
        variants: p.variants ? p.variants.map(normalizeVariant) : []
      });
      setImagePreview(getProductImage(p));
    } else {
      setEditingId(null);
      setFormData({
        code: 'SP' + Date.now().toString().slice(-5), name: '', categoryId: '', unitId: '',
        price: 0, costPrice: 0, barcode: '', description: '', isActive: true, variants: []
      });
      setImagePreview(null);
    }
    setImageFile(null); 
    setPrintAfterSave(false);
    setOpenDialog(true);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, {
        sku: `${formData.code || 'SP'}-V${formData.variants.length + 1}`,
        colorId: '', sizeId: '', costPrice: formData.costPrice, sellPrice: formData.price, quantity: 0
      }]
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    setFormData({ ...formData, variants: formData.variants.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.categoryId || !formData.unitId) {
      return showToast('Vui lòng điền các mục đánh dấu *', 'warning');
    }
    
    try {
      setLoading(true);
      let hinhAnhUrls: string[] = [];
      
      if (imageFile) {
        const form = new FormData();
        form.append('file', imageFile);
        form.append('folder', 'products'); 
        
        const token = localStorage.getItem('token');
        const uploadRes = await fetch('http://localhost:8080/api/images/upload', { 
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form 
        });
        
        if (uploadRes.ok) {
          const rawText = await uploadRes.text(); 
          const imageUrl = rawText.replace(/["']/g, '');
          if (imageUrl) hinhAnhUrls = [imageUrl];
        } else { showToast('Lỗi upload ảnh', 'error'); }
      } else if (imagePreview) {
        hinhAnhUrls = [imagePreview];
      }

      const payload = {
        code: formData.code.toUpperCase(), name: formData.name,
        categoryId: Number(formData.categoryId), unitId: Number(formData.unitId),
        baseRetailPrice: Number(formData.price), baseCostPrice: formData.costPrice ? Number(formData.costPrice) : 0,
        baseWholesalePrice: 0, barcode: formData.barcode || undefined,
        description: formData.description || undefined,
        status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
        imageUrls: hinhAnhUrls.length > 0 ? hinhAnhUrls : undefined, 
        variants: formData.variants.map(v => ({
          id: v.id,
          sku: v.sku, colorId: v.colorId ? Number(v.colorId) : null, sizeId: v.sizeId ? Number(v.sizeId) : null,
          costPrice: Number(v.costPrice), sellPrice: Number(v.sellPrice), quantity: Number(v.quantity), status: 'ACTIVE'
        }))
      };

      if (editingId) {
        await productAPI.update(editingId, payload);
        showToast('Cập nhật sản phẩm thành công', 'success');
      } else {
        await productAPI.create(payload);
        showToast('Thêm sản phẩm thành công', 'success');
      }

      if (printAfterSave) {
        showToast('Đang tạo lệnh in tem/hóa đơn...', 'info');
      }
      
      setOpenDialog(false); loadInitialData();
    } catch (error: any) { 
      showToast('Lỗi khi lưu. Kiểm tra lại thông tin', 'error'); 
    } finally { setLoading(false); }
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => {
      const nameStr = (p.name ?? p.tenSanPham ?? '').toString().toLowerCase();
      const codeStr = (p.code ?? p.maSku ?? '').toString().toLowerCase();
      const searchStr = searchQuery.toLowerCase();
      return nameStr.includes(searchStr) || codeStr.includes(searchStr);
    })
  , [products, searchQuery]);

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={800} color="#1e293b">Quản Lý Sản Phẩm</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadInitialData} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none', px: 2, py: 1 }}>
            Làm mới
          </Button>
          {isSuperAdmin() && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, boxShadow: '0 4px 14px 0 rgb(0 118 255 / 39%)' }}>
              Tạo Sản Phẩm Mới
            </Button>
          )}
        </Stack>
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <TextField fullWidth size="small" placeholder="Tìm kiếm theo mã SKU, tên sản phẩm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }} />
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Ảnh</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Sản Phẩm</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Danh Mục</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>Phân Loại</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Giá Bán</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>Trạng Thái</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && products.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredProducts.map((p) => (
              <TableRow key={p.id || p.sanPhamId} hover>
                <TableCell>
                  {getProductImage(p) ? (
                    <Avatar variant="rounded" src={getProductImage(p)} sx={{ width: 48, height: 48, border: '1px solid #e2e8f0', bgcolor: '#fff' }} />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#e2e8f0', color: '#94a3b8' }}><PhotoIcon /></Avatar>
                  )}
                </TableCell>
                
                <TableCell sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => handleOpenDetail(p)}>
                  <Typography variant="body2" fontWeight={700} color="primary.main">{p.name || p.tenSanPham}</Typography>
                  <Typography variant="caption" color="text.secondary">SKU: {p.code || p.maSku}</Typography>
                </TableCell>

                {/* 🟢 CẬP NHẬT GỌI TÊN DANH MỤC TRONG BẢNG */}
                <TableCell><Chip label={getCategoryName(getCategoryId(p))} size="small" variant="outlined" sx={{ borderRadius: 1 }} /></TableCell>
                <TableCell align="center"><Chip label={`${p.variants?.length || 0} thuộc tính`} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, borderRadius: 1 }} /></TableCell>
                <TableCell align="right"><Typography fontWeight={700} color="#dc2626">{formatCurrency(p.baseRetailPrice || p.giaBan || p.price)}</Typography></TableCell>
                <TableCell align="center"><Chip label={p.status === 'ACTIVE' || p.hoatDong !== false ? 'Đang bán' : 'Ngừng'} size="small" sx={{ bgcolor: (p.status === 'ACTIVE' || p.hoatDong !== false) ? '#dcfce7' : '#f1f5f9', color: (p.status === 'ACTIVE' || p.hoatDong !== false) ? '#166534' : '#64748b', fontWeight: 600, borderRadius: 1 }} /></TableCell>
                <TableCell align="right">
                  {isSuperAdmin() && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(p)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={async () => {
                        if (window.confirm('Xóa sản phẩm này?')) { await productAPI.delete(p.id || p.sanPhamId); loadInitialData(); }
                      }}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🟢 DIALOG XEM CHI TIẾT SẢN PHẨM 🟢 */}
      <Dialog open={viewDetailOpen} onClose={() => setViewDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
          THÔNG TIN CHI TIẾT
          <IconButton onClick={() => setViewDetailOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {selectedProduct && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, textAlign: 'center', p: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <Avatar variant="rounded" src={getProductImage(selectedProduct)} sx={{ width: '100%', height: 240, borderRadius: 2, mb: 2, bgcolor: '#e2e8f0' }}>
                    {!getProductImage(selectedProduct) && <PhotoIcon sx={{ fontSize: 60, color: '#94a3b8' }} />}
                  </Avatar>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">{selectedProduct.name || selectedProduct.tenSanPham}</Typography>
                  <Typography color="text.secondary" gutterBottom>SKU: {selectedProduct.code || selectedProduct.maSku}</Typography>
                  <Chip label={selectedProduct.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'} color={selectedProduct.status === 'ACTIVE' ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: 3, p: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Mô tả chi tiết:</Typography>
                    <Typography variant="body2" sx={{ minHeight: 40 }}>{selectedProduct.description || selectedProduct.moTa || 'Chưa có mô tả cho sản phẩm này.'}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Danh mục:</Typography>
                        <Typography variant="body2" fontWeight={600}>{getCategoryName(getCategoryId(selectedProduct))}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Đơn vị tính:</Typography>
                        <Typography variant="body2" fontWeight={600}>{getUnitName(getUnitId(selectedProduct))}</Typography>
                      </Grid>
                    </Grid>
                  </Card>

                  <Typography variant="subtitle1" fontWeight={700} color="#0f172a">Danh sách Phân loại & Tồn kho</Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Mã phân loại (SKU)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Giá bán</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Tồn kho</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(!selectedProduct.variants || selectedProduct.variants.length === 0) ? (
                          <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sản phẩm này chưa có biến thể nào.</TableCell></TableRow>
                        ) : selectedProduct.variants.map((v: any, idx: number) => {
                          let cLabel = v.colorName;
                          if (!cLabel) {
                            const cObj = colors.find((x:any) => String(x.id ?? x.mauSacId ?? x) === String(v.colorId));
                            cLabel = cObj ? (cObj.name ?? cObj.tenMau ?? String(cObj)) : '';
                          }
                          let sLabel = v.sizeName;
                          if (!sLabel) {
                            const sObj = sizes.find((x:any) => String(x.id ?? x.kichThuocId ?? x) === String(v.sizeId));
                            sLabel = sObj ? (sObj.name ?? sObj.tenKichThuoc ?? String(sObj)) : '';
                          }
                          const attributesStr = [cLabel, sLabel].filter(Boolean).join(' - ') || 'Mặc định';

                          return (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{v.sku}</Typography>
                                <Typography variant="caption" color="text.secondary">{attributesStr}</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 700 }}>{formatCurrency(v.sellPrice || selectedProduct.baseRetailPrice)}</TableCell>
                              <TableCell align="center">
                                <Chip label={v.quantity || 0} size="small" color={(v.quantity || 0) < 10 ? 'error' : 'primary'} variant="outlined" sx={{ fontWeight: 800, minWidth: 40 }} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setViewDetailOpen(false)} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>Đóng</Button>
          {isSuperAdmin() && (
            <Button onClick={() => { setViewDetailOpen(false); handleOpenDialog(selectedProduct); }} variant="contained" startIcon={<EditIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>
              Sửa Sản Phẩm
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 🟢 DIALOG THÊM / SỬA SẢN PHẨM 🟢 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3, bgcolor: '#f4f6f8' } }}>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', py: 2 }}>
          {editingId ? 'CẬP NHẬT SẢN PHẨM' : 'THÊM SẢN PHẨM MỚI'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a" mb={2}>1. Thông tin cơ bản</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, height: '100%', minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', bgcolor: '#f8fafc' }}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <PhotoIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                          <Typography variant="caption" color="text.secondary">Thêm ảnh (Max 5MB)</Typography>
                        </>
                      )}
                      <Button component="label" size="small" variant="contained" sx={{ position: 'absolute', bottom: 12, borderRadius: '8px', textTransform: 'none' }}>
                        Chọn Ảnh
                        <input hidden type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                        }} />
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={9}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}><TextField fullWidth label="Tên Sản Phẩm *" size="small" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></Grid>
                      <Grid item xs={6}><TextField fullWidth label="Mã SKU *" size="small" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} /></Grid>
                      <Grid item xs={6}><TextField fullWidth label="Mã Vạch (Barcode)" size="small" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} /></Grid>
                      
                      <Grid item xs={6}>
                        {/* 🟢 FIX LỖI THẺ SELECT CHỈ ĐỊNH DISPLAYEMPTY VÀ THÊM LỰA CHỌN MẶC ĐỊNH */}
                        <FormControl fullWidth size="small">
                          <InputLabel id="category-label">Danh mục *</InputLabel>
                          <Select labelId="category-label" label="Danh mục *" displayEmpty value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                            <MenuItem value="" disabled><em>Chọn danh mục</em></MenuItem>
                            {categories.map((c:any) => <MenuItem key={c.id ?? c.danhMucId} value={String(c.id ?? c.danhMucId)}>{c.name ?? c.tenDanhMuc}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="unit-label">Đơn vị *</InputLabel>
                          <Select labelId="unit-label" label="Đơn vị *" displayEmpty value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}>
                            <MenuItem value="" disabled><em>Chọn đơn vị</em></MenuItem>
                            {units.map((u:any) => <MenuItem key={u.id ?? u.donViId} value={String(u.id ?? u.donViId)}>{u.name ?? u.tenDonVi}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>

                    </Grid>
                  </Grid>
                  <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Mô tả chi tiết" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* KHỐI 2: GIÁ CƠ BẢN */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Typography variant="subtitle1" fontWeight={700} color="#0f172a">2. Giá mặc định</Typography>
                  <Tooltip title="Giá này sẽ được áp dụng tự động cho biến thể mới thêm"><InfoIcon fontSize="small" color="disabled" /></Tooltip>
                </Stack>
                <Grid container spacing={3}>
                  <Grid item xs={6}><TextField fullWidth label="Giá vốn (Giá nhập) *" size="small" type="number" inputProps={{ min: 0 }} value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Math.max(0, Number(e.target.value))})} InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Giá bán lẻ *" size="small" type="number" inputProps={{ min: 0 }} value={formData.price} onChange={e => setFormData({...formData, price: Math.max(0, Number(e.target.value))})} InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }} /></Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* KHỐI 3: PHÂN LOẠI HÀNG (VARIANTS) */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight={700} color="#0f172a">3. Phân loại hàng (Màu sắc, Kích thước)</Typography>
                  <Button variant="outlined" size="small" startIcon={<AddVariantIcon />} onClick={addVariant} sx={{ borderRadius: 2, textTransform: 'none' }}>Thêm phân loại</Button>
                </Stack>
                
                <TableContainer component={Box} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#475569', fontWeight: 600 }}>SKU</TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 600 }}>Màu sắc</TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 600 }}>Kích cỡ</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600 }}>Giá nhập (đ)</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600 }}>Giá bán (đ)</TableCell>
                        <TableCell align="center" sx={{ color: '#475569', fontWeight: 600 }}>Tồn kho</TableCell>
                        <TableCell align="center"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.variants.map((v, i) => (
                        <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ width: 140 }}><TextField size="small" variant="standard" InputProps={{ disableUnderline: true }} value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 1 }} /></TableCell>
                          
                          <TableCell sx={{ width: 130 }}>
                            <Select size="small" variant="standard" disableUnderline fullWidth displayEmpty
                                value={v.colorId !== null && v.colorId !== undefined && v.colorId !== '' ? String(v.colorId) : ''} 
                                onChange={e => updateVariant(i, 'colorId', e.target.value)} 
                                sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 1 }}>
                              <MenuItem value="" disabled><em>Trống</em></MenuItem>
                              {colors.map((c:any, idx: number) => {
                                const cId = typeof c === 'object' ? String(c.id ?? c.mauSacId ?? c.code ?? idx) : String(c);
                                const cName = typeof c === 'object' ? (c.name ?? c.tenMau ?? c.description ?? `Màu ${cId}`) : String(c);
                                return <MenuItem key={`color-${cId}-${idx}`} value={cId}>{cName}</MenuItem>;
                              })}
                            </Select>
                          </TableCell>
                          
                          <TableCell sx={{ width: 130 }}>
                            <Select size="small" variant="standard" disableUnderline fullWidth displayEmpty
                                value={v.sizeId !== null && v.sizeId !== undefined && v.sizeId !== '' ? String(v.sizeId) : ''} 
                                onChange={e => updateVariant(i, 'sizeId', e.target.value)} 
                                sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 1 }}>
                              <MenuItem value="" disabled><em>Trống</em></MenuItem>
                              {sizes.map((s:any, idx: number) => {
                                const sId = typeof s === 'object' ? String(s.id ?? s.kichThuocId ?? s.code ?? idx) : String(s);
                                const sName = typeof s === 'object' ? (s.name ?? s.tenKichThuoc ?? s.description ?? `Size ${sId}`) : String(s);
                                return <MenuItem key={`size-${sId}-${idx}`} value={sId}>{sName}</MenuItem>;
                              })}
                            </Select>
                          </TableCell>

                          <TableCell align="right"><TextField type="number" size="small" variant="standard" inputProps={{ min: 0 }} InputProps={{ disableUnderline: true }} value={v.costPrice} onChange={e => updateVariant(i, 'costPrice', Math.max(0, Number(e.target.value)))} sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 1, width: 100, input: { textAlign: 'right' } }} /></TableCell>
                          <TableCell align="right"><TextField type="number" size="small" variant="standard" inputProps={{ min: 0 }} InputProps={{ disableUnderline: true }} value={v.sellPrice} onChange={e => updateVariant(i, 'sellPrice', Math.max(0, Number(e.target.value)))} sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 1, width: 100, input: { textAlign: 'right' } }} /></TableCell>
                          <TableCell align="center"><TextField type="number" size="small" variant="standard" inputProps={{ min: 0 }} InputProps={{ disableUnderline: true }} value={v.quantity} onChange={e => updateVariant(i, 'quantity', Math.max(0, Number(e.target.value)))} sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 1, width: 60, input: { textAlign: 'center' } }} /></TableCell>
                          <TableCell align="center"><IconButton color="error" size="small" onClick={() => removeVariant(i)}><RemoveIcon fontSize="small" /></IconButton></TableCell>
                        </TableRow>
                      ))}
                      {formData.variants.length === 0 && (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>Chưa có phân loại nào được thêm.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#fff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
          <FormControlLabel
            control={<Checkbox checked={printAfterSave} onChange={(e) => setPrintAfterSave(e.target.checked)} color="primary" />}
            label={<Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PrintIcon fontSize="small"/> In tem/hóa đơn sau khi lưu</Typography>}
          />
          <Box>
            <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>Hủy bỏ</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none', px: 4, fontWeight: 600, boxShadow: '0 4px 14px 0 rgb(0 118 255 / 39%)' }}>
              {loading ? 'Đang xử lý...' : (editingId ? 'Lưu Thay Đổi' : 'Lưu Sản Phẩm & Phân Loại')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};