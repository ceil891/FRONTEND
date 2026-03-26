import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, IconButton, MenuItem, Select, FormControl, 
  InputLabel, InputAdornment, Divider, List, ListItem, ListItemText, 
  Stack, ListItemButton, Checkbox, Paper
} from '@mui/material';
import {
  Add as AddIcon, Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, AccountBalanceWallet as DebtIcon, Close as CloseIcon,
  Search as SearchIcon, AddCircle as AddCircleIcon, 
  Remove as RemoveIcon, PersonAdd as PersonAddIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore'; // 🟢 Import store để lấy tài khoản đăng nhập
import { importTicketAPI, supplierAPI, productAPI, storeAPI } from '../../api/client';

// --- TYPES ---
interface BackendImportTicket {
  id: number;
  code?: string;
  importDate?: string;
  createdAt?: string;
  supplierName?: string;
  totalAmount?: number;
  paidAmount?: number;
  debtAmount?: number;
  creatorName?: string;
  createdByName?: string;
  employeeName?: string;
  status?: string;
}

interface Supplier { id: number; name: string; phone: string; }
interface ProductVariant { 
  id: number; 
  variantName?: string; 
  name?: string; 
  sku: string; 
  costPrice?: number; 
  basePrice?: number; 
}

// --- MAIN COMPONENT ---
export const ImportInventoryPage: React.FC = () => {
  // 🟢 Lấy thông tin User đang đăng nhập
  const { user } = useAuthStore(); 

  // 1. STATE TỔNG QUAN
  const [searchQuery, setSearchQuery] = useState('');
  const [imports, setImports] = useState<BackendImportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); 
  
  // 2. STATE DANH MỤC (API)
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [stores, setStores] = useState<any[]>([]); 
  const [currentStoreId, setCurrentStoreId] = useState<number | string>(''); 
  
  // 3. STATE DIALOG
  const [openDetail, setOpenDetail] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false); 
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // State Dialog Khóa / Hủy siêu đẹp
  const [cancelConfirm, setCancelConfirm] = useState<{open: boolean, id: number | null, code: string}>({ open: false, id: null, code: '' });
  const [lockConfirm, setLockConfirm] = useState<{open: boolean, id: number | null, code: string}>({ open: false, id: null, code: '' });

  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // --- API DATA FETCHING ---
  
  const loadCategories = async () => {
    try {
      const [supRes, prodRes, storeRes] = await Promise.all([
        supplierAPI.getAll(), productAPI.getAll(), storeAPI.getAll()
      ]);
      
      setSuppliers(supRes.data?.data || supRes.data || []);
      const fetchedStores = storeRes.data?.data || storeRes.data || [];
      setStores(fetchedStores);
      if (fetchedStores.length > 0 && !currentStoreId) {
        setCurrentStoreId(fetchedStores[0].id); 
      }

      const rawProducts = prodRes.data?.data || prodRes.data || [];
      const allVariants = rawProducts.flatMap((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          return product.variants.map((v: any) => ({
            ...v,
            variantName: v.variantName || `${product.name} - ${v.colorName || ''} ${v.sizeName || ''}`.trim(),
            costPrice: v.costPrice || product.baseCostPrice || 0 
          }));
        }
        return [];
      });
      setProducts(allVariants); 
    } catch (error) {
      showToast('Lỗi tải danh mục hệ thống', 'error');
    }
  };

  const fetchImportTickets = async () => {
    if (!currentStoreId) return;
    try {
      setLoading(true);
      const res = await importTicketAPI.getAll({ storeId: currentStoreId });
      setImports(res.data?.data || res.data || []);
      setSelectedIds([]); 
    } catch (error) {
      showToast('Không thể tải danh sách phiếu nhập', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { fetchImportTickets(); }, [currentStoreId]);

  // --- LOGIC HÀNH ĐỘNG CỦA TỪNG PHIẾU ---
  
  const handleViewDetail = async (id: number) => {
    try {
      setOpenDetail(true); setDetailLoading(true);
      const res = await importTicketAPI.getById(id);
      setSelectedTicket(res.data?.data || res.data);
    } catch (error) {
      showToast('Lỗi khi lấy chi tiết phiếu', 'error'); setOpenDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmCancelAction = async () => {
    if (!cancelConfirm.id) return;
    try {
      await importTicketAPI.cancel(cancelConfirm.id);
      showToast('Đã hủy phiếu nhập thành công', 'success');
      setCancelConfirm({ open: false, id: null, code: '' }); 
      fetchImportTickets(); 
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi hủy phiếu', 'error');
    }
  };

  const confirmLockAction = async () => {
    if (!lockConfirm.id) return;
    try {
      await importTicketAPI.updateStatus(lockConfirm.id, 'COMPLETED'); 
      showToast('Đã chốt phiếu và cập nhật kho thành công!', 'success');
      setLockConfirm({ open: false, id: null, code: '' });
      fetchImportTickets(); 
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi chốt phiếu', 'error');
    }
  };

  // --- LOGIC LỌC & CHỌN BẢNG ---
  const filteredImports = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return imports;
    return imports.filter(p => (p.code || '').toLowerCase().includes(kw) || (p.supplierName || '').toLowerCase().includes(kw));
  }, [imports, searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.checked ? setSelectedIds(filteredImports.map(i => i.id)) : setSelectedIds([]);
  };

  const renderStatusChip = (status?: string) => {
    if (!status) return <Chip label="Chưa rõ" size="small" />;
    const s = status.toUpperCase();
    if (s === 'COMPLETED' || s === 'ĐÃ THANH TOÁN') return <Chip label="Hoàn thành" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none' }} />;
    if (s === 'DEBT' || s === 'PENDING' || s === 'GHI NỢ') return <Chip label="Ghi nợ" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none' }} />;
    if (s === 'CANCELLED' || s === 'ĐÃ HỦY') return <Chip label="Đã hủy" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none' }} />;
    return <Chip label={status} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none' }} />;
  };

  // --- LOGIC FORM LẬP PHIẾU NHẬP MỚI ---
  const initialForm = { supplierId: '', importDate: new Date().toISOString().split('T')[0], paidAmount: 0, items: [] as any[] };
  const [addFormData, setAddFormData] = useState(initialForm);
  const [productSearchKey, setProductSearchKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const calculatedAmounts = useMemo(() => {
    const totalAmount = addFormData.items.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0);
    const paidAmount = Number(addFormData.paidAmount) || 0;
    const debtAmount = Math.max(0, totalAmount - paidAmount);
    return { totalAmount, paidAmount, debtAmount };
  }, [addFormData.items, addFormData.paidAmount]);

  const filteredProducts = useMemo(() => {
    const kw = productSearchKey.trim().toLowerCase();
    if (kw.length < 1) return []; // 🟢 Tối ưu: gõ 1 chữ là ra
    return products.filter(p => (p.variantName || '').toLowerCase().includes(kw) || (p.sku || '').toLowerCase().includes(kw));
  }, [productSearchKey, products]);

  const handleAddProductToTicket = (prod: any) => {
    setAddFormData(prev => {
      const existingItem = prev.items.find(item => item.variantId === prod.id);
      if (existingItem) {
        showToast(`Đã tăng số lượng: ${prod.variantName}`, 'info');
        return { ...prev, items: prev.items.map(item => item.variantId === prod.id ? { ...item, quantity: item.quantity + 1 } : item) };
      } else {
        return { ...prev, items: [...prev.items, { variantId: prod.id, name: prod.variantName, sku: prod.sku, quantity: 1, importPrice: prod.costPrice || 0 }] };
      }
    });
    setProductSearchKey(''); 
  };

  const handleSaveImportTicket = async () => {
    if (!addFormData.supplierId || addFormData.items.length === 0) {
      showToast('Vui lòng chọn Nhà cung cấp và thêm ít nhất 1 sản phẩm', 'warning'); return;
    }
    try {
      setSubmitting(true);
      const payload = {
        supplierId: Number(addFormData.supplierId),
        storeId: Number(currentStoreId), 
        importDate: addFormData.importDate,
        paidAmount: calculatedAmounts.paidAmount,
        details: addFormData.items.map(item => ({
          productVariantId: item.variantId,
          quantity: item.quantity,          
          unitPrice: item.importPrice       
        }))
      };
      await importTicketAPI.create(payload);
      showToast('Lập phiếu nhập thành công!', 'success');
      setOpenAddDialog(false);
      setAddFormData(initialForm);
      fetchImportTickets(); 
    } catch (error: any) {
      showToast(error.message || 'Lỗi hệ thống khi tạo phiếu nhập', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- COMPONENT RENDER ---
  return (
    <Box className="fade-in">
      {/* HEADER & CHỌN CỬA HÀNG */}
      <Box sx={{ bgcolor: '#3498db', color: 'white', p: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Kho vận / Nhập hàng</Typography>
        <Select
          size="small" value={currentStoreId} onChange={(e) => setCurrentStoreId(e.target.value)} displayEmpty
          sx={{ bgcolor: 'white', color: '#333', fontWeight: 600, borderRadius: '16px', height: '32px', fontSize: '0.85rem', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
        >
          {stores.length === 0 && <MenuItem value="">Đang tải...</MenuItem>}
          {stores.map(store => <MenuItem key={store.id} value={store.id} sx={{ fontSize: '0.85rem' }}>{store.name}</MenuItem>)}
        </Select>
      </Box>

      {/* TOOLBAR */}
      <Box sx={{ px: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
              <TextField 
                size="small" placeholder="Tìm: Mã phiếu / Tên NCC..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 280, bgcolor: 'white', '& .MuiInputBase-root': { borderRadius: '20px'} }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }}
              />
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} sx={{ bgcolor: '#00a65a', textTransform: 'none' }}>Lập Phiếu Nhập</Button>
              <Button size="small" variant="contained" startIcon={<DebtIcon />} onClick={() => setOpenPaymentDialog(true)} sx={{ bgcolor: '#f39c12', textTransform: 'none' }}>Thanh Toán Nợ</Button>
              <Button size="small" variant="outlined" startIcon={<PrintIcon />} sx={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none' }}>In DS</Button>
              <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', textTransform: 'none' }}>Xuất Excel</Button>
            </Box>

            {/* BẢNG DỮ LIỆU */}
            <TableContainer sx={{ minHeight: 400 }}>
              <Table sx={{ minWidth: 1200 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={filteredImports.length > 0 && selectedIds.length === filteredImports.length} onChange={handleSelectAll} /></TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>No.</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                    {['Mã Phiếu', 'Ngày Nhập', 'Nhà Cung Cấp', 'Tổng Tiền', 'Đã Thanh Toán', 'Công Nợ', 'Người Lập', 'Trạng Thái'].map((col) => (
                      <TableCell key={col} sx={{ fontWeight: 600, color: '#475569' }}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                  ) : filteredImports.length === 0 ? (
                     <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>Không có dữ liệu phiếu nhập</TableCell></TableRow>
                  ) : (
                    filteredImports.map((row, idx) => {
                      const isCancelled = row.status?.toUpperCase() === 'CANCELLED';
                      const isCompleted = row.status?.toUpperCase() === 'COMPLETED';
                      const isSelected = selectedIds.includes(row.id);

                      return (
                        <TableRow key={row.id} hover selected={isSelected} sx={{ bgcolor: isCancelled ? '#fef2f2' : 'inherit' }}>
                          <TableCell padding="checkbox"><Checkbox size="small" checked={isSelected} onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])} /></TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>{idx + 1}</TableCell>
                          
                          {/* CỘT THAO TÁC CÓ NÚT KHÓA */}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Box onClick={() => handleViewDetail(row.id)} sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }} title="Xem chi tiết"><ViewIcon sx={{ fontSize: 14 }} /></Box>
                              
                              {!isCancelled && !isCompleted && (
                                <Box onClick={() => setLockConfirm({open: true, id: row.id, code: row.code || `PN${row.id}`})} sx={{ bgcolor: '#f39c12', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }} title="Chốt phiếu"><LockIcon sx={{ fontSize: 14 }} /></Box>
                              )}

                              {!isCancelled && !isCompleted && (
                                <Box onClick={() => setCancelConfirm({open: true, id: row.id, code: row.code || `PN${row.id}`})} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }} title="Hủy phiếu"><CloseIcon sx={{ fontSize: 14 }} /></Box>
                              )}
                            </Box>
                          </TableCell>
                          
                          {/* CÁC CỘT DỮ LIỆU */}
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0284c7' }}><span style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{row.code || `PN${row.id}`}</span></TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{row.importDate ? new Date(row.importDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.supplierName || 'NCC Vãng lai'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(row.totalAmount || 0)}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>{formatCurrency(row.paidAmount || 0)}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: (row.debtAmount || 0) > 0 ? '#dc2626' : '#475569', fontWeight: (row.debtAmount || 0) > 0 ? 700 : 500 }}>{formatCurrency(row.debtAmount || 0)}</TableCell>
                          
                          {/* 🟢 CỘT NGƯỜI LẬP: Lấy user hiện tại nếu Backend trống */}
                          <TableCell sx={{ fontSize: '0.85rem' }}>
                            {row.createdByName || row.creatorName || row.employeeName || user?.fullName || 'System Admin'}
                          </TableCell>
                          
                          <TableCell>{renderStatusChip(row.status)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ p: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
               <Pagination count={1} size="small" shape="rounded" color="primary" />
               <Typography variant="body2" color="text.secondary">Hiển thị {filteredImports.length} kết quả</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* DIALOG LẬP PHIẾU NHẬP */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00a65a', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          TẠO PHIẾU NHẬP KHO MỚI <IconButton size="small" onClick={() => setOpenAddDialog(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: '#f1f5f9' }}>
          <Grid container spacing={2}>
            {/* THÔNG TIN NCC */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Nhà cung cấp *</InputLabel>
                        <Select label="Nhà cung cấp *" value={addFormData.supplierId} onChange={(e) => setAddFormData({ ...addFormData, supplierId: e.target.value })}>
                          {suppliers.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.name} - ({s.phone})</MenuItem>)}
                        </Select>
                      </FormControl>
                      <IconButton sx={{ color: '#f39c12' }}><PersonAddIcon /></IconButton>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth size="small" type="date" label="Ngày nhập *" value={addFormData.importDate} onChange={(e) => setAddFormData({ ...addFormData, importDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* TÌM KIẾM VÀ CHỌN SẢN PHẨM */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}><BusinessIcon color="primary" /><Typography fontWeight={600}>Chi tiết sản phẩm nhập</Typography></Stack>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <TextField fullWidth size="small" placeholder="🔍 Gõ tên hoặc mã SKU sản phẩm để thêm..." value={productSearchKey} onChange={(e) => setProductSearchKey(e.target.value)} />
                  {filteredProducts.length > 0 && (
                    <Paper sx={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 10, maxHeight: 250, overflow: 'auto', mt: 0.5, boxShadow: 3 }}>
                      <List size="small">
                        {filteredProducts.map(p => (
                          <ListItemButton key={p.id} onClick={() => handleAddProductToTicket(p)}>
                            <ListItemText 
                              primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography fontWeight={700}>{p.variantName}</Typography><Typography color="primary">{formatCurrency(p.costPrice)}</Typography></Box>} 
                              secondary={<Box sx={{ display: 'flex', gap: 2 }}><Chip label={p.sku} size="small" sx={{ height: 20 }} /><Typography variant="caption">Tồn kho hiện tại: {p.quantity || 0}</Typography></Box>} 
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>

                {/* BẢNG SẢN PHẨM CHỌN */}
                <TableContainer sx={{ border: '1px solid #eee', maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f8fafc' } }}>
                        <TableCell>Sản Phẩm</TableCell><TableCell align="center">SL</TableCell><TableCell align="right">Đơn giá (đ)</TableCell><TableCell align="right">Thành tiền (đ)</TableCell><TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {addFormData.items.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa chọn sản phẩm nào</TableCell></TableRow> : 
                        addFormData.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography><Typography variant="caption">{item.sku}</Typography></TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <IconButton size="small" onClick={() => setAddFormData(prev => ({...prev, items: prev.items.map((it, idx) => idx === i ? {...it, quantity: Math.max(1, it.quantity - 1)} : it)}))}><RemoveIcon fontSize="small"/></IconButton>
                                <TextField type="number" size="small" value={item.quantity} onChange={(e) => setAddFormData(prev => ({...prev, items: prev.items.map((it, idx) => idx === i ? {...it, quantity: Math.max(1, parseInt(e.target.value)||1)} : it)}))} sx={{ width: 60 }} />
                                <IconButton size="small" onClick={() => setAddFormData(prev => ({...prev, items: prev.items.map((it, idx) => idx === i ? {...it, quantity: it.quantity + 1} : it)}))}><AddIcon fontSize="small"/></IconButton>
                              </Stack>
                            </TableCell>
                            <TableCell align="right"><TextField type="number" size="small" value={item.importPrice} onChange={(e) => setAddFormData(prev => ({...prev, items: prev.items.map((it, idx) => idx === i ? {...it, importPrice: Math.max(0, parseInt(e.target.value)||0)} : it)}))} sx={{ width: 120 }} /></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.quantity * item.importPrice)}</TableCell>
                            <TableCell><IconButton size="small" color="error" onClick={() => setAddFormData(prev => ({...prev, items: prev.items.filter((_, idx) => idx !== i)}))}><CloseIcon fontSize="small" /></IconButton></TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* TỔNG TIỀN VÀ THANH TOÁN */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={7}><Card sx={{ p: 2, height: '100%' }}><TextField fullWidth multiline rows={3} label="Ghi chú" /></Card></Grid>
                <Grid item xs={5}>
                  <Card sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography>Tổng tiền:</Typography><Typography variant="h6" color="primary" fontWeight={700}>{formatCurrency(calculatedAmounts.totalAmount)}</Typography></Box>
                      <Divider dashed />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography color="success.main">Đã thanh toán:</Typography><TextField type="number" size="small" value={addFormData.paidAmount} onChange={(e) => setAddFormData({...addFormData, paidAmount: Math.max(0, parseInt(e.target.value)||0)})} sx={{ width: 150 }} /></Box>
                      <Divider dashed />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="error.main">Ghi nợ:</Typography><Typography variant="h6" color="error.main" fontWeight={700}>{formatCurrency(calculatedAmounts.debtAmount)}</Typography></Box>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f1f5f9' }}>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSaveImportTicket} disabled={submitting} sx={{ bgcolor: '#00a65a' }}>{submitting ? 'Đang lưu...' : 'Lập Phiếu & Nhập Kho'}</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG XEM CHI TIẾT */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>Phiếu Nhập: {selectedTicket?.code || `PN${selectedTicket?.id}`}</Typography>
          <IconButton size="small" onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
           {detailLoading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : selectedTicket && (
               <Grid container spacing={2}>
                   <Grid item xs={6}><Typography><b>Nhà CC:</b> {selectedTicket.supplierName}</Typography></Grid>
                   <Grid item xs={6}><Typography><b>Ngày nhập:</b> {new Date(selectedTicket.importDate).toLocaleDateString('vi-VN')}</Typography></Grid>
                   <Grid item xs={12}>
                       <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell>Sản phẩm</TableCell><TableCell align="center">SL</TableCell><TableCell align="right">Đơn giá</TableCell><TableCell align="right">Thành tiền</TableCell></TableRow></TableHead><TableBody>{selectedTicket.details?.map((d: any, idx: number) => (<TableRow key={idx}><TableCell>{d.variantName} <br/><Typography variant="caption">{d.sku}</Typography></TableCell><TableCell align="center">{d.quantity}</TableCell><TableCell align="right">{formatCurrency(d.unitPrice)}</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(d.quantity * d.unitPrice)}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
                   </Grid>
                   <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
                       <Typography>Tổng tiền: <b>{formatCurrency(selectedTicket.totalAmount)}</b> | Đã trả: <b style={{color: 'green'}}>{formatCurrency(selectedTicket.paidAmount)}</b> | Nợ: <b style={{color: 'red'}}>{formatCurrency(selectedTicket.debtAmount)}</b></Typography>
                   </Grid>
               </Grid>
           )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpenDetail(false)}>Đóng</Button></DialogActions>
      </Dialog>

      {/* 🟢 DIALOG KHÓA PHIẾU SIÊU ĐẸP */}
      <Dialog open={lockConfirm.open} onClose={() => setLockConfirm({...lockConfirm, open: false})} PaperProps={{ sx: { borderRadius: 3, p: 1, width: 400 } }}>
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ bgcolor: '#fff4e5', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <LockIcon sx={{ fontSize: 40, color: '#f39c12' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>Chốt phiếu nhập kho?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Bạn muốn chốt phiếu <b style={{ color: '#0284c7' }}>{lockConfirm.code}</b>? <br/> Dữ liệu sẽ được <b>ghi vào kho</b> và không thể sửa đổi hay hủy sau khi chốt.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setLockConfirm({...lockConfirm, open: false})} sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Bỏ qua</Button>
          <Button variant="contained" onClick={confirmLockAction} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' }, borderRadius: 2, px: 3, fontWeight: 600 }}>Xác nhận chốt</Button>
        </DialogActions>
      </Dialog>

      {/* 🟢 DIALOG HỦY PHIẾU SIÊU ĐẸP */}
      <Dialog open={cancelConfirm.open} onClose={() => setCancelConfirm({ ...cancelConfirm, open: false })} PaperProps={{ sx: { borderRadius: 3, p: 1, width: 400 } }}>
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ bgcolor: '#fef2f2', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <CloseIcon sx={{ fontSize: 40, color: '#dc2626' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>Xác nhận hủy phiếu?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Bạn có chắc chắn muốn hủy phiếu <b style={{ color: '#0284c7' }}>{cancelConfirm.code}</b>? <br/> Hành động này sẽ <b>hoàn lại tồn kho</b> và không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setCancelConfirm({ open: false, id: null, code: '' })} sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={confirmCancelAction} sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 2, px: 3, fontWeight: 600 }}>Xác nhận hủy</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG THANH TOÁN */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f39c12', color: 'white' }}>THANH TOÁN CÔNG NỢ NHÀ CUNG CẤP</DialogTitle>
        <DialogContent sx={{ pt: 3 }}><Typography>Chức năng đang phát triển. Vui lòng vào module Tài Chính - Thu/Chi.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpenPaymentDialog(false)} variant="contained" color="primary">Đã hiểu</Button></DialogActions>
      </Dialog>
    </Box>
  );
};