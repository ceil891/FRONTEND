import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select, Chip, CircularProgress, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon
} from '@mui/icons-material';
import { Product } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import {
  productAPI, categoryAPI, uploadAPI, BackendSanPham, BackendCategory, SaveSanPhamRequest
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
      const [prodRes, catRes] = await Promise.all([
        productAPI.getAll(),
        categoryAPI.getAll()
      ]);
      
      // Console log để kiểm tra
      console.log("RAW Sản phẩm:", prodRes.data); 

      // ÉP KIỂU LẤY ĐÚNG MẢNG TỪ SPRING BOOT
      let listSP: any[] = [];
      const rawProd = prodRes.data;
      if (Array.isArray(rawProd)) {
          listSP = rawProd;
      } else if (rawProd && typeof rawProd === 'object') {
          // Nếu Backend bọc trong { data: [...] } hoặc { content: [...] }
          listSP = (rawProd as any).data || (rawProd as any).content || [];
      }

      console.log("Mảng Sản Phẩm Lấy Được:", listSP);

      // ÉP KIỂU DANH MỤC
      let listDM: any[] = [];
      const rawCat = catRes.data;
      if (Array.isArray(rawCat)) {
          listDM = rawCat;
      } else if (rawCat && typeof rawCat === 'object') {
          listDM = (rawCat as any).data || (rawCat as any).content || [];
      }

      setProducts(listSP.map(mapBackendToProduct));
      setCategories(listDM);

    } catch (err: any) {
      console.error("LỖI LOAD DỮ LIỆU:", err);
      showToast('Không tải được dữ liệu', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { void loadData(); }, []);

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

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}> {/* Nền xám nhạt cho toàn trang */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Quản lý sản phẩm</Typography>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
          Thêm sản phẩm mới
        </Button>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth size="small" placeholder="Nhập mã SKU hoặc tên sản phẩm để tìm kiếm..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1300 }}> {/* TĂNG ĐỘ RỘNG BẢNG ĐỂ THOÁNG HƠN */}
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell width="80px" align="center" sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Ảnh</TableCell>
                <TableCell width="120px" sx={{ fontWeight: 600, color: '#475569' }}>Mã SKU</TableCell>
                <TableCell width="280px" sx={{ fontWeight: 600, color: '#475569' }}>Tên sản phẩm</TableCell>
                <TableCell width="140px" sx={{ fontWeight: 600, color: '#475569' }}>Danh mục</TableCell>
                <TableCell width="140px" align="right" sx={{ fontWeight: 600, color: '#475569' }}>Giá bán</TableCell>
                <TableCell width="140px" align="right" sx={{ fontWeight: 600, color: '#475569' }}>Giá nhập</TableCell> 
                <TableCell width="100px" align="center" sx={{ fontWeight: 600, color: '#475569' }}>Đơn vị</TableCell>
                <TableCell width="180px" sx={{ fontWeight: 600, color: '#475569' }}>Mô tả</TableCell>
                <TableCell width="120px" align="center" sx={{ fontWeight: 600, color: '#475569' }}>Trạng thái</TableCell>
                <TableCell width="110px" align="center" sx={{ fontWeight: 600, color: '#475569' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => {
                const pExtra = p as any;
                return (
                <TableRow key={p.id} hover sx={{ '& > td': { py: 1.5, borderBottom: '1px solid #f1f5f9' } }}>
                  
                  {/* Ảnh */}
                  <TableCell align="center">
                    <Box component="img" src={pExtra.hinhAnhUrls?.[0] || 'https://via.placeholder.com/56?text=No+Image'} 
                         sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', border: '1px solid #e2e8f0', bgcolor: '#fff' }} />
                  </TableCell>
                  
                  {/* Mã SKU */}
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.9rem', color: '#334155', bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                      {p.code}
                    </Typography>
                  </TableCell>
                  
                  {/* Tên SP */}
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a', mb: 0.5 }}>{p.name}</Typography>
                    {pExtra.thuongHieu && <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Thương hiệu: {pExtra.thuongHieu}</Typography>}
                  </TableCell>
                  
                  {/* Danh Mục */}
                  <TableCell>
                    {p.categoryId ? <Chip label={categoryMap[p.categoryId] || '---'} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 500, borderRadius: 1 }} /> : <Typography color="text.secondary">—</Typography>}
                  </TableCell>
                  
                  {/* Giá Bán */}
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#dc2626' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                    </Typography>
                  </TableCell>
                  
                  {/* Giá Nhập */}
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', color: '#16a34a' }}>
                      {p.costPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.costPrice) : '—'}
                    </Typography>
                  </TableCell>

                  {/* Đơn vị */}
                  <TableCell align="center">
                    <Typography sx={{ fontSize: '0.9rem', color: '#475569' }}>{UNIT_MAP[pExtra.donViId] || 'Cái'}</Typography>
                  </TableCell>

                  {/* Mô tả */}
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Tooltip title={p.description || ''} arrow placement="top">
                      <Typography sx={{ fontSize: '0.85rem', color: p.description ? '#475569' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.description || 'Chưa có mô tả'}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {/* Trạng Thái */}
                  <TableCell align="center">
                    <Chip 
                      label={p.isActive ? 'Đang bán' : 'Ngừng bán'} 
                      size="small" 
                      sx={{ 
                        bgcolor: p.isActive ? '#dcfce7' : '#f1f5f9', 
                        color: p.isActive ? '#16a34a' : '#64748b',
                        fontWeight: 600, border: 'none'
                      }}
                    />
                  </TableCell>
                  
                  {/* Thao Tác */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Sửa sản phẩm">
                        <IconButton size="small" onClick={() => handleOpenDialog(p)} sx={{ color: '#0ea5e9', bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa sản phẩm">
                        <IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>

                </TableRow>
              )})}
              
              {/* Hiển thị khi không có dữ liệu */}
              {products.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1" color="text.secondary">Chưa có sản phẩm nào. Hãy thêm mới!</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* DIALOG THÊM / SỬA GIỮ NGUYÊN NHƯ CŨ (Chỉ chỉnh chút style cho đồng bộ) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editingProduct ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          {/* ... NỘI DUNG DIALOG GIỮ NGUYÊN CODE Ở BƯỚC TRƯỚC ... */}
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
        <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={uploading} sx={{ textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
            Lưu Thay Đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};