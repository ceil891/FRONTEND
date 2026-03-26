import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Autocomplete, 
  Paper, InputAdornment, Checkbox, Pagination, Select, MenuItem, Stack,
  List, ListItemButton, ListItemText, Divider
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Save as SaveIcon, 
  Search as SearchIcon, Close as CloseIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, Remove as RemoveIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import { returnTicketAPI, productAPI, supplierAPI, storeAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const ReturnSupplierPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  // --- STATES DỮ LIỆU ---
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<number | string>('');

  // --- MODALS CONTROL ---
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{open: boolean, id: number | null, code: string}>({ open: false, id: null, code: '' });

  // --- FORM STATE ---
  const initialForm = { supplierId: null as number | null, reason: '', details: [] as any[] };
  const [formRequest, setFormRequest] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  // --- 🟢 FETCH API DATA (ĐÃ BỌC THÉP CHỐNG LỖI) 🟢 ---
  const loadCategories = async () => {
    try {
      const [prodRes, supRes, storeRes] = await Promise.all([
        (productAPI?.getAll ? productAPI.getAll() : Promise.resolve({ data: [] })).catch(() => ({ data: [] })),
        (supplierAPI?.getAll ? supplierAPI.getAll() : Promise.resolve({ data: [] })).catch(() => ({ data: [] })),
        (storeAPI?.getAll ? storeAPI.getAll() : Promise.resolve({ data: { data: [] } })).catch(() => ({ data: { data: [] } }))
      ]);
      
      if (supRes?.data?.success || Array.isArray(supRes?.data)) {
         setSuppliers(supRes.data.data || supRes.data || []);
      }
      
      const fetchedStores = storeRes?.data?.data || storeRes.data || [];
      setStores(fetchedStores);
      if (fetchedStores.length > 0 && !currentStoreId) setCurrentStoreId(fetchedStores[0].id);

      const rawProducts = prodRes?.data?.data || prodRes.data || [];
      const allVariants = rawProducts.flatMap((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          return product.variants.map((v: any) => ({
            id: v.id,
            variantName: `${product.name} - ${v.variantName || ''}`.trim(),
            sku: v.sku || 'Chưa có SKU',
            costPrice: v.costPrice || product.baseCostPrice || 0, 
            quantity: v.quantity || 0,
          }));
        }
        return [];
      });
      setProducts(allVariants);
    } catch (error) {
      console.error("Lỗi ngầm khi tải danh mục:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // 🟢 Ép về mảng rỗng nếu API lỗi, không ném ra màn hình nữa
      const res = await (returnTicketAPI?.getAll ? returnTicketAPI.getAll() : Promise.resolve({ data: [] })).catch(() => ({ data: [] }));
      const allTickets = res.data?.data || res.data || [];
      
      if (Array.isArray(allTickets)) {
          const supplierTickets = allTickets.filter((t: any) => t.returnType === 'SUPPLIER_RETURN');
          setTickets(supplierTickets);
      } else {
          setTickets([]);
      }
      setSelectedIds([]);
    } catch (error) {
      console.error("Lỗi ngầm khi tải phiếu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { fetchTickets(); }, []);

  // --- SEARCH & FILTER ---
  const filteredTickets = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return tickets;
    return tickets.filter(p => (p.code || '').toLowerCase().includes(kw) || (p.partnerName || '').toLowerCase().includes(kw));
  }, [tickets, searchQuery]);

  // --- ACTIONS ---
  const handleViewDetail = async (id: number) => {
    try {
      const res = await returnTicketAPI.getById(id);
      setSelectedTicket(res.data?.data || res.data);
      setOpenDetail(true);
    } catch (error) { showToast('Lỗi lấy chi tiết phiếu', 'error'); }
  };

  const confirmCancelAction = async () => {
    if (!cancelConfirm.id) return;
    try {
      await returnTicketAPI.delete(cancelConfirm.id); 
      showToast('Đã hủy phiếu trả hàng thành công', 'success');
      setCancelConfirm({ open: false, id: null, code: '' });
      fetchTickets();
    } catch (error: any) { showToast(error.message || 'Lỗi khi hủy phiếu', 'error'); }
  };

  const handleAddProduct = (prod: any) => {
    setFormRequest(prev => {
      const existing = prev.details.find(d => d.productVariantId === prod.id);
      if (existing) {
        if (existing.quantity + 1 > prod.quantity) {
          showToast(`Tồn kho chỉ còn ${prod.quantity}`, 'warning'); return prev;
        }
        return { ...prev, details: prev.details.map(d => d.productVariantId === prod.id ? { ...d, quantity: d.quantity + 1 } : d) };
      }
      if (prod.quantity <= 0) { showToast(`Sản phẩm ${prod.sku} đã hết tồn kho!`, 'warning'); return prev; }
      
      return { 
        ...prev, 
        details: [...prev.details, { productVariantId: prod.id, variantName: prod.variantName, sku: prod.sku, quantity: 1, returnPrice: prod.costPrice, maxQty: prod.quantity }] 
      };
    });
  };

  const handleUpdateItem = (idx: number, field: string, value: number) => {
    setFormRequest(prev => ({
      ...prev,
      details: prev.details.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  };

  const calculatedTotal = useMemo(() => formRequest.details.reduce((sum, item) => sum + (item.quantity * item.returnPrice), 0), [formRequest.details]);

 const handleSaveReturn = async () => {
    if (!formRequest.supplierId) return showToast("Vui lòng chọn Nhà cung cấp!", "warning");
    if (formRequest.details.length === 0) return showToast("Chưa có sản phẩm nào để trả!", "warning");
    
    // 🟢 THÊM KIỂM TRA XEM ĐÃ CHỌN CỬA HÀNG CHƯA
    if (!currentStoreId) return showToast("Vui lòng chọn chi nhánh cửa hàng!", "warning"); 
    
    try {
      setSubmitting(true);
      const payload = {
        returnType: "SUPPLIER_RETURN", 
        originalDocCode: "",           
        customerId: null,              
        supplierId: Number(formRequest.supplierId), 
        
        // 🟢 BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ TRUYỀN XUỐNG JAVA 🟢
        storeId: Number(currentStoreId), 
        
        reason: formRequest.reason || "Trả hàng NCC",
        paymentMethod: "CASH", 
        createdById: Number(user?.id || 1), 
        details: formRequest.details.map(item => ({
          productVariantId: Number(item.productVariantId), 
          returnQuantity: Number(item.quantity),           
          returnPrice: Number(item.returnPrice),           
          conditionNote: "" 
        }))
      };
      
      await returnTicketAPI.create(payload);
      showToast("Lập phiếu trả hàng thành công!", "success");
      setOpenCreate(false);
      setFormRequest(initialForm);
      fetchTickets();
    } catch (error: any) { 
      showToast(error.response?.data?.message || 'Lỗi hệ thống khi lưu phiếu', "error"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh', pb: 5 }}>
      {/* 🖨️ CSS PRINTING */}
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 15mm; }
          #web-interface { display: none !important; }
          .MuiDialog-root { display: none !important; }
          #printable-invoice { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 8px; }
        `}
      </style>

      <Box id="web-interface" className="fade-in">
        <Box sx={{ bgcolor: '#3498db', color: 'white', p: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Kho vận / Trả hàng Nhà cung cấp</Typography>
          <Select 
            size="small" value={currentStoreId} onChange={(e) => setCurrentStoreId(e.target.value)} 
            displayEmpty sx={{ bgcolor: 'white', color: '#333', fontWeight: 600, borderRadius: '16px', height: '32px', fontSize: '0.85rem', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
          >
            {stores.length === 0 && <MenuItem value="">Đang tải...</MenuItem>}
            {stores.map(s => <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.85rem' }}>{s.name}</MenuItem>)}
          </Select>
        </Box>

        <Box sx={{ px: 3, mb: 2 }}><Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>DANH SÁCH PHIẾU TRẢ HÀNG</Typography></Box>

        <Box sx={{ px: 3 }}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none', mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', gap: 1.5, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField 
                size="small" placeholder="Tìm mã phiếu / Nhà CC..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action"/></InputAdornment> }}
                sx={{ width: 280, bgcolor: 'white', '& .MuiInputBase-root': { borderRadius: '20px'} }}
              />
              <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', textTransform: 'none', borderRadius: '20px', px: 2 }} onClick={() => setOpenCreate(true)}>Lập Phiếu Trả</Button>
              <Button size="small" variant="outlined" startIcon={<PrintIcon />} sx={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none', borderRadius: '20px' }} onClick={() => showToast('Mở chi tiết phiếu để in hóa đơn', 'info')}>In DS</Button>
              <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', textTransform: 'none', borderRadius: '20px' }}>Xuất Excel</Button>
            </Box>

            {/* BẢNG DANH SÁCH */}
            <TableContainer sx={{ minHeight: 400 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell padding="checkbox"><Checkbox size="small" onChange={(e) => e.target.checked ? setSelectedIds(filteredTickets.map(t => t.id)) : setSelectedIds([])} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                    {['Mã Phiếu', 'Ngày Lập', 'Nhà Cung Cấp', 'Lý Do', 'Tổng Giá Trị', 'Người Lập', 'Trạng Thái'].map(col => <TableCell key={col} sx={{ fontWeight: 600 }}>{col}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow> : 
                  filteredTickets.length === 0 ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: '#999' }}>Không có dữ liệu phiếu trả</TableCell></TableRow> : 
                  filteredTickets.map((row) => {
                    const isCancelled = row.status?.toUpperCase() === 'CANCELLED';
                    const isSelected = selectedIds.includes(row.id);
                    return (
                      <TableRow key={row.id} hover selected={isSelected} sx={{ bgcolor: isCancelled ? '#fef2f2' : 'inherit' }}>
                        <TableCell padding="checkbox"><Checkbox size="small" checked={isSelected} onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])} /></TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Box onClick={() => handleViewDetail(row.id)} sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.5, borderRadius: 1, cursor: 'pointer', display: 'flex' }} title="Xem chi tiết"><ViewIcon sx={{ fontSize: 16 }} /></Box>
                            {!isCancelled && <Box onClick={() => setCancelConfirm({open: true, id: row.id, code: row.code})} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.5, borderRadius: 1, cursor: 'pointer', display: 'flex' }} title="Hủy phiếu"><DeleteIcon sx={{ fontSize: 16 }} /></Box>}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}><span style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{row.code}</span></TableCell>
                        <TableCell>{new Date(row.returnDate || row.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.partnerName || row.supplierName}</TableCell>
                        <TableCell>{row.reason || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(row.totalRefundAmount || row.totalAmount)}</TableCell>
                        <TableCell>{row.createdByName || row.creatorName || user?.fullName || 'Admin'}</TableCell>
                        <TableCell><Chip label={isCancelled ? 'Đã Hủy' : 'Hoàn Tất'} size="small" sx={{ bgcolor: isCancelled ? '#fef2f2' : '#dcfce7', color: isCancelled ? '#b91c1c' : '#166534', fontWeight: 600, borderRadius: 1 }} /></TableCell>
                      </TableRow>
                    );
                  })
                  }
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pagination count={1} shape="rounded" color="primary" size="small" />
              <Typography variant="body2" color="textSecondary">Hiển thị {filteredTickets.length} kết quả</Typography>
            </Box>
          </Card>
        </Box>

        {/* DIALOG CREATE CHUYÊN NGHIỆP */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ bgcolor: '#00a65a', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            LẬP PHIẾU TRẢ HÀNG NHÀ CUNG CẤP
            <IconButton size="small" onClick={() => setOpenCreate(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 3, bgcolor: '#f8fafc' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Autocomplete 
                        options={suppliers} getOptionLabel={(o) => o.name || ''} 
                        onChange={(_, v) => setFormRequest({...formRequest, supplierId: v?.id || null})} 
                        renderInput={(p) => <TextField {...p} label="Nhà cung cấp nhận hàng *" size="small" sx={{ bgcolor: 'white' }} />} 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="Lý do trả hàng / Ghi chú" size="small" value={formRequest.reason} onChange={(e) => setFormRequest({...formRequest, reason: e.target.value})} sx={{ bgcolor: 'white' }} />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}><BusinessIcon color="primary" /><Typography fontWeight={700}>CHI TIẾT SẢN PHẨM TRẢ LẠI</Typography></Stack>
                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      options={products} getOptionLabel={(option) => `[${option.sku}] ${option.variantName}`}
                      onChange={(_, newValue) => { if (newValue) handleAddProduct(newValue); }}
                      value={null}
                      renderInput={(params) => <TextField {...params} label="🔍 Tìm tên hoặc mã SKU sản phẩm để thêm vào danh sách trả..." size="small" sx={{ bgcolor: 'white' }} />}
                    />
                  </Box>

                  <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2, maxHeight: 350 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: '#f1f5f9', fontWeight: 700 } }}>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="center" width={160}>Số lượng trả</TableCell>
                          <TableCell align="right" width={180}>Giá trả (VNĐ)</TableCell>
                          <TableCell align="right" width={160}>Thành tiền</TableCell>
                          <TableCell width={50}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formRequest.details.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>Chưa có sản phẩm nào trong danh sách trả</TableCell></TableRow> : 
                          formRequest.details.map((item, i) => (
                            <TableRow key={item.productVariantId}>
                              <TableCell><Typography variant="body2" fontWeight={700}>{item.variantName}</Typography><Typography variant="caption" color="text.secondary">SKU: {item.sku}</Typography></TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                   <IconButton size="small" onClick={() => handleUpdateItem(i, 'quantity', Math.max(1, item.quantity - 1))}><RemoveIcon fontSize="small"/></IconButton>
                                   <TextField type="number" size="small" value={item.quantity} sx={{ width: 65, '& input': { textAlign: 'center' } }} onChange={(e) => handleUpdateItem(i, 'quantity', Math.min(item.maxQty, Math.max(1, parseInt(e.target.value)||1)))} />
                                   <IconButton size="small" onClick={() => handleUpdateItem(i, 'quantity', Math.min(item.maxQty, item.quantity + 1))}><AddIcon fontSize="small"/></IconButton>
                                </Stack>
                              </TableCell>
                              <TableCell align="right"><TextField type="number" size="small" value={item.returnPrice} onChange={(e) => handleUpdateItem(i, 'returnPrice', Math.max(0, parseInt(e.target.value)||0))} sx={{ width: 130 }} /></TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.quantity * item.returnPrice)}</TableCell>
                              <TableCell><IconButton color="error" size="small" onClick={() => setFormRequest(p => ({...p, details: p.details.filter((_, idx) => idx !== i)}))}><CloseIcon fontSize="small" /></IconButton></TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><Typography variant="h6" fontWeight={800}>TỔNG CỘNG HOÀN TIỀN: <span style={{ color: '#dc2626' }}>{formatCurrency(calculatedTotal)}</span></Typography></Box>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f1f5f9' }}>
            <Button onClick={() => setOpenCreate(false)} color="inherit" sx={{ fontWeight: 600 }}>Hủy bỏ</Button>
            <Button variant="contained" onClick={handleSaveReturn} disabled={submitting} sx={{ bgcolor: '#00a65a', fontWeight: 600, px: 4 }}>{submitting ? 'Đang lưu...' : 'Xác nhận & Hoàn tất trả hàng'}</Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG CHI TIẾT VỚI MẪU IN XỊN */}
        <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
           <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
             CHI TIẾT PHIẾU TRẢ HÀNG: {selectedTicket?.code}
             <IconButton onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
           </DialogTitle>
           <DialogContent dividers>
             {selectedTicket && (
               <Grid container spacing={2}>
                 <Grid item xs={6}><Typography><b>Nhà Cung Cấp:</b> {selectedTicket.partnerName}</Typography><Typography sx={{ mt: 1 }}><b>Ngày lập phiếu:</b> {new Date(selectedTicket.returnDate || selectedTicket.createdAt).toLocaleString('vi-VN')}</Typography></Grid>
                 <Grid item xs={6}><Typography><b>Người thực hiện:</b> {selectedTicket.createdByName}</Typography><Typography sx={{ mt: 1 }}><b>Lý do:</b> {selectedTicket.reason || 'Không có'}</Typography></Grid>
                 <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell sx={{fontWeight:700}}>Sản phẩm / SKU</TableCell><TableCell align="center" sx={{fontWeight:700}}>SL</TableCell><TableCell align="right" sx={{fontWeight:700}}>Đơn giá</TableCell><TableCell align="right" sx={{fontWeight:700}}>Thành tiền</TableCell></TableRow></TableHead>
                        <TableBody>
                          {selectedTicket.details?.map((d: any, idx: number) => (<TableRow key={idx}><TableCell>{d.variantName} <br/><small style={{color: '#666'}}>{d.sku}</small></TableCell><TableCell align="center">{d.returnQuantity}</TableCell><TableCell align="right">{formatCurrency(d.returnPrice)}</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(d.returnQuantity * d.returnPrice)}</TableCell></TableRow>))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                 </Grid>
                 <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}><Typography variant="h6">Tổng số tiền NCC hoàn lại: <b style={{color: '#dc2626'}}>{formatCurrency(selectedTicket.totalRefundAmount)}</b></Typography></Grid>
               </Grid>
             )}
           </DialogContent>
           <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
             <Button onClick={() => setOpenDetail(false)} color="inherit" sx={{fontWeight: 600}}>Đóng lại</Button>
             <Button variant="contained" color="info" startIcon={<PrintIcon />} sx={{fontWeight: 600}} onClick={() => window.print()}>In Phiếu Hóa Đơn</Button>
           </DialogActions>
        </Dialog>

        {/* DIALOG HỦY PHIẾU CÓ ICON ĐẸP */}
        <Dialog open={cancelConfirm.open} onClose={() => setCancelConfirm({ ...cancelConfirm, open: false })} PaperProps={{ sx: { borderRadius: 3, width: 400 } }}>
          <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
            <Box sx={{ bgcolor: '#fef2f2', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}><DeleteIcon sx={{ fontSize: 40, color: '#dc2626' }} /></Box>
            <Typography variant="h6" fontWeight={700}>Xác nhận hủy phiếu?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Bạn muốn hủy phiếu trả hàng <b style={{ color: '#0284c7' }}>{cancelConfirm.code}</b>? <br/> Thao tác này sẽ hoàn lại hàng vào tồn kho.</Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 4, gap: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setCancelConfirm({ open: false, id: null, code: '' })} sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Quay lại</Button>
            <Button variant="contained" onClick={confirmCancelAction} sx={{ bgcolor: '#dc2626', borderRadius: 2, px: 3, fontWeight: 600 }}>Xác nhận hủy</Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* 🖨️ MẪU IN HÓA ĐƠN CHUẨN A4 */}
      <Box id="printable-invoice" sx={{ display: 'none' }}>
        {selectedTicket && (
          <Box sx={{ p: 4, fontFamily: 'Times New Roman' }}>
             <Box sx={{ textAlign: 'center', mb: 4 }}>
               <Typography variant="h4" fontWeight={800} sx={{ textTransform: 'uppercase' }}>Phiếu Xuất Trả Hàng</Typography>
               <Typography variant="body1" sx={{ mt: 1 }}>Mã phiếu: <b>{selectedTicket.code}</b></Typography>
               <Typography sx={{ fontStyle: 'italic' }}>Ngày {new Date(selectedTicket.returnDate || selectedTicket.createdAt).getDate()} tháng {new Date(selectedTicket.returnDate || selectedTicket.createdAt).getMonth()+1} năm {new Date(selectedTicket.returnDate || selectedTicket.createdAt).getFullYear()}</Typography>
             </Box>
             <Grid container spacing={2} sx={{ mb: 4 }}>
               <Grid item xs={7}><Typography>Nhà Cung Cấp nhận: <b>{selectedTicket.partnerName}</b></Typography><Typography sx={{ mt: 1 }}>Lý do trả hàng: {selectedTicket.reason || '..........................................................'}</Typography></Grid>
               <Grid item xs={5}><Typography>Người lập phiếu: {selectedTicket.createdByName}</Typography><Typography sx={{ mt: 1 }}>Hình thức hoàn tiền: {selectedTicket.paymentMethod || 'Tiền mặt'}</Typography></Grid>
             </Grid>
             <table>
               <thead><tr style={{ backgroundColor: '#f2f2f2' }}><th>STT</th><th>Tên Sản Phẩm / SKU</th><th style={{textAlign: 'center'}}>SL</th><th style={{textAlign: 'right'}}>Đơn Giá (VNĐ)</th><th style={{textAlign: 'right'}}>Thành Tiền (VNĐ)</th></tr></thead>
               <tbody>
                 {selectedTicket.details?.map((d: any, idx: number) => (<tr key={idx}><td style={{ textAlign: 'center' }}>{idx+1}</td><td>{d.variantName} ({d.sku})</td><td style={{ textAlign: 'center' }}>{d.returnQuantity}</td><td style={{ textAlign: 'right' }}>{formatCurrency(d.returnPrice)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(d.returnQuantity * d.returnPrice)}</td></tr>))}
                 <tr><td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>TỔNG CỘNG HOÀN TIỀN:</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatCurrency(selectedTicket.totalRefundAmount)}</td></tr>
               </tbody>
             </table>
             <Grid container sx={{ mt: 8, textAlign: 'center' }}>
               <Grid item xs={4}><Typography fontWeight={700}>Người lập phiếu</Typography><Typography variant="caption" sx={{ fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</Typography></Grid>
               <Grid item xs={4}><Typography fontWeight={700}>Người đi giao</Typography><Typography variant="caption" sx={{ fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</Typography></Grid>
               <Grid item xs={4}><Typography fontWeight={700}>Đại diện Nhà cung cấp</Typography><Typography variant="caption" sx={{ fontStyle: 'italic' }}>(Ký, đóng dấu)</Typography></Grid>
             </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};