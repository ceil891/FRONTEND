import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, CircularProgress, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Paper, InputAdornment, Divider, Select, MenuItem, Stack,
  List, ListItemButton, ListItemText, 
  FormControl, InputLabel // 🟢 ĐÃ FIX LỖI THIẾU IMPORT Ở ĐÂY
} from '@mui/material';
import {
  Add as AddIcon, Print as PrintIcon, FileDownload as ExcelIcon, 
  Visibility as ViewIcon, Close as CloseIcon, 
  Search as SearchIcon, Payments as PaymentIcon, FilterAlt as FilterIcon,
  AddCircle as AddCircleIcon, Remove as RemoveIcon, Lock as LockIcon
} from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import { exportTicketAPI, productAPI, storeAPI, customerAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const ExportInventoryPage: React.FC = () => {
  const { user } = useAuthStore();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<number | string>('');

  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [cancelConfirm, setCancelConfirm] = useState<{open: boolean, id: number | null, code: string}>({ open: false, id: null, code: '' });
  const [lockConfirm, setLockConfirm] = useState<{open: boolean, id: number | null, code: string}>({ open: false, id: null, code: '' });

  const { showToast } = useToastStore();
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  // --- API FETCHING ---
  const loadCategories = async () => {
    try {
      const [prodRes, storeRes, custRes] = await Promise.all([productAPI.getAll(), storeAPI.getAll(), customerAPI.getAll()]);
      if (custRes.data?.success) setCustomers(custRes.data.data);
      
      const fetchedStores = storeRes.data?.data || storeRes.data || [];
      setStores(fetchedStores);
      if (fetchedStores.length > 0 && !currentStoreId) setCurrentStoreId(fetchedStores[0].id);

      const rawProducts = prodRes.data?.data || prodRes.data || [];
      const allVariants = rawProducts.flatMap((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          return product.variants.map((v: any) => ({
            id: v.id,
            variantName: `${product.name} - ${v.variantName || `${v.colorName || ''} ${v.sizeName || ''}`.trim()}`,
            sku: v.sku || 'Chưa có SKU',
            retailPrice: v.baseRetailPrice || product.baseRetailPrice || 0,
            wholesalePrice: v.baseWholesalePrice || product.baseWholesalePrice || 0,
            costPrice: v.costPrice || product.baseCostPrice || 0,
            quantity: v.quantity || 0,
          }));
        }
        return [];
      });
      setProducts(allVariants);
    } catch (error) {
      showToast('Lỗi tải danh mục hệ thống', 'error');
    }
  };

  const fetchExportTickets = async () => {
    if (!currentStoreId) return;
    try {
      setLoading(true);
      const res = await exportTicketAPI.getAll({ storeId: currentStoreId });
      setTickets(res.data?.data || res.data || []);
      setSelectedIds([]);
    } catch (error) {
      showToast('Không thể tải danh sách phiếu xuất', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { fetchExportTickets(); }, [currentStoreId]);

  const filteredTickets = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return tickets;
    return tickets.filter(p => (p.code || '').toLowerCase().includes(kw) || (p.customerName || '').toLowerCase().includes(kw));
  }, [tickets, searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { e.target.checked ? setSelectedIds(filteredTickets.map(i => i.id)) : setSelectedIds([]); };

  // --- ACTIONS ---
  const handleViewDetail = async (id: number) => {
    try { setOpenDetail(true); setDetailLoading(true); const res = await exportTicketAPI.getById(id); setSelectedTicket(res.data?.data || res.data); } 
    catch (error) { showToast('Lỗi khi lấy chi tiết phiếu', 'error'); setOpenDetail(false); } 
    finally { setDetailLoading(false); }
  };

  const confirmCancelAction = async () => {
    if (!cancelConfirm.id) return;
    try { await exportTicketAPI.cancel(cancelConfirm.id); showToast('Đã hủy phiếu xuất thành công', 'success'); setCancelConfirm({ open: false, id: null, code: '' }); fetchExportTickets(); } 
    catch (error: any) { showToast(error.message || 'Lỗi khi hủy phiếu', 'error'); }
  };

  const confirmLockAction = async () => {
    if (!lockConfirm.id) return;
    try { await exportTicketAPI.updateStatus(lockConfirm.id, 'COMPLETED'); showToast('Đã chốt phiếu và xuất kho thành công!', 'success'); setLockConfirm({ open: false, id: null, code: '' }); fetchExportTickets(); } 
    catch (error: any) { showToast(error.message || 'Lỗi khi chốt phiếu', 'error'); }
  };

  // --- LOGIC NGHIỆP VỤ XUẤT HÀNG ---
  const EXPORT_TYPES = [
    { value: 'RETAIL', label: 'Xuất bán lẻ' },
    { value: 'WHOLESALE', label: 'Xuất bán buôn' },
    { value: 'TRANSFER', label: 'Chuyển kho nội bộ' },
    { value: 'RETURN', label: 'Xuất trả Nhà cung cấp' },
    { value: 'DESTROY', label: 'Xuất hủy / Hao hụt' }
  ];

  const initialForm = { exportType: 'RETAIL', customerName: '', exportDate: new Date().toISOString().split('T')[0], reason: '', items: [] as any[] };
  const [addFormData, setAddFormData] = useState(initialForm);
  const [productSearchKey, setProductSearchKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getPriceByExportType = (product: any, type: string) => {
    if (type === 'RETAIL') return product.retailPrice;
    if (type === 'WHOLESALE') return product.wholesalePrice;
    if (type === 'TRANSFER' || type === 'RETURN') return product.costPrice; 
    if (type === 'DESTROY') return 0; 
    return product.retailPrice;
  };

  const handleExportTypeChange = (newType: string) => {
    setAddFormData(prev => ({
      ...prev,
      exportType: newType,
      items: prev.items.map(item => ({ ...item, exportPrice: getPriceByExportType(item, newType) }))
    }));
  };

  const calculatedTotal = useMemo(() => addFormData.items.reduce((sum, item) => sum + (item.quantity * item.exportPrice), 0), [addFormData.items]);

  const filteredProducts = useMemo(() => {
    const kw = productSearchKey.trim().toLowerCase();
    if (kw.length < 1) return []; 
    return products.filter(p => (p.variantName || '').toLowerCase().includes(kw) || (p.sku || '').toLowerCase().includes(kw));
  }, [productSearchKey, products]);

  // 🟢 ĐÃ FIX LỖI REACT WARNING TẠI ĐÂY (Tách showToast ra khỏi setAddFormData)
  const handleAddProduct = (prod: any) => {
    const existingItem = addFormData.items.find(item => item.variantId === prod.id);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > existingItem.maxQty) {
        showToast(`Tồn kho chỉ còn ${existingItem.maxQty}`, 'warning');
        return;
      }
      showToast(`Đã tăng số lượng: ${prod.variantName}`, 'info');
      setAddFormData(prev => ({ ...prev, items: prev.items.map(item => item.variantId === prod.id ? { ...item, quantity: item.quantity + 1 } : item) }));
    } else {
      if (prod.quantity <= 0) { 
        showToast(`Sản phẩm [${prod.sku}] đã hết hàng trong kho!`, 'warning'); 
        return; 
      }
      const autoPrice = getPriceByExportType(prod, addFormData.exportType);
      setAddFormData(prev => ({ 
        ...prev, 
        items: [...prev.items, { 
          variantId: prod.id, name: prod.variantName, sku: prod.sku, quantity: 1, 
          exportPrice: autoPrice, maxQty: prod.quantity,
          retailPrice: prod.retailPrice, wholesalePrice: prod.wholesalePrice, costPrice: prod.costPrice 
        }] 
      }));
    }
    setProductSearchKey(''); 
  };

  const handleUpdateQty = (id: number, newQty: number) => {
    const item = addFormData.items.find(it => it.variantId === id);
    if (!item) return;
    if (newQty > item.maxQty) { 
      showToast(`Tồn kho tối đa: ${item.maxQty}`, 'warning'); 
      return; 
    }
    setAddFormData(prev => ({ ...prev, items: prev.items.map(it => it.variantId === id ? { ...it, quantity: newQty } : it) }));
  };

  const handleSave = async () => {
    if (!currentStoreId) return showToast("Vui lòng chọn cửa hàng trên Header!", "warning");
    if (addFormData.items.length === 0) return showToast("Chưa chọn sản phẩm để xuất!", "warning");
    
    try {
      setSubmitting(true);
      const payload = {
        storeId: Number(currentStoreId),
        createdById: user?.id || 1, // 🟢 ĐÃ FIX THÊM TRƯỜNG NÀY THEO CODE GỐC ĐỂ BACKEND KHÔNG BỊ LỖI
        customerName: addFormData.customerName || (addFormData.exportType === 'TRANSFER' ? 'Nội bộ hệ thống' : 'Khách lẻ'),
        exportDate: addFormData.exportDate,
        reason: `[${EXPORT_TYPES.find(t => t.value === addFormData.exportType)?.label}] ${addFormData.reason}`,
        details: addFormData.items.map(item => ({
          productVariantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.exportPrice 
        }))
      };
      
      await exportTicketAPI.create(payload);
      showToast("Lập phiếu xuất thành công!", "success");
      setOpenCreate(false);
      setAddFormData(initialForm);
      fetchExportTickets();
    } catch (error: any) { 
      showToast(error.response?.data?.message || "Lỗi lưu phiếu", "error"); 
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh', pb: 5 }} className="fade-in">
      {/* HEADER CHUNG */}
      <Box sx={{ bgcolor: '#3498db', color: 'white', p: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Kho vận / Xuất hàng</Typography>
        <Select size="small" value={currentStoreId} onChange={(e) => setCurrentStoreId(e.target.value)} displayEmpty sx={{ bgcolor: 'white', color: '#333', fontWeight: 600, borderRadius: '16px', height: '32px', fontSize: '0.85rem', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}>
          {stores.length === 0 && <MenuItem value="">Đang tải...</MenuItem>}
          {stores.map(store => <MenuItem key={store.id} value={store.id} sx={{ fontSize: '0.85rem' }}>{store.name}</MenuItem>)}
        </Select>
      </Box>

      {/* DANH SÁCH */}
      <Box sx={{ px: 3, mb: 2 }}><Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>DANH SÁCH PHIẾU XUẤT HÀNG</Typography></Box>

      <Box sx={{ px: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
          <CardContent sx={{ p: 0 }}>
            {/* TOOLBAR */}
            <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField size="small" placeholder="Tìm: Mã phiếu / Khách hàng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action"/></InputAdornment> }} sx={{ width: 280, bgcolor: 'white', '& .MuiInputBase-root': { borderRadius: '20px'} }} />
              <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#27ae60', textTransform: 'none' }} onClick={() => setOpenCreate(true)}>Lập Phiếu Xuất</Button>
              <Button size="small" variant="contained" startIcon={<PaymentIcon />} sx={{ bgcolor: '#f39c12', textTransform: 'none' }} onClick={() => setOpenPaymentDialog(true)}>Thu Tiền Nợ</Button>
            </Box>

            {/* BẢNG DỮ LIỆU */}
            <TableContainer sx={{ minHeight: 400 }}>
              <Table sx={{ minWidth: 1100 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={filteredTickets.length > 0 && selectedIds.length === filteredTickets.length} onChange={handleSelectAll} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Thao Tác</TableCell>
                    {['Mã Phiếu', 'Ngày Xuất', 'Đơn vị nhận', 'Lý Do', 'Tổng Tiền', 'Người Lập', 'Trạng Thái'].map((col) => <TableCell key={col} sx={{ fontWeight: 600 }}>{col}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5, color: '#999' }}>Không có dữ liệu phiếu xuất</TableCell></TableRow>
                  ) : (
                    filteredTickets.map((row, index) => {
                      const isCancelled = row.status?.toUpperCase() === 'CANCELLED';
                      const isCompleted = row.status?.toUpperCase() === 'COMPLETED';
                      const isSelected = selectedIds.includes(row.id);

                      return (
                        <TableRow key={row.id} hover selected={isSelected} sx={{ bgcolor: isCancelled ? '#fef2f2' : 'inherit' }}>
                          <TableCell padding="checkbox"><Checkbox size="small" checked={isSelected} onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])} /></TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                          
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Box onClick={() => handleViewDetail(row.id)} sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }} title="Xem chi tiết"><ViewIcon sx={{ fontSize: 14 }} /></Box>
                              {!isCancelled && !isCompleted && <Box onClick={() => setLockConfirm({open: true, id: row.id, code: row.code || `PX${row.id}`})} sx={{ bgcolor: '#f39c12', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }} title="Chốt phiếu xuất"><LockIcon sx={{ fontSize: 14 }} /></Box>}
                              {!isCancelled && !isCompleted && <Box onClick={() => setCancelConfirm({open: true, id: row.id, code: row.code || `PX${row.id}`})} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer' }} title="Hủy phiếu xuất"><CloseIcon sx={{ fontSize: 14 }} /></Box>}
                            </Box>
                          </TableCell>

                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0284c7' }}><span style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{row.code}</span></TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{row.exportDate ? new Date(row.exportDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.customerName || 'Khách lẻ'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{row.reason || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>{formatCurrency(row.totalValue || row.totalAmount)}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{row.createdByName || row.creatorName || row.employeeName || user?.fullName || 'System Admin'}</TableCell>
                          <TableCell>
                            <Chip label={isCompleted ? 'Đã Xuất Kho' : isCancelled ? 'Đã Hủy' : 'Mới Tạo'} size="small" 
                              sx={{ bgcolor: isCompleted ? '#dcfce7' : isCancelled ? '#fef2f2' : '#f1f5f9', color: isCompleted ? '#166534' : isCancelled ? '#b91c1c' : '#475569', fontWeight: 600, borderRadius: 1 }} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* --- MODAL LẬP PHIẾU XUẤT CÓ LOGIC CHẶT CHẼ --- */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#27ae60', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          TẠO PHIẾU XUẤT KHO MỚI <IconButton size="small" onClick={() => setOpenCreate(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: '#f1f5f9' }}>
          <Grid container spacing={2}>
            {/* THÔNG TIN CHUNG */}
            <Grid item xs={12}>
               <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontWeight: 600, color: '#dc2626' }}>Mục đích xuất *</InputLabel>
                      <Select 
                        label="Mục đích xuất *" 
                        value={addFormData.exportType} 
                        onChange={(e) => handleExportTypeChange(e.target.value)}
                        sx={{ bgcolor: '#fff4e5' }}
                      >
                        {EXPORT_TYPES.map(type => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                     <TextField fullWidth size="small" label={addFormData.exportType === 'TRANSFER' ? "Kho/Chi nhánh nhận" : "Khách hàng / Đơn vị nhận"} value={addFormData.customerName} onChange={(e) => setAddFormData({...addFormData, customerName: e.target.value})} placeholder={addFormData.exportType === 'TRANSFER' ? "Nhập tên chi nhánh nhận..." : "Nhập tên khách hàng..."} />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="date" label="Ngày xuất *" value={addFormData.exportDate} onChange={(e) => setAddFormData({ ...addFormData, exportDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* TÌM KIẾM SẢN PHẨM & BẢNG */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}><BusinessIcon color="primary" /><Typography fontWeight={600}>Chi tiết sản phẩm xuất</Typography></Stack>
                
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <TextField fullWidth size="small" placeholder="🔍 Gõ tên hoặc mã SKU sản phẩm để xuất..." value={productSearchKey} onChange={(e) => setProductSearchKey(e.target.value)} />
                  {filteredProducts.length > 0 && (
                    <Paper sx={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 10, maxHeight: 250, overflow: 'auto', mt: 0.5, boxShadow: 3 }}>
                      <List size="small">
                        {filteredProducts.map(p => (
                          <ListItemButton key={p.id} onClick={() => handleAddProduct(p)}>
                            <ListItemText 
                              primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography fontWeight={700}>{p.variantName}</Typography><Typography color="primary">{formatCurrency(getPriceByExportType(p, addFormData.exportType))}</Typography></Box>} 
                              secondary={<Box sx={{ display: 'flex', gap: 2 }}><Chip label={p.sku} size="small" sx={{ height: 20 }} /><Typography variant="caption" sx={{color: p.quantity > 0 ? 'green' : 'red'}}>Tồn kho: {p.quantity || 0}</Typography></Box>} 
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>

                <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 600 } }}>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center" width={150}>Số lượng xuất</TableCell>
                        <TableCell align="right" width={200}>Đơn giá xuất (Hệ thống)</TableCell>
                        <TableCell align="right" width={150}>Thành tiền</TableCell>
                        <TableCell width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {addFormData.items.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa chọn sản phẩm nào</TableCell></TableRow> : 
                        addFormData.items.map((item) => (
                          <TableRow key={item.variantId}>
                            <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography><Typography variant="caption">{item.sku}</Typography></TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <IconButton size="small" onClick={() => handleUpdateQty(item.variantId, Math.max(1, item.quantity - 1))}><RemoveIcon fontSize="small"/></IconButton>
                                <TextField type="number" size="small" value={item.quantity} onChange={(e) => handleUpdateQty(item.variantId, Math.max(1, parseInt(e.target.value)||1))} sx={{ width: 60 }} />
                                <IconButton size="small" onClick={() => handleUpdateQty(item.variantId, item.quantity + 1)}><AddIcon fontSize="small"/></IconButton>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <TextField 
                                type="text" size="small" 
                                value={formatCurrency(item.exportPrice)} 
                                disabled // 🔒 KHÓA GIÁ Ở ĐÂY
                                sx={{ width: 140, bgcolor: '#f1f5f9' }} 
                                inputProps={{ style: { textAlign: 'right', fontWeight: 600, color: '#dc2626' } }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.quantity * item.exportPrice)}</TableCell>
                            <TableCell><IconButton size="small" color="error" onClick={() => setAddFormData(prev => ({...prev, items: prev.items.filter(d => d.variantId !== item.variantId)}))}><CloseIcon fontSize="small" /></IconButton></TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* TỔNG TIỀN */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={7}><Card sx={{ p: 2, height: '100%' }}><TextField fullWidth multiline rows={2} label="Ghi chú thêm" value={addFormData.reason} onChange={(e) => setAddFormData({...addFormData, reason: e.target.value})} /></Card></Grid>
                <Grid item xs={5}>
                  <Card sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Typography variant="h6" fontWeight={700}>TỔNG TIỀN {addFormData.exportType === 'DESTROY' ? 'HAO HỤT' : 'XUẤT'}:</Typography>
                       <Typography variant="h5" color="error.main" fontWeight={800}>{formatCurrency(calculatedTotal)}</Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f1f5f9' }}>
          <Button onClick={() => setOpenCreate(false)} color="inherit">Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ bgcolor: '#27ae60' }}>{submitting ? 'Đang lưu...' : 'Lưu & Xuất Kho'}</Button>
        </DialogActions>
      </Dialog>

      {/* --- CÁC DIALOG CHI TIẾT, HỦY, KHÓA --- */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>Chi Tiết Phiếu Xuất: {selectedTicket?.code}</Typography>
          <IconButton size="small" onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
           {detailLoading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : selectedTicket && (
               <Grid container spacing={2}>
                   <Grid item xs={6}><Typography><b>Đơn vị nhận:</b> {selectedTicket.customerName}</Typography></Grid>
                   <Grid item xs={6}><Typography><b>Ngày xuất:</b> {selectedTicket.exportDate ? new Date(selectedTicket.exportDate).toLocaleDateString('vi-VN') : '-'}</Typography></Grid>
                   <Grid item xs={12}><Typography><b>Lý do xuất:</b> {selectedTicket.reason || '-'}</Typography></Grid>
                   <Grid item xs={12}>
                       <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell>Sản phẩm</TableCell><TableCell align="center">SL</TableCell><TableCell align="right">Đơn giá</TableCell><TableCell align="right">Thành tiền</TableCell></TableRow></TableHead><TableBody>{selectedTicket.details?.map((d: any, idx: number) => (<TableRow key={idx}><TableCell>{d.variantName} <br/><Typography variant="caption">{d.sku}</Typography></TableCell><TableCell align="center">{d.quantity}</TableCell><TableCell align="right">{formatCurrency(d.unitPrice)}</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(d.quantity * d.unitPrice)}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
                   </Grid>
                   <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
                       <Typography variant="h6">Tổng giá trị: <b style={{color: '#dc2626'}}>{formatCurrency(selectedTicket.totalValue || selectedTicket.totalAmount)}</b></Typography>
                   </Grid>
               </Grid>
           )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpenDetail(false)}>Đóng</Button></DialogActions>
      </Dialog>

      <Dialog open={lockConfirm.open} onClose={() => setLockConfirm({...lockConfirm, open: false})} PaperProps={{ sx: { borderRadius: 3, p: 1, width: 400 } }}>
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ bgcolor: '#fff4e5', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}><LockIcon sx={{ fontSize: 40, color: '#f39c12' }} /></Box>
          <Typography variant="h6" fontWeight={700}>Chốt phiếu xuất kho?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Bạn muốn chốt phiếu <b style={{ color: '#0284c7' }}>{lockConfirm.code}</b>? <br/> Hàng sẽ được <b>trừ khỏi kho</b> và không thể sửa đổi hay hủy sau khi chốt.</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setLockConfirm({...lockConfirm, open: false})} sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Bỏ qua</Button>
          <Button variant="contained" onClick={confirmLockAction} sx={{ bgcolor: '#f39c12', borderRadius: 2, px: 3, fontWeight: 600 }}>Xác nhận chốt</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelConfirm.open} onClose={() => setCancelConfirm({ ...cancelConfirm, open: false })} PaperProps={{ sx: { borderRadius: 3, p: 1, width: 400 } }}>
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ bgcolor: '#fef2f2', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}><CloseIcon sx={{ fontSize: 40, color: '#dc2626' }} /></Box>
          <Typography variant="h6" fontWeight={700}>Xác nhận hủy phiếu?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Bạn có chắc chắn muốn hủy phiếu <b style={{ color: '#0284c7' }}>{cancelConfirm.code}</b>? <br/> Hành động này sẽ <b>hoàn lại tồn kho</b> và không thể hoàn tác.</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setCancelConfirm({ open: false, id: null, code: '' })} sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={confirmCancelAction} sx={{ bgcolor: '#dc2626', borderRadius: 2, px: 3, fontWeight: 600 }}>Xác nhận hủy</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};