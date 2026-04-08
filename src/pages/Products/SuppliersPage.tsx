import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  InputAdornment, Paper, List, ListItemButton, ListItemText, Stack, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, SettingsSuggest as ConfigIcon, Close as CloseIcon,
  RemoveCircleOutline as RemoveIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { supplierAPI, productAPI } from '../../api/client';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();

  // --- STATE CHO FORM THÊM/SỬA NHÀ CUNG CẤP ---
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });

  // --- STATE CHO FORM CẤU HÌNH SẢN PHẨM (BÁO GIÁ) ---
  const [openConfig, setOpenConfig] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Tất cả SP trong hệ thống để tìm kiếm
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]); // SP đã cấu hình cho NCC này
  const [productSearch, setProductSearch] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  // 1. TẢI DỮ LIỆU
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierAPI.getAll();
      setSuppliers(res.data?.data || res.data || []);
    } catch (error) {
      showToast('Lỗi tải danh sách nhà cung cấp', 'error');
    } finally { setLoading(false); }
  };

  const loadAllProductsForSearch = async () => {
    try {
      const res = await productAPI.getAll();
      const rawProducts = res.data?.data || res.data || [];
      const variants = rawProducts.flatMap((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          return product.variants.map((v: any) => {
            const color = v.colorName || v.color?.name || '';
            const size = v.sizeName || v.size?.name || '';
            const attributes = [color, size].filter(Boolean).join(' - ');
            return {
              variantId: v.id,
              sku: v.sku,
              variantName: attributes ? `${product.name} (${attributes})` : product.name,
              costPrice: v.costPrice || product.baseCostPrice || 0
            };
          });
        }
        return [];
      });
      setAllProducts(variants);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { 
    loadSuppliers(); 
    loadAllProductsForSearch();
  }, []);

  // 2. TÌM KIẾM NHÀ CUNG CẤP
  const filteredSuppliers = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return suppliers;
    return suppliers.filter(s => 
      (s.name || '').toLowerCase().includes(kw) || 
      (s.phone || '').includes(kw) || 
      (s.code || '').toLowerCase().includes(kw)
    );
  }, [suppliers, searchQuery]);

  // 3. XỬ LÝ LƯU THÊM/SỬA NHÀ CUNG CẤP
  const handleSaveSupplier = async () => {
    if (!formData.name || !formData.phone) return showToast('Tên và SĐT là bắt buộc', 'warning');
    try {
      if (editingId) {
        await supplierAPI.update(editingId, formData);
        showToast('Cập nhật thành công', 'success');
      } else {
        await supplierAPI.create(formData);
        showToast('Thêm mới thành công', 'success');
      }
      setOpenDialog(false); loadSuppliers();
    } catch (error) { showToast('Lỗi khi lưu', 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) return;
    try {
      await supplierAPI.delete(id); showToast('Xóa thành công', 'success'); loadSuppliers();
    } catch (error) { showToast('Lỗi khi xóa', 'error'); }
  };

  const openForm = (sup?: any) => {
    if (sup) {
      setEditingId(sup.id); setFormData({ name: sup.name, contactPerson: sup.contactPerson || '', phone: sup.phone, email: sup.email || '', address: sup.address || '' });
    } else {
      setEditingId(null); setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
    }
    setOpenDialog(true);
  };

  // ==========================================
  // LOGIC CẤU HÌNH SẢN PHẨM CHO NHÀ CUNG CẤP
  // ==========================================
  const handleOpenConfig = async (supplier: any) => {
    setSelectedSupplier(supplier);
    setProductSearch('');
    setOpenConfig(true);
    try {
      // Gọi API lấy danh sách SP đã cấu hình trước đó
      const res = await supplierAPI.getProducts(supplier.id);
      const configuredProducts = res.data?.data || res.data || [];
      // Map lại để đồng bộ format biến
      setSupplierProducts(configuredProducts.map((p: any) => ({
        variantId: p.variantId,
        sku: p.sku,
        variantName: p.variantName,
        importPrice: p.costPrice || 0 // DB trả về costPrice, ta map vào importPrice để chỉnh sửa
      })));
    } catch (error) {
      showToast('Lỗi tải cấu hình sản phẩm', 'error');
    }
  };

  const searchResults = useMemo(() => {
    const kw = productSearch.trim().toLowerCase();
    if (kw.length < 2) return []; // Gõ ít nhất 2 ký tự mới tìm
    return allProducts.filter(p => 
      (p.variantName.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw)) &&
      !supplierProducts.some(sp => sp.variantId === p.variantId) // Ẩn những SP đã thêm rồi
    );
  }, [productSearch, allProducts, supplierProducts]);

  const addProductToConfig = (prod: any) => {
    setSupplierProducts([...supplierProducts, { ...prod, importPrice: prod.costPrice }]);
    setProductSearch(''); // Reset ô tìm kiếm
  };

  const removeProductFromConfig = (variantId: number) => {
    setSupplierProducts(supplierProducts.filter(p => p.variantId !== variantId));
  };

  const updateImportPrice = (variantId: number, newPrice: number) => {
    setSupplierProducts(supplierProducts.map(p => p.variantId === variantId ? { ...p, importPrice: newPrice } : p));
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      const payload = supplierProducts.map(p => ({
        variantId: p.variantId,
        importPrice: Number(p.importPrice)
      }));
      console.log("KIỂM TRA SUPPLIER API:", supplierAPI);
      await supplierAPI.configProducts(selectedSupplier.id, payload);
      showToast('Đã lưu cấu hình báo giá thành công!', 'success');
      setOpenConfig(false);
    } catch (error: any) {
      // 🟢 BẬT THẲNG LỖI TỪ BACKEND LÊN MÀN HÌNH BẰNG ALERT
      const errorData = error.response?.data?.message || error.response?.data || error.message || "Không rõ lỗi";
      alert("⚠️ BACKEND TỪ CHỐI LƯU VỚI LÝ DO:\n\n" + JSON.stringify(errorData, null, 2));
      console.error("CHI TIẾT LỖI API:", error);
      
      showToast('Lỗi khi lưu cấu hình', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>QUẢN LÝ NHÀ CUNG CẤP</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()} sx={{ bgcolor: '#00a65a' }}>
          Thêm Đối Tác
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
            <TextField 
              size="small" placeholder="Tìm theo mã, tên hoặc SĐT..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300, bgcolor: 'white' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Mã NCC</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên Nhà Cung Cấp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Điện Thoại</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Địa Chỉ</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Công Nợ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow> :
                  filteredSuppliers.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{s.code}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name} <br/><Typography variant="caption" color="text.secondary">LH: {s.contactPerson}</Typography></TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell>{s.address || '---'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: (s.debt || 0) > 0 ? '#dc2626' : 'inherit' }}>{formatCurrency(s.debt)}</TableCell>
                      <TableCell align="center"><Chip label={s.status === 'ACTIVE' ? 'Đang giao dịch' : 'Ngừng'} size="small" color={s.status === 'ACTIVE' ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        {/* 🟢 NÚT MỞ DIALOG CẤU HÌNH SẢN PHẨM BÁO GIÁ */}
                        <IconButton size="small" color="secondary" title="Cấu hình báo giá SP" onClick={() => handleOpenConfig(s)}>
                          <ConfigIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary" onClick={() => openForm(s)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* DIALOG THÊM / SỬA NHÀ CUNG CẤP CƠ BẢN */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'CẬP NHẬT NHÀ CUNG CẤP' : 'THÊM MỚI ĐỐI TÁC'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Tên Nhà Cung Cấp (*)" size="small" fullWidth value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Người liên hệ" size="small" fullWidth value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
            <TextField label="Số điện thoại (*)" size="small" fullWidth value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </Box>
          <TextField label="Email" size="small" fullWidth value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <TextField label="Địa chỉ" size="small" fullWidth multiline rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveSupplier} sx={{ bgcolor: '#00a65a' }}>Lưu Thông Tin</Button>
        </DialogActions>
      </Dialog>

      {/* 🟢 DIALOG CẤU HÌNH SẢN PHẨM & BÁO GIÁ CHO NHÀ CUNG CẤP */}
      <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="md" fullWidth>
       <DialogTitle sx={{ bgcolor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" fontWeight={700}>Danh mục Sản phẩm: {selectedSupplier?.name}</Typography>
          <IconButton size="small" onClick={() => setOpenConfig(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: '#f8fafc', minHeight: 400 }}>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            Thêm các sản phẩm mà đối tác này cung cấp để hệ thống tự động gợi ý khi bạn Lập Phiếu Nhập Kho.
          </Typography>

          {/* Ô TÌM KIẾM ĐỂ THÊM SẢN PHẨM */}
          <Box sx={{ position: 'relative', mb: 3 }}>
            <TextField 
              fullWidth size="small" 
              placeholder="🔍 Gõ mã SKU hoặc tên sản phẩm để thêm vào danh mục..." 
              value={productSearch} onChange={(e) => setProductSearch(e.target.value)} 
              sx={{ bgcolor: 'white' }}
            />
            {searchResults.length > 0 && (
              <Paper sx={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 10, maxHeight: 250, overflow: 'auto', mt: 0.5, boxShadow: 3 }}>
                <List dense>
                  {searchResults.map(p => (
                    <ListItemButton key={p.variantId} onClick={() => addProductToConfig(p)}>
                      <ListItemText 
                        primary={<Typography fontWeight={700}>{p.variantName}</Typography>} 
                        secondary={`SKU: ${p.sku} | Đơn giá gợi ý: ${formatCurrency(p.costPrice)}`} 
                      />
                      <AddIcon color="primary" />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* BẢNG CÁC SẢN PHẨM ĐÃ CẤU HÌNH */}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}>Mã SKU</TableCell>
                  <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}>Tên Sản Phẩm</TableCell>
                  <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 600, width: 180 }}>Giá Nhập Thỏa Thuận</TableCell>
                  <TableCell sx={{ bgcolor: '#f1f5f9', width: 50 }} align="center">Xóa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                      Chưa có sản phẩm nào được cấu hình cho nhà cung cấp này.
                    </TableCell>
                  </TableRow>
                ) : (
                  supplierProducts.map((p) => (
                    <TableRow key={p.variantId}>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{p.sku}</TableCell>
                      <TableCell>{p.variantName}</TableCell>
                      <TableCell>
                        <TextField 
                          size="small" 
                          type="number" 
                          inputProps={{ min: 0 }}
                          value={p.importPrice} 
                          onChange={(e) => updateImportPrice(p.variantId, Number(e.target.value) || 0)}
                          InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }}
                          sx={{ bgcolor: 'white', '& .MuiInputBase-root': { height: 32 } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => removeProductFromConfig(p.variantId)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
          <Button onClick={() => setOpenConfig(false)} color="inherit" sx={{ fontWeight: 600 }}>Đóng</Button>
          <Button variant="contained" onClick={handleSaveConfig} disabled={savingConfig} sx={{ bgcolor: '#0ea5e9', fontWeight: 600, px: 4 }}>
            {savingConfig ? 'Đang lưu...' : 'Lưu Danh Mục'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};