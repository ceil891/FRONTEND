import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  InputAdornment, Paper, List, ListItemButton, ListItemText, Stack, Tabs, Tab
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Close as CloseIcon,
  RemoveCircleOutline as RemoveIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { supplierAPI, productAPI, importTicketAPI } from '../../api/client';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();

  // --- STATE CHO FORM THÊM/SỬA ---
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });

  // --- STATE CHO DIALOG CHI TIẾT (LỊCH SỬ & DANH MỤC) ---
  const [openDetail, setOpenDetail] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

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
            const attributes = [v.colorName, v.sizeName].filter(Boolean).join(' - ');
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

  useEffect(() => { loadSuppliers(); loadAllProductsForSearch(); }, []);

  const filteredSuppliers = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return suppliers;
    return suppliers.filter(s => 
      (s.name || '').toLowerCase().includes(kw) || (s.phone || '').includes(kw) || (s.code || '').toLowerCase().includes(kw)
    );
  }, [suppliers, searchQuery]);

  // ==========================================
  // XỬ LÝ THÊM / SỬA / XÓA (ĐÃ KHÔI PHỤC)
  // ==========================================
  const openForm = (sup?: any) => {
    if (sup) {
      setEditingId(sup.id);
      setFormData({ name: sup.name, contactPerson: sup.contactPerson || '', phone: sup.phone, email: sup.email || '', address: sup.address || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
    }
    setOpenDialog(true);
  };

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
      await supplierAPI.delete(id); 
      showToast('Xóa thành công', 'success'); 
      loadSuppliers();
    } catch (error: any) { showToast(error.message || 'Lỗi khi xóa', 'error'); }
  };

  // ==========================================
  // XỬ LÝ CHI TIẾT (HISTORY & DANH MỤC SP)
  // ==========================================
  const handleOpenDetail = async (supplier: any) => {
    setSelectedSupplier(supplier);
    setOpenDetail(true);
    setTabValue(0);
    setHistoryTickets([]);
    setLoadingHistory(true);
    try {
      const hRes = await importTicketAPI.getAll({ supplierId: supplier.id });
      const hData = hRes.data?.data || hRes.data || [];
      const filtered = Array.isArray(hData) ? hData.filter((t: any) => {
        const sid = t.supplier?.id || t.supplierId || t.supplier_id;
        return String(sid) === String(supplier.id);
      }) : [];
      setHistoryTickets(filtered);

      const pRes = await supplierAPI.getProducts(supplier.id);
      const pData = pRes.data?.data || pRes.data || [];
      setSupplierProducts(pData.map((p: any) => ({
        variantId: p.variantId,
        sku: p.sku,
        variantName: p.variantName,
        importPrice: p.costPrice || 0 
      })));
    } catch (error) { showToast('Lỗi tải dữ liệu chi tiết', 'error'); } 
    finally { setLoadingHistory(false); }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      const payload = supplierProducts.map(p => ({ variantId: p.variantId, importPrice: Number(p.importPrice) }));
      await supplierAPI.configProducts(selectedSupplier.id, payload);
      showToast('Lưu danh mục thành công!', 'success');
    } catch (error) { showToast('Lỗi khi lưu cấu hình', 'error'); } 
    finally { setSavingConfig(false); }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>QUẢN LÝ NHÀ CUNG CẤP</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm()} sx={{ bgcolor: '#00a65a' }}>
          Thêm Đối Tác
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <TextField size="small" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }} />
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>Mã NCC</TableCell><TableCell>Tên Nhà Cung Cấp</TableCell>
                  <TableCell>Điện Thoại</TableCell><TableCell align="right">Công Nợ</TableCell>
                  <TableCell align="center">Trạng Thái</TableCell><TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow> :
                  filteredSuppliers.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{s.code}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: (s.debt || 0) > 0 ? '#dc2626' : 'inherit' }}>{formatCurrency(s.debt)}</TableCell>
                      <TableCell align="center"><Chip label={s.status === 'ACTIVE' ? 'Đang giao dịch' : 'Ngừng'} size="small" color={s.status === 'ACTIVE' ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" title="Lịch sử & Danh mục" onClick={() => handleOpenDetail(s)}><HistoryIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="info" onClick={() => openForm(s)}><EditIcon fontSize="small" /></IconButton>
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

      {/* DIALOG THÊM / SỬA (Đã khôi phục) */}
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

      {/* DIALOG CHI TIẾT (HISTORY & DANH MỤC) */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>{selectedSupplier?.name}</Typography>
          <IconButton size="small" onClick={() => setOpenDetail(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered>
            <Tab label="Lịch sử nhập hàng" sx={{ fontWeight: 700 }} />
            <Tab label="Danh mục hàng cung cấp" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>
        <DialogContent dividers sx={{ p: 0, minHeight: 400 }}>
          {tabValue === 0 && (
             <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}><TableRow>
                    <TableCell>Mã Phiếu</TableCell><TableCell>Ngày Nhập</TableCell>
                    <TableCell align="right">Tổng Tiền</TableCell><TableCell align="center">Trạng Thái</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {loadingHistory ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24}/></TableCell></TableRow> :
                      historyTickets.length === 0 ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>Chưa có giao dịch.</TableCell></TableRow> :
                      historyTickets.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{row.code}</TableCell>
                          <TableCell>{new Date(row.importDate).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row.totalAmount)}</TableCell>
                          <TableCell align="center"><Chip label={row.debtAmount > 0 ? "Còn nợ" : "Đã trả"} size="small" color={row.debtAmount > 0 ? "error" : "success"} /></TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </TableContainer>
          )}
          {tabValue === 1 && (
            <Box sx={{ p: 2 }}>
               <TextField fullWidth size="small" placeholder="🔍 Tìm SP thêm vào danh mục..." 
                value={productSearch} onChange={(e) => setProductSearch(e.target.value)} sx={{ mb: 2 }} />
              {productSearch.length > 1 && (
                <Paper sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
                  <List dense>
                    {allProducts.filter(p => p.variantName.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                      <ListItemButton key={p.variantId} onClick={() => {
                        if (!supplierProducts.some(sp => sp.variantId === p.variantId)) {
                            setSupplierProducts([...supplierProducts, { ...p, importPrice: p.costPrice }]);
                        }
                        setProductSearch('');
                      }}>
                        <ListItemText primary={p.variantName} secondary={`SKU: ${p.sku}`} />
                        <AddIcon color="primary" />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              )}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead><TableRow><TableCell>Sản phẩm</TableCell><TableCell align="right">Giá nhập thỏa thuận</TableCell><TableCell align="center">Xóa</TableCell></TableRow></TableHead>
                  <TableBody>
                    {supplierProducts.map((p) => (
                      <TableRow key={p.variantId}>
                        <TableCell>{p.variantName}</TableCell>
                        <TableCell align="right"><TextField size="small" type="number" value={p.importPrice} 
                            onChange={(e) => setSupplierProducts(supplierProducts.map(sp => sp.variantId === p.variantId ? {...sp, importPrice: e.target.value} : sp))} 
                            sx={{ width: 120 }} /></TableCell>
                        <TableCell align="center"><IconButton size="small" color="error" onClick={() => setSupplierProducts(supplierProducts.filter(sp => sp.variantId !== p.variantId))}><RemoveIcon /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, textAlign: 'right' }}><Button variant="contained" onClick={handleSaveConfig} disabled={savingConfig}>Lưu Danh Mục</Button></Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};