import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select, Chip, CircularProgress, Tooltip, Checkbox, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  Print as PrintIcon, FileUpload as ImportIcon, FileDownload as ExcelIcon, 
  FilterAlt as FilterIcon,
  Widgets as VariantIcon
} from '@mui/icons-material';
import { Product } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import {
  productAPI, categoryAPI, uploadAPI, BackendCategory, SaveSanPhamRequest,
  variantAPI, type BackendBienTheSanPham
} from '../../api/client';

const UNIT_OPTIONS = [
  { id: 1, label: "Cái" }, { id: 2, label: "Lon" },
  { id: 3, label: "Chai" }, { id: 4, label: "Kg" }, { id: 5, label: "Thùng" },
];

const UNIT_MAP: Record<number, string> = {
  1: "Cái", 2: "Lon", 3: "Chai", 4: "Kg", 5: "Thùng"
};

export const ProductsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', categoryId: '' as string | number,
    price: '', costPrice: '', unitId: 1, barcode: '', 
    thuongHieu: '', hinhAnhUrl: '', isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<BackendCategory[]>([]);

  // ====== BIẾN THỂ UI ======
  const [openVariantDialog, setOpenVariantDialog] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<BackendBienTheSanPham[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantForm, setVariantForm] = useState({
    tenBienThe: '',
    maSku: '',
    giaBan: '',
    giaNhap: '',
    maVach: '',
    hoatDong: true,
  });

  // ================= LOGIC API (GIỮ NGUYÊN 100%) =================
  const mapBackendToProduct = (sp: any): Product => {
    const dm = sp.danhMuc || null;
    const catId = dm ? (dm.danhMucId || dm.id) : null;
    return {
      id: String(sp.sanPhamId), code: sp.maSku, name: sp.tenSanPham, description: sp.moTa || undefined,
      categoryId: catId, price: Number(sp.giaBan ?? 0), costPrice: sp.giaNhap != null ? Number(sp.giaNhap) : undefined,
      unit: 'Cái', barcode: sp.maVach || undefined, isActive: !!sp.hoatDong,
      createdAt: new Date(), updatedAt: new Date(),
      ...({ donViId: sp.donViId || 1, thuongHieu: sp.thuongHieu || '', hinhAnhUrls: sp.hinhAnhUrls || [] }) 
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await uploadAPI(file);
      const imageUrl = res.data.secure_url || res.data.data?.secure_url;
      if (imageUrl) {
        setFormData(prev => ({ ...prev, hinhAnhUrl: imageUrl }));
        showToast('Tải ảnh thành công', 'success');
      }
    } catch (err: any) {
      showToast('Lỗi upload: ' + (err.response?.data?.message || err.message), 'error');
    } finally { setUploading(false); }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([productAPI.getAll(), categoryAPI.getAll()]);
      
      let listSP: any[] = [];
      const rawProd = prodRes.data;
      if (Array.isArray(rawProd)) listSP = rawProd;
      else if (rawProd && typeof rawProd === 'object') listSP = (rawProd as any).data || (rawProd as any).content || [];

      let listDM: any[] = [];
      const rawCat = catRes.data;
      if (Array.isArray(rawCat)) listDM = rawCat;
      else if (rawCat && typeof rawCat === 'object') listDM = (rawCat as any).data || (rawCat as any).content || [];

      setProducts(listSP.map(mapBackendToProduct));
      setCategories(listDM);
    } catch (err: any) {
      console.error("LỖI LOAD DỮ LIỆU:", err);
      showToast('Không tải được dữ liệu', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadData(); }, []);

  const openVariants = async (p: Product) => {
    try {
      setVariantProduct(p);
      setOpenVariantDialog(true);
      setVariantLoading(true);
      const res = await variantAPI.getByProductId(Number(p.id));
      setVariants(res.data ?? []);
      setVariantForm({
        tenBienThe: '',
        maSku: '',
        giaBan: '',
        giaNhap: '',
        maVach: '',
        hoatDong: true,
      });
    } catch (err: any) {
      showToast('Không tải được biến thể: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setVariantLoading(false);
    }
  };

  const createVariant = async () => {
    if (!variantProduct) return;
    if (!variantForm.maSku.trim()) return showToast('Vui lòng nhập SKU biến thể', 'error');
    try {
      const payload = {
        sanPham: { sanPhamId: Number(variantProduct.id) },
        tenBienThe: variantForm.tenBienThe.trim() || variantProduct.name,
        maSku: variantForm.maSku.trim(),
        giaBan: Number(variantForm.giaBan || 0),
        giaNhap: Number(variantForm.giaNhap || 0),
        maVach: variantForm.maVach.trim() || variantForm.maSku.trim(),
        hoatDong: Boolean(variantForm.hoatDong),
      };
      await variantAPI.create(payload);
      showToast('Tạo biến thể thành công', 'success');
      const res = await variantAPI.getByProductId(Number(variantProduct.id));
      setVariants(res.data ?? []);
      setVariantForm({ tenBienThe: '', maSku: '', giaBan: '', giaNhap: '', maVach: '', hoatDong: true });
    } catch (err: any) {
      showToast('Lỗi tạo biến thể: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const deleteVariant = async (id: number) => {
    if (!variantProduct) return;
    if (!window.confirm('Xóa biến thể này?')) return;
    try {
      await variantAPI.delete(id);
      const res = await variantAPI.getByProductId(Number(variantProduct.id));
      setVariants(res.data ?? []);
      showToast('Đã xóa biến thể', 'success');
    } catch (err: any) {
      showToast('Không thể xóa: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {};
    categories.forEach((c: any) => { 
        const id = c.danhMucId || c.id;
        if (id) map[id] = c.tenDanhMuc || c.name; 
    });
    return map;
  }, [categories]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
        const pExtra = product as any;
        setEditingProduct(product);
        setFormData({
            code: product.code, name: product.name, description: product.description || '',
            categoryId: product.categoryId || '', price: product.price.toString(),
            costPrice: product.costPrice?.toString() || '', unitId: pExtra.donViId || 1,
            barcode: product.barcode || '', thuongHieu: pExtra.thuongHieu || '',
            hinhAnhUrl: pExtra.hinhAnhUrls?.[0] || '', isActive: product.isActive,
        });
    } else {
      setEditingProduct(null);
      setFormData({
        code: '', name: '', description: '', categoryId: '', price: '', costPrice: '', 
        unitId: 1, barcode: '', thuongHieu: '', hinhAnhUrl: '', isActive: true,
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
      try {
        await productAPI.delete(id);
        showToast('Xóa sản phẩm thành công!', 'success');
        await loadData();
      } catch (err: any) {
        showToast('Không thể xóa: ' + (err.response?.data?.message || err.message), 'error');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.categoryId) { showToast("Vui lòng chọn danh mục", "error"); return; }
    try {
      const payload: SaveSanPhamRequest = {
        maSku: String(formData.code).trim(), tenSanPham: String(formData.name).trim(),
        moTa: formData.description || "", danhMucId: Number(formData.categoryId),
        donViId: Number(formData.unitId || 1), giaBan: Number(formData.price || 0),
        giaNhap: Number(formData.costPrice || 0), thuongHieu: String(formData.thuongHieu || "N/A"),
        hoatDong: Boolean(formData.isActive), hinhAnhUrls: formData.hinhAnhUrl ? [formData.hinhAnhUrl] : []
      };

      if (editingProduct) await productAPI.update(editingProduct.id, payload);
      else await productAPI.create(payload);

      showToast('Lưu sản phẩm thành công!', 'success');
      setOpenDialog(false);
      await loadData(); 
    } catch (err: any) {
      showToast('Lỗi lưu: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // ================= GIAO DIỆN CHUẨN RIC =================
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH MỤC HÀNG HÓA
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã SKU/Tên Sản Phẩm..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xóa</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Tem</Button>
            <Button size="small" variant="contained" startIcon={<ImportIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Import</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1300 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 60, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Ảnh</TableCell>
                  
                  {['Mã SKU', 'Tên sản phẩm', 'Danh mục', 'Giá bán', 'Giá nhập', 'Đơn vị', 'Trạng thái'].map((col) => (
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
                     <TableCell colSpan={11} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell>
                   </TableRow>
                ) : filteredProducts.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={11} align="center" sx={{ py: 5, color: 'text.secondary' }}>Không có dữ liệu hàng hóa</TableCell>
                   </TableRow>
                ) : (
                  filteredProducts.map((p, index) => {
                    const pExtra = p as any;
                    return (
                      <TableRow key={p.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                        
                        {/* Cột Thao tác kiểu Nút vuông */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Box onClick={() => handleOpenDialog(p)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                            <Box onClick={() => openVariants(p)} sx={{ bgcolor: '#0073b7', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><VariantIcon sx={{ fontSize: 14 }} /></Box>
                            <Box onClick={() => handleDelete(p.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><DeleteIcon sx={{ fontSize: 14 }} /></Box>
                          </Box>
                        </TableCell>
                        
                        {/* Ảnh */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                          <Box component="img" src={pExtra.hinhAnhUrls?.[0] || 'https://via.placeholder.com/40?text=No+Img'} sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                        </TableCell>

                        {/* Mã SKU */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{p.code}</TableCell>
                        
                        {/* Tên SP & Thương hiệu */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">{p.name}</Typography>
                          {pExtra.thuongHieu && <Typography variant="caption" sx={{ color: '#64748b' }}>{pExtra.thuongHieu}</Typography>}
                        </TableCell>
                        
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0284c7', p: 1.5 }}>
                          {categoryMap[p.categoryId] || '---'}
                        </TableCell>
                        
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', p: 1.5 }}>
                          {new Intl.NumberFormat('vi-VN').format(p.price)}
                        </TableCell>
                        
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>
                          {p.costPrice ? new Intl.NumberFormat('vi-VN').format(p.costPrice) : '---'}
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                          {UNIT_MAP[pExtra.donViId] || 'Cái'}
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                          {p.isActive ? 
                            <Chip label="Đang bán" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                            <Chip label="Ngừng bán" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
               {filteredProducts.length > 0 ? `1 - ${filteredProducts.length} of ${filteredProducts.length} items` : 'No items to display'}
             </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG FORM (GIỮ NGUYÊN HOÀN TOÀN) ================= */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editingProduct ? 'CẬP NHẬT HÀNG HÓA' : 'THÊM MỚI HÀNG HÓA'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Box sx={{ p: 2.5, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#334155' }}>Hình ảnh đại diện</Typography>
                <Button variant="outlined" component="label" startIcon={uploading ? <CircularProgress size={20} /> : <AddIcon />} disabled={uploading} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  {uploading ? 'Đang tải...' : 'Chọn từ máy'}
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
              </Box>
              <Box sx={{ width: 120, height: 120, border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', overflow: 'hidden' }}>
                {formData.hinhAnhUrl ? <img src={formData.hinhAnhUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Product"/> : <Typography variant="caption" color="text.secondary">Trống</Typography>}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small" error={!!formErrors.categoryId}>
                <InputLabel id="category-label">Danh Mục</InputLabel>
                <Select labelId="category-label" label="Danh Mục" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                  {categories.map((cat: any) => (
                    <MenuItem key={cat.id || cat.danhMucId} value={cat.id || cat.danhMucId}>{cat.name || cat.tenDanhMuc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField fullWidth size="small" label="Thương Hiệu" value={formData.thuongHieu} onChange={(e) => setFormData({ ...formData, thuongHieu: e.target.value })} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Mã SKU" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
              <TextField fullWidth size="small" label="Tên Sản Phẩm (*)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Giá Bán (*)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
              <TextField fullWidth size="small" label="Giá Nhập" type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} />
            </Box>

            <Box>
              <TextField 
                fullWidth size="small" label="Mô Tả Sản Phẩm" multiline rows={3} 
                placeholder="Nhập thông tin chi tiết về tính năng, chất liệu..."
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <TextField sx={{ width: '50%' }} size="small" label="Đơn Vị" select SelectProps={{ native: true }} value={formData.unitId} onChange={(e) => setFormData({ ...formData, unitId: Number(e.target.value) })}>
                {UNIT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </TextField>
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
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={uploading} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            Lưu Thay Đổi
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