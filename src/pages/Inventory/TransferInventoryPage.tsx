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
  LocalShipping as ShippingIcon, CheckCircle as ConfirmIcon,
  Print as PrintIcon, FileDownload as ExcelIcon
} from '@mui/icons-material';
import { transferTicketAPI, productAPI, storeAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const TransferInventoryPage: React.FC = () => {
  // --- STATES DỮ LIỆU ---
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const { showToast } = useToastStore();

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Form State
  const [formRequest, setFormRequest] = useState({
    fromStoreId: null as number | null,
    toStoreId: null as number | null,
    createdById: 1, 
    details: [] as any[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketRes, prodRes, storeRes] = await Promise.all([
        transferTicketAPI.getAll(),
        productAPI.getAll(),
        storeAPI.getAll()
      ]);
      if (ticketRes?.data?.success) setTickets(ticketRes.data.data || []);
      if (prodRes?.data?.success) setProducts(prodRes.data.data || []);
      if (storeRes?.data?.success) setStores(storeRes.data.data || []);
    } catch (error) {
      showToast('Lỗi tải dữ liệu chuyển kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC XỬ LÝ NÚT (FIXED: NHẤN LÀ CHẠY) ---

  const handleProcess = async () => {
    if (selectedIds.length === 0) return showToast("Vui lòng tích chọn phiếu trước!", "warning");
    const id = selectedIds[0];
    if (window.confirm("Xác nhận xuất hàng khỏi kho nguồn?")) {
      try {
        const res = await transferTicketAPI.process(id);
        if (res.data.success) {
          showToast("Đã xuất hàng thành công!", "success");
          fetchData();
          setSelectedIds([]);
        }
      } catch (error: any) { showToast(error.message, "error"); }
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return showToast("Vui lòng tích chọn phiếu trước!", "warning");
    const id = selectedIds[0];
    if (window.confirm("Xác nhận đã nhận đủ hàng về kho nhập?")) {
      try {
        const res = await transferTicketAPI.confirm(id);
        if (res.data.success) {
          showToast("Nhận hàng thành công!", "success");
          fetchData();
          setSelectedIds([]);
        }
      } catch (error: any) { showToast(error.message, "error"); }
    }
  };

  const handleSaveTransfer = async () => {
    if (!formRequest.fromStoreId || !formRequest.toStoreId) return showToast("Vui lòng chọn đủ kho!", "warning");
    if (formRequest.fromStoreId === formRequest.toStoreId) return showToast("Kho nguồn và đích không được trùng nhau!", "error");
    if (formRequest.details.length === 0) return showToast("Chưa có sản phẩm nào!", "warning");

    try {
      const res = await transferTicketAPI.create(formRequest);
      if (res.data.success) {
        showToast("Lập phiếu thành công!", "success");
        setOpenCreate(false);
        setFormRequest({ fromStoreId: null, toStoreId: null, createdById: 1, details: [] });
        fetchData();
      }
    } catch (error: any) { showToast(error.message, "error"); }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f7fe', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, textTransform: 'uppercase' }}>Điều Chuyển Kho Nội Bộ</Typography>

      {/* TOOLBAR Y HỆT ẢNH BẠN GỬI */}
      <Card sx={{ borderRadius: '15px', mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField 
            size="small" placeholder="Tìm mã phiếu/tên kho..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 250, '& .MuiInputBase-root': { borderRadius: '20px' } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', borderRadius: '20px', textTransform: 'none' }} onClick={() => setOpenCreate(true)}>Lập Phiếu</Button>
          <Button variant="contained" startIcon={<ShippingIcon />} sx={{ bgcolor: '#f39c12', borderRadius: '20px', textTransform: 'none' }} onClick={handleProcess}>Xuất Hàng Đi</Button>
          <Button variant="contained" startIcon={<ConfirmIcon />} sx={{ bgcolor: '#48c9b0', borderRadius: '20px', textTransform: 'none' }} onClick={handleConfirm}>Nhận Hàng</Button>
          <Button variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', borderRadius: '20px', textTransform: 'none' }} onClick={() => window.print()}>In Phiếu</Button>
          <Button variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#e74c3c', borderRadius: '20px', textTransform: 'none' }} onClick={() => fetchData()}>Hủy</Button>
        </Box>
      </Card>

      {/* BẢNG DỮ LIỆU */}
      <TableContainer component={Paper} sx={{ borderRadius: '15px' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox size="small" onChange={(e) => e.target.checked ? setSelectedIds(tickets.map(t => t.id)) : setSelectedIds([])}/>
              </TableCell>
              <TableCell sx={{fontWeight: 700}}>Mã Phiếu</TableCell>
              <TableCell sx={{fontWeight: 700}}>Từ Kho (Xuất)</TableCell>
              <TableCell sx={{fontWeight: 700}}>Đến Kho (Nhận)</TableCell>
              <TableCell align="center" sx={{fontWeight: 700}}>Tổng SL</TableCell>
              <TableCell sx={{fontWeight: 700}}>Trạng Thái</TableCell>
              <TableCell align="center" sx={{fontWeight: 700}}>Xem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.filter(t => t.code.toLowerCase().includes(searchQuery.toLowerCase())).map((row) => (
              <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{row.code}</TableCell>
                <TableCell color="error">{row.fromStoreName}</TableCell>
                <TableCell color="success">{row.toStoreName}</TableCell>
                <TableCell align="center">{row.totalQuantity}</TableCell>
                <TableCell>
                  <Chip label={row.status} size="small" color={row.status === 'COMPLETED' ? 'success' : 'warning'} />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => { setSelectedTicket(row); setOpenDetail(true); }} color="info"><ViewIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Pagination count={1} size="small" color="primary" />
          <Typography variant="body2" color="textSecondary">Hiển thị {tickets.length} kết quả</Typography>
        </Box>
      </TableContainer>

      {/* --- MODAL LẬP PHIẾU --- */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#3498db', color: 'white' }}>LẬP PHIẾU CHUYỂN KHO</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><Autocomplete options={stores} getOptionLabel={(o) => o.name} onChange={(_, v) => setFormRequest({...formRequest, fromStoreId: v?.id || null})} renderInput={(p) => <TextField {...p} label="Kho gửi hàng *" size="small" />}/></Grid>
            <Grid item xs={6}><Autocomplete options={stores} getOptionLabel={(o) => o.name} onChange={(_, v) => setFormRequest({...formRequest, toStoreId: v?.id || null})} renderInput={(p) => <TextField {...p} label="Kho nhận hàng *" size="small" />}/></Grid>
            <Grid item xs={12}><Autocomplete options={products} getOptionLabel={(o) => `[${o.sku}] ${o.variantName}`} onChange={(_, v) => v && setFormRequest({...formRequest, details: [...formRequest.details, { productVariantId: v.id, variantName: v.variantName, sku: v.sku, quantity: 1 }]})} renderInput={(p) => <TextField {...p} label="Tìm sản phẩm cần chuyển..." size="small" />}/></Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            {formRequest.details.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', alignItems: 'center' }}>
                <Typography sx={{ flexGrow: 1 }}><b>{item.variantName}</b> ({item.sku})</Typography>
                <TextField type="number" size="small" value={item.quantity} onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  const newD = [...formRequest.details]; newD[idx].quantity = val;
                  setFormRequest({...formRequest, details: newD});
                }} sx={{ width: 100 }} />
                <IconButton onClick={() => setFormRequest({...formRequest, details: formRequest.details.filter((_, i) => i !== idx)})} color="error"><CloseIcon /></IconButton>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleSaveTransfer} startIcon={<SaveIcon />}>Lưu Phiếu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};