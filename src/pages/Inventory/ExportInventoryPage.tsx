import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, CircularProgress, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Autocomplete, Paper, InputAdornment, Divider, Select, MenuItem, Stack
} from '@mui/material';
import {
  Add as AddIcon, Print as PrintIcon, FileDownload as ExcelIcon, 
  Visibility as ViewIcon, Close as CloseIcon, 
  Search as SearchIcon, Payments as PaymentIcon, FilterAlt as FilterIcon
} from '@mui/icons-material';
import { exportTicketAPI, productAPI, storeAPI, customerAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

// 👇 TÊN CHUẨN LÀ ExportInventoryPage NHÉ!
export const ExportInventoryPage: React.FC = () => {
  // --- STATES QUẢN LÝ DỮ LIỆU CHÍNH ---
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // --- STATES API & HEADER ---
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<number | string>('');

  // --- STATES MODALS ---
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const { showToast } = useToastStore();

  const [formRequest, setFormRequest] = useState({
    reason: '', 
    customerName: '', 
    storeId: null as number | null, 
    createdById: 1, 
    details: [] as any[]
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  // --- LẤY DỮ LIỆU TỪ BACKEND ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketRes, prodRes, storeRes, custRes] = await Promise.all([
        exportTicketAPI.getAll(),
        productAPI.getAll(),
        storeAPI.getAll(),
        customerAPI.getAll()
      ]);
      
      if (ticketRes.data?.success) setTickets(ticketRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data);
      
      const rawProducts = prodRes.data?.data || prodRes.data || [];
      const allVariants: any[] = [];
      rawProducts.forEach((p: any) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            allVariants.push({
              id: v.id,
              variantName: `${p.name} - ${v.variantName}`,
              sku: v.sku || 'Chưa có SKU',
              price: v.baseRetailPrice || p.baseRetailPrice || 0, 
              quantity: v.quantity || 0,
            });
          });
        }
      });
      setProducts(allVariants);

      const fetchedStores = storeRes.data?.data || storeRes.data || [];
      setStores(fetchedStores);
      if (fetchedStores.length > 0) {
        setCurrentStoreId(fetchedStores[0].id);
      }
    } catch (error) {
      showToast('Lỗi tải dữ liệu xuất hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC TÌM KIẾM & LỌC ---
  const filteredTickets = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return tickets;
    return tickets.filter(p => 
      (p.code || '').toLowerCase().includes(kw) || 
      (p.customerName || '').toLowerCase().includes(kw)
    );
  }, [tickets, searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredTickets.map(i => i.id));
    else setSelectedIds([]);
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) return showToast('Vui lòng chọn ít nhất một phiếu để in.', 'warning');
    showToast(`Chuẩn bị in ${selectedIds.length} phiếu...`, 'info');
    setTimeout(() => { window.print(); }, 500);
  };

  const handleExportExcel = () => {
    if (selectedIds.length === 0 && tickets.length === 0) return showToast('Không có dữ liệu để xuất.', 'warning');
    showToast('Đang tạo file Excel...', 'info');
  };

  const handleOpenPayment = () => {
    setOpenPaymentDialog(true);
  };

  const handleCancelTicket = async (id: number, code?: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy phiếu xuất ${code || id}? (Sẽ hoàn lại tồn kho)`)) {
      try {
        await exportTicketAPI.cancel(id);
        showToast('Hủy phiếu xuất thành công', 'success');
        fetchData();
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi hủy phiếu', 'error');
      }
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const res = await exportTicketAPI.getById(id);
      setSelectedTicket(res.data?.data || res.data);
      setOpenDetail(true);
    } catch (error) {
      showToast('Lỗi khi lấy chi tiết phiếu', 'error');
    }
  };

  // --- LOGIC FORM XUẤT HÀNG MỚI ---
  const handleAddProduct = (product: any) => {
    if (!product) return;
    if (product.quantity <= 0) {
       return showToast(`Sản phẩm [${product.sku}] đã hết hàng trong kho!`, 'warning');
    }
    if (formRequest.details.some(d => d.productVariantId === product.id)) {
       return showToast("Sản phẩm này đã được thêm vào danh sách!", "info");
    }

    setFormRequest({
      ...formRequest,
      details: [...formRequest.details, {
        productVariantId: product.id,
        variantName: product.variantName,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price || 0,
        maxQty: product.quantity,
        total: product.price || 0
      }]
    });
  };

  const handleUpdateQty = (id: number, qty: number) => {
    setFormRequest({
      ...formRequest,
      details: formRequest.details.map(d => d.productVariantId === id ? { ...d, quantity: qty, total: qty * d.unitPrice } : d)
    });
  };

  const handleSave = async () => {
    if (!currentStoreId) return showToast("Vui lòng chọn cửa hàng trên Header!", "warning");
    if (!formRequest.storeId) return showToast("Vui lòng chọn kho xuất hàng trong form!", "warning");
    if (formRequest.details.length === 0) return showToast("Chưa chọn sản phẩm để xuất!", "warning");
    
    try {
      const payload = { ...formRequest, storeId: currentStoreId }; 
      const res = await exportTicketAPI.create(payload);
      if (res.data?.success || res.data) {
        showToast("Lập phiếu xuất thành công!", "success");
        setOpenCreate(false);
        setFormRequest({ reason: '', customerName: '', storeId: null, createdById: 1, details: [] });
        fetchData();
      }
    } catch (error: any) { 
      showToast(error.response?.data?.message || "Lỗi lưu phiếu", "error"); 
    }
  };

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh', pb: 5 }}>
      {/* --- HEADER CHUNG --- */}
      <Box sx={{ bgcolor: '#3498db', color: 'white', p: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Kho vận / Xuất hàng</Typography>
        
        <Select
          size="small"
          value={currentStoreId}
          onChange={(e) => setCurrentStoreId(e.target.value)}
          displayEmpty
          sx={{ 
            bgcolor: 'white', color: '#333', fontWeight: 600, borderRadius: '16px', height: '32px', fontSize: '0.85rem',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, 
            '& .MuiSelect-select': { py: 0.5, px: 2 },
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {stores.length === 0 && <MenuItem value="">Đang tải...</MenuItem>}
          {stores.map(store => (
            <MenuItem key={store.id} value={store.id} sx={{ fontSize: '0.85rem' }}>{store.name}</MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ px: 3, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH PHIẾU XUẤT HÀNG
        </Typography>
      </Box>

      <Box sx={{ px: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            
            {/* --- TOOLBAR --- */}
            <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField 
                size="small" placeholder="Tìm: Mã phiếu / Khách hàng..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action"/></InputAdornment> }}
                sx={{ width: 280, bgcolor: 'white', '& .MuiInputBase-root': { borderRadius: '20px'} }}
              />
              <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#27ae60', '&:hover': {bgcolor: '#219150'}, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => setOpenCreate(true)}>Lập Phiếu Xuất</Button>
              <Button size="small" variant="contained" startIcon={<PaymentIcon />} sx={{ bgcolor: '#f39c12', '&:hover': {bgcolor: '#e67e22'}, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={handleOpenPayment}>Thu Tiền Nợ</Button>
              <Button size="small" variant="outlined" startIcon={<PrintIcon />} sx={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none', borderRadius: 1 }} onClick={handlePrint}>In DS {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</Button>
              <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#2980b9', '&:hover': {bgcolor: '#1f6391'}, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={handleExportExcel}>Xuất Excel</Button>
            </Box>

            {/* --- BẢNG DỮ LIỆU CHÍNH --- */}
            <TableContainer sx={{ minHeight: 400 }}>
              <Table sx={{ minWidth: 1000 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ borderBottom: '2px solid #f1f5f9' }}>
                      <Checkbox 
                        size="small" 
                        checked={filteredTickets.length > 0 && selectedIds.length === filteredTickets.length}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < filteredTickets.length}
                        onChange={handleSelectAll} 
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                    <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                    {['Mã Phiếu', 'Ngày Xuất', 'Khách Hàng', 'Lý Do', 'Tổng Tiền', 'Trạng Thái'].map((col) => (
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
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 8, color: '#999' }}>Không có dữ liệu phiếu xuất</TableCell></TableRow>
                  ) : (
                    filteredTickets.map((row, index) => {
                      const isCancelled = row.status?.toUpperCase() === 'CANCELLED';
                      const isSelected = selectedIds.includes(row.id);

                      return (
                        <TableRow key={row.id} hover selected={isSelected} sx={{ bgcolor: isCancelled ? '#fef2f2' : 'inherit', '&:last-child td': { border: 0 } }}>
                          <TableCell padding="checkbox">
                            <Checkbox size="small" checked={isSelected} onChange={() => handleSelectRow(row.id)} />
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              <Box onClick={() => handleViewDetail(row.id)} sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Xem chi tiết">
                                <ViewIcon sx={{ fontSize: 14 }} />
                              </Box>
                              {!isCancelled && (
                                <Box onClick={() => handleCancelTicket(row.id, row.code)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Hủy phiếu">
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, fontWeight: 600, color: '#0284c7' }}>
                            <span style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{row.code}</span>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#475569' }}>{row.exportDate ? new Date(row.exportDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#0f172a', fontWeight: 600 }}>{row.customerName || 'Khách lẻ'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#475569' }}>{row.reason || '-'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(row.totalValue || row.totalAmount)}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                            <Chip label={row.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'} size="small" 
                              sx={{ bgcolor: row.status === 'COMPLETED' ? '#dcfce7' : '#fef2f2', color: row.status === 'COMPLETED' ? '#166534' : '#b91c1c', fontWeight: 600, borderRadius: 1, border: 'none' }} />
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
                {loading ? 'Đang tải...' : `Hiển thị ${filteredTickets.length} kết quả`}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* --- MODAL LẬP PHIẾU XUẤT --- */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#27ae60', color: 'white', py: 1.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          TẠO PHIẾU XUẤT KHO MỚI
          <IconButton size="small" onClick={() => setOpenCreate(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f1f5f9', pt: 3 }}>
          <Grid container spacing={2}>
            {/* THÔNG TIN CHUNG */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#333' }}>THÔNG TIN GIAO DỊCH</Typography>
                <Autocomplete
                  options={stores} getOptionLabel={(opt) => opt.name}
                  onChange={(_, val) => setFormRequest({...formRequest, storeId: val?.id || null})}
                  renderInput={(params) => <TextField {...params} label="Kho xuất hàng *" size="small" fullWidth sx={{ mb: 2 }} />}
                />
                <Autocomplete
                  freeSolo options={customers} getOptionLabel={(opt) => opt.fullName || opt}
                  onInputChange={(_, val) => setFormRequest({...formRequest, customerName: val})}
                  renderInput={(params) => <TextField {...params} label="Tên khách / Đơn vị nhận" size="small" fullWidth sx={{ mb: 2 }} />}
                />
                <TextField fullWidth label="Lý do xuất" size="small" multiline rows={3} onChange={(e) => setFormRequest({...formRequest, reason: e.target.value})} />
              </Card>
            </Grid>

            {/* CHỌN SẢN PHẨM & BẢNG */}
            <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, minHeight: 400 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#333' }}>DANH SÁCH HÀNG XUẤT</Typography>
                
                <Autocomplete 
                  options={products} 
                  getOptionLabel={(opt) => `[${opt.sku}] ${opt.variantName}`} 
                  filterOptions={(options, state) => {
                    const keyword = state.inputValue.toLowerCase();
                    return options.filter(opt => 
                      (opt.sku || '').toLowerCase().includes(keyword) || 
                      (opt.variantName || '').toLowerCase().includes(keyword)
                    );
                  }}
                  onChange={(_, val) => handleAddProduct(val)} 
                  clearOnBlur={false} 
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="🔍 Nhập Tên hoặc mã SKU sản phẩm để thêm..." 
                      size="small" 
                      sx={{ bgcolor: 'white' }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.variantName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          SKU: {option.sku} | <span style={{ color: option.quantity > 0 ? '#16a34a' : '#dc2626' }}>Tồn kho: {option.quantity}</span> | Giá xuất: {formatCurrency(option.price)}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />

                <TableContainer sx={{ mt: 2, border: '1px solid #eee', borderRadius: 2, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 600 } }}>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center" width={100}>SL</TableCell>
                        <TableCell align="right" width={150}>Đơn giá</TableCell>
                        <TableCell align="right" width={150}>Thành tiền</TableCell>
                        <TableCell width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formRequest.details.length === 0 ? (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa chọn sản phẩm nào.</TableCell></TableRow>
                      ) : (
                        formRequest.details.map((item) => (
                          <TableRow key={item.productVariantId}>
                            <TableCell>
                              <Typography variant="body2" sx={{fontWeight: 600}}>{item.variantName}</Typography>
                              <Typography variant="caption" color="text.secondary">SKU: {item.sku}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <TextField 
                                type="number" size="small" value={item.quantity} 
                                onChange={(e) => handleUpdateQty(item.productVariantId, parseInt(e.target.value) || 1)} 
                                inputProps={{ min: 1, max: item.maxQty }} 
                                sx={{width: 70}} 
                              />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right" sx={{fontWeight: 600}}>{formatCurrency(item.total)}</TableCell>
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => setFormRequest({...formRequest, details: formRequest.details.filter(d => d.productVariantId !== item.productVariantId)})}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography variant="h6" color="#dc2626" sx={{ fontWeight: 700 }}>
                    TỔNG TIỀN: {formatCurrency(formRequest.details.reduce((sum, i) => sum + i.total, 0))}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f1f5f9', borderTop: '1px solid #ddd' }}>
          <Button onClick={() => setOpenCreate(false)} variant="outlined" color="inherit" sx={{textTransform: 'none'}}>Hủy bỏ</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#00a65a', textTransform: 'none', boxShadow: 'none' }}>Lưu & Xuất Kho</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL XEM CHI TIẾT --- */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}> Chi Tiết Phiếu Xuất: <span style={{ color: '#0284c7' }}>{selectedTicket?.code}</span></Typography>
          <IconButton size="small" onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedTicket ? (
             <Grid container spacing={2}>
                 <Grid item xs={6}><Typography variant="body2"><b>Khách hàng:</b> {selectedTicket.customerName || 'Khách lẻ'}</Typography></Grid>
                 <Grid item xs={6}><Typography variant="body2"><b>Ngày xuất:</b> {selectedTicket.exportDate ? new Date(selectedTicket.exportDate).toLocaleDateString('vi-VN') : '-'}</Typography></Grid>
                 <Grid item xs={12}>
                     <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                         <Table size="small">
                             <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                 <TableRow>
                                     <TableCell>Sản phẩm</TableCell>
                                     <TableCell align="center">SL</TableCell>
                                     <TableCell align="right">Đơn giá</TableCell>
                                     <TableCell align="right">Thành tiền</TableCell>
                                 </TableRow>
                             </TableHead>
                             <TableBody>
                                 {selectedTicket.details?.map((d: any, idx: number) => (
                                     <TableRow key={idx}>
                                         <TableCell>{d.variantName} <br/><Typography variant="caption">{d.sku}</Typography></TableCell>
                                         <TableCell align="center">{d.quantity}</TableCell>
                                         <TableCell align="right">{formatCurrency(d.unitPrice)}</TableCell>
                                         <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(d.quantity * d.unitPrice)}</TableCell>
                                     </TableRow>
                                 ))}
                             </TableBody>
                         </Table>
                     </TableContainer>
                 </Grid>
                 <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Typography variant="body1">Tổng tiền xuất: <b style={{ color: '#dc2626' }}>{formatCurrency(selectedTicket.totalValue || selectedTicket.totalAmount)}</b></Typography>
                    </Box>
                 </Grid>
             </Grid>
          ) : <Box sx={{display: 'flex', justifyContent: 'center', p: 3}}><CircularProgress /></Box>}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}><Button onClick={() => setOpenDetail(false)} color="inherit">Đóng</Button></DialogActions>
      </Dialog>

      {/* DIALOG THU TIỀN NỢ */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f39c12', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          THU TIỀN NỢ KHÁCH HÀNG
          <IconButton size="small" onClick={() => setOpenPaymentDialog(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Chức năng đang trong giai đoạn phát triển. Vui lòng chuyển sang module <b>Tài Chính - Thu/Chi</b> để thực hiện thu tiền cho phiếu xuất.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenPaymentDialog(false)} variant="contained" color="primary">Đã hiểu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};