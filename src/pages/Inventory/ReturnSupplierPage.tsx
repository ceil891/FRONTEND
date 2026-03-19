import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Autocomplete, 
  Paper, InputAdornment, Tooltip, Checkbox, Pagination, Divider
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Visibility as ViewIcon, 
  Save as SaveIcon, Search as SearchIcon, Close as CloseIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon
} from '@mui/icons-material';
import { returnTicketAPI, productAPI, supplierAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const ReturnSupplierPage: React.FC = () => {
  // --- STATES DỮ LIỆU ---
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Dữ liệu hỗ trợ Form
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const { showToast } = useToastStore();

  // States điều khiển Modal (Để các nút hoạt động)
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Form Request lưu dữ liệu trả hàng
  const [formRequest, setFormRequest] = useState({
    returnType: 'SUPPLIER_RETURN',
    supplierId: null as number | null,
    reason: '',
    paymentMethod: 'CASH',
    details: [] as any[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketRes, prodRes, supRes] = await Promise.all([
        returnTicketAPI.getByType('SUPPLIER_RETURN'),
        productAPI.getAll(),
        supplierAPI.getAll()
      ]);
      if (ticketRes?.data?.success) setTickets(ticketRes.data.data || []);
      if (prodRes?.data?.success) setProducts(prodRes.data.data || []);
      if (supRes?.data?.success) setSuppliers(supRes.data.data || []);
    } catch (error) {
      showToast('Lỗi tải dữ liệu. Kiểm tra Backend!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC XỬ LÝ NÚT BẤM (GẮN TRỰC TIẾP) ---

  const handleOpenCreate = () => setOpenCreate(true);

  const handleHuyPhieu = async () => {
    if (selectedIds.length === 0) return showToast("Vui lòng tích chọn 1 phiếu ở bảng dưới!", "warning");
    if (window.confirm("Xác nhận hủy phiếu trả hàng này? Tồn kho sẽ được hoàn tác.")) {
      try {
        const res = await returnTicketAPI.delete(selectedIds[0]);
        if (res.data.success) {
          showToast("Đã hủy phiếu thành công", "success");
          fetchData();
          setSelectedIds([]);
        }
      } catch (error: any) { showToast(error.message, "error"); }
    }
  };

  const handleAddProduct = (product: any) => {
    if (!product || formRequest.details.some(d => d.productVariantId === product.id)) return;
    setFormRequest({
      ...formRequest,
      details: [...formRequest.details, {
        productVariantId: product.id,
        variantName: product.variantName,
        sku: product.sku,
        returnQuantity: 1,
        returnPrice: product.importPrice || 0
      }]
    });
  };

  const handleSaveReturn = async () => {
    if (!formRequest.supplierId) return showToast("Vui lòng chọn Nhà cung cấp!", "warning");
    if (formRequest.details.length === 0) return showToast("Chưa có sản phẩm nào để trả!", "warning");
    try {
      const res = await returnTicketAPI.create(formRequest);
      if (res.data.success) {
        showToast("Lập phiếu trả hàng thành công!", "success");
        setOpenCreate(false);
        setFormRequest({ returnType: 'SUPPLIER_RETURN', supplierId: null, reason: '', paymentMethod: 'CASH', details: [] });
        fetchData();
      }
    } catch (error: any) { showToast(error.message, "error"); }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f7fe', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, textTransform: 'uppercase', color: '#333' }}>
        Phiếu trả hàng nhà cung cấp
      </Typography>

      {/* THANH CÔNG CỤ (TOOLBAR) */}
      <Card sx={{ borderRadius: '12px', mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField 
            size="small" placeholder="Tìm mã phiếu/NCC..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 280, '& .MuiInputBase-root': { borderRadius: '20px', bgcolor: '#fff' } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }}
          />
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', borderRadius: '20px', textTransform: 'none' }} onClick={handleOpenCreate}>Lập Phiếu Trả</Button>
          <Button variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', borderRadius: '20px', textTransform: 'none' }} onClick={handleHuyPhieu}>Hủy Phiếu</Button>
          <Button variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', borderRadius: '20px', textTransform: 'none' }} onClick={() => window.print()}>In Phiếu</Button>
          <Button variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', borderRadius: '20px', textTransform: 'none' }}>Xuất Excel</Button>
        </Box>
      </Card>

      {/* BẢNG DANH SÁCH PHIẾU */}
      <TableContainer component={Paper} sx={{ borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox size="small" onChange={(e) => e.target.checked ? setSelectedIds(tickets.map(t => t.id)) : setSelectedIds([])} />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mã Phiếu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ngày Trả</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Nhà Cung Cấp</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Tổng Giá Trị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng Thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
            ) : tickets.filter(t => t.code.toLowerCase().includes(searchQuery.toLowerCase())).map((row) => (
              <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])} />
                </TableCell>
                <TableCell>
                   <IconButton size="small" color="info" onClick={() => { setSelectedTicket(row); setOpenDetail(true); }}><ViewIcon fontSize="small" /></IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{row.code}</TableCell>
                <TableCell>{new Date(row.returnDate).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>{row.partnerName}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#e53e3e' }}>{formatCurrency(row.totalRefundAmount)}</TableCell>
                <TableCell><Chip label="Đã hoàn tất" size="small" color="success" sx={{ borderRadius: '6px', fontWeight: 600 }} /></TableCell>
              </TableRow>
            ))}
            {!loading && tickets.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: '#999' }}>Không có dữ liệu phiếu trả hàng</TableCell></TableRow>}
          </TableBody>
        </Table>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pagination count={1} shape="rounded" color="primary" size="small" />
            <Typography variant="body2" color="textSecondary">Hiển thị {tickets.length} kết quả</Typography>
        </Box>
      </TableContainer>

      {/* --- MODAL LẬP PHIẾU MỚI --- */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00a65a', color: 'white', fontWeight: 700 }}>LẬP PHIẾU TRẢ HÀNG NHÀ CUNG CẤP</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f8fafc' }}>
          <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
            <Grid item xs={6}>
              <Autocomplete options={suppliers} getOptionLabel={(o) => o.name || ''} 
                onChange={(_, v) => setFormRequest({...formRequest, supplierId: v?.id || null})}
                renderInput={(p) => <TextField {...p} label="Nhà cung cấp *" size="small" sx={{bgcolor:'#fff'}} />}/>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Lý do trả hàng" size="small" value={formRequest.reason} onChange={(e) => setFormRequest({...formRequest, reason: e.target.value})} sx={{bgcolor:'#fff'}} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete options={products} getOptionLabel={(o) => `[${o.sku}] ${o.variantName}`} 
                onChange={(_, v) => v && handleAddProduct(v)}
                renderInput={(p) => <TextField {...p} label="🔍 Tìm sản phẩm cần trả lại..." size="small" sx={{bgcolor:'#fff'}} />}/>
            </Grid>
          </Grid>
          
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#edf2f7' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Số lượng trả</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Giá trả</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formRequest.details.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>Chưa chọn sản phẩm nào</TableCell></TableRow>
                ) : formRequest.details.map((item, idx) => (
                  <TableRow key={idx} sx={{ bgcolor: 'white' }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{item.variantName}</Typography><Typography variant="caption" color="textSecondary">{item.sku}</Typography></TableCell>
                    <TableCell align="center">
                      <TextField type="number" size="small" value={item.returnQuantity} sx={{ width: 80 }} 
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          const newD = [...formRequest.details]; newD[idx].returnQuantity = val;
                          setFormRequest({...formRequest, details: newD});
                        }} />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.returnPrice)}</TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => setFormRequest({...formRequest, details: formRequest.details.filter((_, i) => i !== idx)})}><CloseIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)} color="inherit">Hủy bỏ</Button>
          <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSaveReturn}>Xác nhận & Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL XEM CHI TIẾT --- */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 700 }}> CHI TIẾT PHIẾU: {selectedTicket?.code}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2"><b>Nhà cung cấp:</b> {selectedTicket?.partnerName}</Typography>
            <Typography variant="body2"><b>Ngày lập:</b> {selectedTicket && new Date(selectedTicket.returnDate).toLocaleString('vi-VN')}</Typography>
            <Typography variant="body2"><b>Lý do:</b> {selectedTicket?.reason || 'Không có'}</Typography>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow><TableCell>Sản phẩm</TableCell><TableCell align="right">SL</TableCell><TableCell align="right">Giá</TableCell></TableRow></TableHead>
              <TableBody>
                {selectedTicket?.details?.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.variantName}</TableCell>
                    <TableCell align="right">{d.returnQuantity}</TableCell>
                    <TableCell align="right">{formatCurrency(d.returnPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDetail(false)}>Đóng</Button></DialogActions>
      </Dialog>
    </Box>
  );
};