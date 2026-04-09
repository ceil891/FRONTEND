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
  Visibility as ViewIcon, Delete as DeleteIcon
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
  const [currentStoreId, setCurrentStoreId] = useState<number | string>(''); 
  
  // Dialog States
  const [openDetail, setOpenDetail] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [addFormData, setAddFormData] = useState({ 
    supplierId: '', 
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

  const loadCategories = async () => {
    try {
      const [supRes, prodRes, storeRes] = await Promise.all([
        supplierAPI.getAll(), productAPI.getAll(), storeAPI.getAll()
      ]);
      setSuppliers(supRes.data?.data || supRes.data || []);
      const fetchedStores = storeRes.data?.data || storeRes.data || [];
      setStores(fetchedStores);
      if (fetchedStores.length > 0 && !currentStoreId) setCurrentStoreId(fetchedStores[0].id);

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
    } catch (error) { showToast('Lỗi tải danh mục', 'error'); }
  };

const fetchImportTickets = async () => {
    if (!currentStoreId) return;
    try {
      setLoading(true);
      const res = await importTicketAPI.getAll({ storeId: currentStoreId });
      
      // Lấy data an toàn
      const rawData = res.data?.data || res.data || [];
      
      if (Array.isArray(rawData)) {
        // 🟢 CẢI TIẾN: Lọc bỏ không phân biệt hoa thường và kiểm tra kỹ giá trị
        const visibleTickets = rawData.filter((t: any) => {
          // Nếu status là null/undefined hoặc không phải 'CANCELLED' (viết hoa/thường) thì giữ lại
          const status = (t.status || '').toUpperCase();
          return status !== 'CANCELLED' && status !== 'DELETED';
        });
        
        setImports(visibleTickets);
      }
    } catch (error) {
      showToast('Lỗi tải danh sách phiếu nhập', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCategories(); }, []);
  useEffect(() => { void fetchImportTickets(); }, [currentStoreId]);

  const calculatedAmounts = useMemo(() => {
    const total = addFormData.items.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0);
    return { 
        totalAmount: total, 
        paidAmount: Number(addFormData.paidAmount) || 0, 
        debtAmount: Math.max(0, total - Number(addFormData.paidAmount)) 
    };
  }, [addFormData.items, addFormData.paidAmount]);

  const handleSaveImportTicket = async () => {
    if (!addFormData.supplierId || addFormData.items.length === 0) return showToast('Vui lòng chọn NCC và sản phẩm', 'warning');
    try {
      setSubmitting(true);
      const payload = {
        supplierId: Number(addFormData.supplierId), 
        storeId: Number(currentStoreId),
        importDate: addFormData.importDate, 
        paidAmount: calculatedAmounts.paidAmount, 
        paymentMethod: addFormData.paymentMethod,
        createdById: user?.id,
        details: addFormData.items.map(i => ({ productVariantId: i.variantId, quantity: i.quantity, unitPrice: i.importPrice }))
      };
      await importTicketAPI.create(payload);
      showToast('Nhập hàng thành công!', 'success');
      setOpenAddDialog(false);
      setAddFormData({ supplierId: '', importDate: new Date().toISOString().split('T')[0], paidAmount: 0, paymentMethod: 'CASH', items: [] });
      fetchImportTickets(); 
    } catch (error: any) {
      showToast(error.message || 'Lỗi hệ thống', 'error');
    } finally { setSubmitting(false); }
  };

const handleDeleteTicket = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) return;
    
    try {
      setLoading(true);
      await importTicketAPI.cancel(id); 
      
      showToast('Đã xóa phiếu thành công!', 'success');
      
      // 🟢 CHIÊU NÀY QUAN TRỌNG: Cập nhật State ngay lập tức tại chỗ
      setImports(prev => prev.filter(ticket => ticket.id !== id));

    } catch (error: any) {
      // Nếu có lỗi thật sự từ Backend mới báo lỗi và tải lại data
      showToast(error.message || 'Không thể xóa phiếu này', 'error');
      fetchImportTickets(); 
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ bgcolor: '#3498db', color: 'white', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>Kho vận / Nhập hàng</Typography>
        <Select size="small" value={currentStoreId} onChange={e => setCurrentStoreId(e.target.value)} sx={{ bgcolor: 'white', height: 32, borderRadius: '16px' }}>
          {stores.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </Select>
      </Box>

      <Box sx={{ px: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField size="small" placeholder="Tìm mã phiếu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} sx={{ width: 280 }} />
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} sx={{ bgcolor: '#00a65a' }}>Lập Phiếu Nhập</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell align="center">Thao Tác</TableCell>
                  <TableCell>Mã Phiếu</TableCell>
                  <TableCell>Ngày Nhập</TableCell>
                  <TableCell>Nhà Cung Cấp</TableCell>
                  <TableCell>Tổng Tiền</TableCell>
                  <TableCell>Đã Trả</TableCell>
                  <TableCell>Công Nợ</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={9} align="center"><CircularProgress size={24}/></TableCell></TableRow> :
                  imports.filter(i => (i.code||'').includes(searchQuery)).map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton size="small" color="info" onClick={() => { setSelectedTicket(row); setOpenDetail(true); }}><ViewIcon fontSize="inherit"/></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteTicket(row.id)}><DeleteIcon fontSize="inherit"/></IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{row.code}</TableCell>
                      <TableCell>{row.importDate ? new Date(row.importDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{row.supplierName}</TableCell>
                      <TableCell fontWeight={700}>{formatCurrency(row.totalAmount)}</TableCell>
                      <TableCell color="success.main">{formatCurrency(row.paidAmount)}</TableCell>
                      <TableCell color="error.main" fontWeight={700}>{formatCurrency(row.debtAmount)}</TableCell>
                      <TableCell>
                        {row.debtAmount > 0 
                          ? <Chip label="Ghi nợ" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />
                          : <Chip label="Thanh toán" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                        }
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* DIALOG LẬP PHIẾU NHẬP MỚI */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00a65a', color: 'white', fontWeight: 700 }}>TẠO PHIẾU NHẬP KHO MỚI</DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
           <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                  <Stack spacing={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>NCC *</InputLabel>
                      <Select label="NCC *" value={addFormData.supplierId} onChange={e => setAddFormData({...addFormData, supplierId: e.target.value})}>
                        {suppliers.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField fullWidth size="small" type="date" label="Ngày nhập *" value={addFormData.importDate} onChange={e => setAddFormData({...addFormData, importDate: e.target.value})} InputLabelProps={{shrink:true}} />
                  </Stack>
              </Grid>
              <Grid item xs={12} md={8}>
                  <TextField fullWidth size="small" placeholder="Tìm sản phẩm..." value={productSearchKey} onChange={e => setProductSearchKey(e.target.value)} sx={{mb:1}}/>
                  {productSearchKey && (
                    <Paper sx={{maxHeight: 200, overflow:'auto', mb: 2, position: 'absolute', zIndex: 10, width: '55%'}}>
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
                          <ListItemText primary={p.variantName} secondary={formatCurrency(p.costPrice)}/>
                        </ListItemButton>
                      ))}
                    </Paper>
                  )}
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow><TableCell>Sản phẩm</TableCell><TableCell align="center" width={180}>Số lượng</TableCell><TableCell align="right">Tổng</TableCell><TableCell></TableCell></TableRow></TableHead>
                      <TableBody>
                        {addFormData.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="center">
                                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                                    <IconButton size="small" onClick={() => setAddFormData({...addFormData, items: addFormData.items.map((it, idx) => idx === i ? {...it, quantity: Math.max(1, it.quantity - 1)} : it)})}><RemoveIcon fontSize="small"/></IconButton>
                                    <TextField 
                                      size="small" 
                                      value={item.quantity} 
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setAddFormData({...addFormData, items: addFormData.items.map((it, idx) => idx === i ? {...it, quantity: val} : it)});
                                      }}
                                      inputProps={{ style: { textAlign: 'center', fontWeight: 700, width: '60px' } }}
                                    />
                                    <IconButton size="small" onClick={() => setAddFormData({...addFormData, items: addFormData.items.map((it, idx) => idx === i ? {...it, quantity: it.quantity + 1} : it)})}><AddIcon fontSize="small"/></IconButton>
                                </Stack>
                            </TableCell>
                            <TableCell align="right">{formatCurrency(item.quantity * item.importPrice)}</TableCell>
                            <TableCell><IconButton size="small" color="error" onClick={() => setAddFormData({...addFormData, items: addFormData.items.filter((_, idx) => idx !== i)})}><DeleteIcon fontSize="small"/></IconButton></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Typography variant="h6">Tổng tiền: <b style={{color: 'red'}}>{formatCurrency(calculatedAmounts.totalAmount)}</b></Typography>
                      <Stack direction="row" spacing={2} mt={1}>
                          <TextField label="Thanh toán" size="small" type="number" value={addFormData.paidAmount} onChange={e => setAddFormData({...addFormData, paidAmount: Number(e.target.value)})} />
                          <Select size="small" value={addFormData.paymentMethod} onChange={e => setAddFormData({...addFormData, paymentMethod: e.target.value})}>
                            <MenuItem value="CASH">Tiền mặt</MenuItem><MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
                          </Select>
                      </Stack>
                  </Box>
              </Grid>
           </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleSaveImportTicket} disabled={submitting}>Hoàn tất & Nhập kho</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CHI TIẾT */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          CHI TIẾT PHIẾU: {selectedTicket?.code}
          <IconButton onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTicket && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="subtitle2">NCC: <b>{selectedTicket.supplierName}</b></Typography></Grid>
              <Grid item xs={6} textAlign="right"><Typography variant="subtitle2">Ngày: <b>{new Date(selectedTicket.importDate).toLocaleDateString()}</b></Typography></Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow><TableCell>Sản phẩm</TableCell><TableCell align="center">SL</TableCell><TableCell align="right">Giá nhập</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedTicket.details || []).map((d: any, i: number) => (
                        <TableRow key={i}><TableCell>{d.productVariantName || 'Sản phẩm'}</TableCell><TableCell align="center">{d.quantity}</TableCell><TableCell align="right">{formatCurrency(d.unitPrice)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};