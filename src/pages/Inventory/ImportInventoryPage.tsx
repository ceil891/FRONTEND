import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, IconButton, MenuItem, Select, FormControl, 
  InputLabel, Stack, Paper, ListItemButton, ListItemText
} from '@mui/material';
import {
  Add as AddIcon, Remove as RemoveIcon, Close as CloseIcon,
  Visibility as ViewIcon, Delete as DeleteIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore'; 
import { importTicketAPI, supplierAPI, productAPI, storeAPI } from '../../api/client';

export const ImportInventoryPage: React.FC = () => {
  const { user } = useAuthStore(); 
  const { showToast } = useToastStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [stores, setStores] = useState<any[]>([]); 
  const [currentStoreId, setCurrentStoreId] = useState<number | string>('ALL'); 
  
  const [openDetail, setOpenDetail] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [addFormData, setAddFormData] = useState({ 
    supplierId: '', 
    storeId: '' as number | string, 
    importDate: new Date().toISOString().split('T')[0], 
    paidAmount: 0, 
    paymentMethod: 'CASH', 
    items: [] as any[] 
  });
  const [productSearchKey, setProductSearchKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // TÁCH LOGIC LOAD SẢN PHẨM: Để có thể gọi lại khi đổi Nhà cung cấp
  const loadProductsBySupplier = async (supplierId?: string | number) => {
    try {
      // Gọi API với param supplierId nếu có
      const params = supplierId ? { supplierId } : {};
      const prodRes = await productAPI.getAll(params);
      const rawProducts = prodRes.data?.data || prodRes.data || [];
      
      const allVariants = rawProducts.flatMap((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          return product.variants.map((v: any) => ({
            ...v,
            variantName: `${product.name} (${[v.colorName, v.sizeName].filter(Boolean).join(' - ')})`,
            costPrice: v.costPrice || product.baseCostPrice || 0 
          }));
        }
        return [];
      });
      setProducts(allVariants);
    } catch (error) {
      console.error("Lỗi tải sản phẩm theo NCC", error);
    }
  };

  const loadCategories = async () => {
    try {
      const [supRes, storeRes] = await Promise.all([
        supplierAPI.getAll(), storeAPI.getAll()
      ]);
      const fetchedSuppliers = supRes.data?.data || supRes.data || [];
      const fetchedStores = storeRes.data?.data || storeRes.data || [];
      
      setSuppliers(fetchedSuppliers);
      setStores(fetchedStores);

      if (fetchedStores.length > 0) {
        const defaultStore = currentStoreId === 'ALL' ? fetchedStores[0].id : currentStoreId;
        setAddFormData(prev => ({ ...prev, storeId: defaultStore }));
      }
      
      // Load sản phẩm ban đầu (tất cả)
      void loadProductsBySupplier();
    } catch (error) { 
      showToast('Lỗi tải danh mục', 'error'); 
    }
  };

  const fetchImportTickets = async () => {
    setLoading(true);
    try {
      const params = currentStoreId === 'ALL' ? {} : { storeId: currentStoreId };
      const res = await importTicketAPI.getAll(params);
      let rawData = res.data?.data || res.data || [];
      
      if (currentStoreId !== 'ALL') {
        rawData = rawData.filter((t: any) => Number(t.storeId) === Number(currentStoreId));
      }

      const visibleTickets = rawData.filter((t: any) => {
        const status = (t.status || '').toUpperCase();
        return status !== 'CANCELLED' && status !== 'DELETED';
      });
      setImports(visibleTickets);
    } catch (error) {
      showToast('Lỗi tải danh sách phiếu nhập', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCategories(); }, []);
  useEffect(() => { void fetchImportTickets(); }, [currentStoreId]);

  // EFFECT: Khi supplierId trong form thay đổi, tải lại danh sách sản phẩm tương ứng
  useEffect(() => {
    if (openAddDialog) {
        void loadProductsBySupplier(addFormData.supplierId);
    }
  }, [addFormData.supplierId, openAddDialog]);

  const handleDeleteTicket = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiếu nhập này không?')) return;
    try {
      setLoading(true);
      await importTicketAPI.cancel(id); 
      setImports((prevImports) => prevImports.filter(ticket => ticket.id !== id));
      showToast('Hủy phiếu nhập thành công!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi hủy phiếu', 'error');
      fetchImportTickets(); 
    } finally {
      setLoading(false);
    }
  };

  const calculatedAmounts = useMemo(() => {
    const total = addFormData.items.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0);
    return { 
        totalAmount: total, 
        paidAmount: Number(addFormData.paidAmount) || 0, 
        debtAmount: Math.max(0, total - Number(addFormData.paidAmount)) 
    };
  }, [addFormData.items, addFormData.paidAmount]);

  const handleSaveImportTicket = async () => {
    if (!addFormData.supplierId || !addFormData.storeId || addFormData.items.length === 0) {
      return showToast('Vui lòng chọn NCC, Cửa hàng và ít nhất 1 sản phẩm', 'warning');
    }
    
    setSubmitting(true);
    try {
      const payload = {
        supplierId: Number(addFormData.supplierId), 
        storeId: Number(addFormData.storeId),
        importDate: addFormData.importDate, 
        paidAmount: calculatedAmounts.paidAmount, 
        paymentMethod: addFormData.paymentMethod,
        createdById: user?.id,
        details: addFormData.items.map(i => ({ productVariantId: i.variantId, quantity: i.quantity, unitPrice: i.importPrice }))
      };
      await importTicketAPI.create(payload);
      showToast('Nhập hàng thành công!', 'success');
      setOpenAddDialog(false);
      
      setAddFormData({
        supplierId: '', 
        storeId: addFormData.storeId, 
        importDate: new Date().toISOString().split('T')[0], 
        paidAmount: 0, 
        paymentMethod: 'CASH', 
        items: [] 
      });
      fetchImportTickets(); 
    } catch (error: any) {
      showToast(error.message || 'Lỗi lưu phiếu nhập', 'error');
    } finally { 
      setSubmitting(false);
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ bgcolor: '#3498db', color: 'white', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>Kho vận / Nhập hàng</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">Cửa hàng đang xem:</Typography>
          <Select 
            size="small" 
            value={currentStoreId} 
            onChange={e => setCurrentStoreId(e.target.value)}
            sx={{ bgcolor: 'white', height: 32, borderRadius: '16px', minWidth: 180 }}
          >
            <MenuItem value="ALL">Tất cả chi nhánh</MenuItem>
            {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </Stack>
      </Box>

      <Box sx={{ px: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField size="small" placeholder="Tìm mã phiếu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} sx={{ width: 280 }} />
            <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setOpenAddDialog(true)} 
                sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' } }}
            >
              Lập Phiếu Nhập
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell align="center">Thao Tác</TableCell>
                  <TableCell>Mã Phiếu</TableCell>
                  <TableCell>Cửa Hàng Nhập</TableCell>
                  <TableCell>Nhà Cung Cấp</TableCell>
                  <TableCell align="right">Tổng Tiền</TableCell>
                  <TableCell align="center">Trạng Thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24}/></TableCell></TableRow>
                ) : (
                  imports.filter(i => (i.code||'').toLowerCase().includes(searchQuery.toLowerCase())).map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton size="small" color="info" onClick={() => { setSelectedTicket(row); setOpenDetail(true); }} disabled={loading}><ViewIcon fontSize="inherit"/></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteTicket(row.id)} disabled={loading}><DeleteIcon fontSize="inherit"/></IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{row.code}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <StoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{row.storeName || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.supplierName}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row.totalAmount)}</TableCell>
                      <TableCell align="center">
                        <Chip label={row.debtAmount > 0 ? "Nợ NCC" : "Đã trả đủ"} size="small" sx={{ bgcolor: row.debtAmount > 0 ? '#fee2e2' : '#dcfce7', color: row.debtAmount > 0 ? '#b91c1c' : '#166534', fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <Dialog open={openAddDialog} onClose={() => !submitting && setOpenAddDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00a65a', color: 'white', fontWeight: 700 }}>TẠO PHIẾU NHẬP KHO MỚI</DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                  <Stack spacing={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Cửa hàng nhận hàng *</InputLabel>
                      <Select label="Cửa hàng nhận hàng *" value={addFormData.storeId} onChange={e => setAddFormData({...addFormData, storeId: e.target.value})}>
                        {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Nhà cung cấp *</InputLabel>
                      <Select 
                        label="Nhà cung cấp *" 
                        value={addFormData.supplierId} 
                        onChange={e => {
                            const val = e.target.value;
                            setAddFormData({...addFormData, supplierId: val, items: []}); // Reset items khi đổi NCC để tránh nhầm lẫn
                        }}
                      >
                        {suppliers.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField fullWidth size="small" type="date" label="Ngày nhập" value={addFormData.importDate} onChange={e => setAddFormData({...addFormData, importDate: e.target.value})} InputLabelProps={{shrink:true}} />
                  </Stack>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField 
                    fullWidth 
                    size="small" 
                    placeholder={addFormData.supplierId ? "Tìm sản phẩm của nhà cung cấp này..." : "Vui lòng chọn NCC trước khi tìm sản phẩm"} 
                    value={productSearchKey} 
                    onChange={e => setProductSearchKey(e.target.value)} 
                    disabled={!addFormData.supplierId}
                    sx={{mb:1}}
                />
                {productSearchKey && (
                    <Paper sx={{maxHeight: 200, overflow:'auto', mb: 2, position: 'absolute', zIndex: 10, width: '55%', boxShadow: 3}}>
                      {products.filter(p => p.variantName.toLowerCase().includes(productSearchKey.toLowerCase())).map(p => (
                        <ListItemButton key={p.id} onClick={() => {
                          const exist = addFormData.items.find(i => i.variantId === p.id);
                          if(exist) {
                            setAddFormData({...addFormData, items: addFormData.items.map(it => it.variantId === p.id ? {...it, quantity: it.quantity + 1} : it)});
                          } else {
                            setAddFormData({...addFormData, items: [...addFormData.items, {variantId: p.id, name: p.variantName, quantity: 1, importPrice: p.costPrice}]});
                          }
                          setProductSearchKey('');
                        }}>
                          <ListItemText primary={p.variantName} secondary={`Giá nhập: ${formatCurrency(p.costPrice)}`}/>
                        </ListItemButton>
                      ))}
                    </Paper>
                  )}
                  <TableContainer component={Paper} variant="outlined" sx={{ minHeight: 200 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="center" width={150}>Số lượng</TableCell>
                            <TableCell align="right">Thành tiền</TableCell>
                            <TableCell width={50}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {addFormData.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                            <TableCell align="center">
                                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                                    <IconButton size="small" color="primary" onClick={() => setAddFormData({...addFormData, items: addFormData.items.map((it, idx) => idx === i ? {...it, quantity: Math.max(1, it.quantity - 1)} : it)})}><RemoveIcon fontSize="small"/></IconButton>
                                    <TextField
                                      size="small"
                                      value={item.quantity}
                                      onChange={(e) => {
                                          const val = parseInt(e.target.value) || 1;
                                          setAddFormData({...addFormData, items: addFormData.items.map((it, idx) => idx === i ? { ...it, quantity: val } : it)});
                                      }}
                                      inputProps={{ style: { textAlign: 'center', width: '40px', fontWeight: 700 }, type: 'number' }}
                                      variant="standard"
                                      sx={{"& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { display: "none" }, "& input[type=number]": { MozAppearance: "textfield" }}}
                                    />
                                    <IconButton size="small" color="primary" onClick={() => setAddFormData({...addFormData, items: addFormData.items.map((it, idx) => idx === i ? {...it, quantity: it.quantity + 1} : it)})}><AddIcon fontSize="small"/></IconButton>
                                </Stack>
                            </TableCell>
                            <TableCell align="right">{formatCurrency(item.quantity * item.importPrice)}</TableCell>
                            <TableCell><IconButton size="small" color="error" onClick={() => setAddFormData({...addFormData, items: addFormData.items.filter((_, idx) => idx !== i)})}><DeleteIcon fontSize="small"/></IconButton></TableCell>
                          </TableRow>
                        ))}
                        {addFormData.items.length === 0 && (
                          <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>Chưa chọn sản phẩm nào.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={700}>TỔNG CỘNG:</Typography>
                        <Typography variant="h5" fontWeight={900} color="error">{formatCurrency(calculatedAmounts.totalAmount)}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                          <TextField label="Tiền đã trả NCC" size="small" type="number" fullWidth sx={{ bgcolor: 'white' }} value={addFormData.paidAmount} onChange={e => setAddFormData({...addFormData, paidAmount: Number(e.target.value)})} />
                          <Select size="small" fullWidth sx={{ bgcolor: 'white' }} value={addFormData.paymentMethod} onChange={e => setAddFormData({...addFormData, paymentMethod: e.target.value})}>
                            <MenuItem value="CASH">Tiền mặt</MenuItem><MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
                          </Select>
                      </Stack>
                  </Box>
              </Grid>
            </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenAddDialog(false)} disabled={submitting}>Đóng</Button>
          <Button variant="contained" color="success" size="large" onClick={handleSaveImportTicket} disabled={submitting || addFormData.items.length === 0} sx={{ px: 4, fontWeight: 700 }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'XÁC NHẬN & NHẬP KHO'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CHI TIẾT PHIẾU NHẬP (Giữ nguyên) */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          CHI TIẾT PHIẾU: {selectedTicket?.code}
          <IconButton onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTicket && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">NCC: <b>{selectedTicket.supplierName}</b></Typography>
                <Typography variant="subtitle2">Cửa hàng: <b>{selectedTicket.storeName}</b></Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="subtitle2">Ngày nhập: <b>{new Date(selectedTicket.importDate).toLocaleDateString()}</b></Typography>
                <Typography variant="subtitle2">Trạng thái: <b>{selectedTicket.debtAmount > 0 ? 'Còn nợ' : 'Đã thanh toán'}</b></Typography>
              </Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center">SL</TableCell>
                        <TableCell align="right">Giá nhập</TableCell>
                        <TableCell align="right">Tổng</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedTicket.details || []).map((d: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{d.productVariantName || 'Sản phẩm'}</TableCell>
                          <TableCell align="center">{d.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(d.unitPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(d.quantity * d.unitPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                   <Typography variant="h6">Tổng thanh toán: <b>{formatCurrency(selectedTicket.totalAmount)}</b></Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};