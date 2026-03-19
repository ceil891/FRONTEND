import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, Paper, IconButton, CircularProgress, Stack, Divider
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, AssignmentReturn as ReturnIcon,
  Refresh as RefreshIcon, Storefront as StoreIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 👉 IMPORT API VÀ TOAST
import { orderAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const RetailOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  const mapBackendToOrder = (hd: any): any => {
    return {
      ...hd,
      id: hd.id || hd.hoaDonId,
      orderNumber: hd.orderNumber || hd.orderCode || `HD${hd.id || hd.hoaDonId}`,
      createdAt: hd.createdAt || new Date(),
      customerName: hd.customerName || 'Khách lẻ',
      customerPhone: hd.customerPhone || '-',
      staffName: hd.employeeName || 'Admin',
      storeName: hd.storeName || 'Chi nhánh Hà Nội',
      subtotal: Number(hd.subTotal ?? 0),
      discount: Number(hd.discount ?? 0),
      total: Number(hd.totalAmount ?? 0),
      status: hd.status || 'COMPLETED',
      items: hd.items || [] 
    };
  };

  const loadOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Gọi API lọc riêng đơn RETAIL đã COMPLETED
      const res = await orderAPI.query({ channel: 'RETAIL', status: 'COMPLETED' });
      
      // 🟢 FIX LỖI Ở ĐÂY: Khai báo và bóc tách dataFromApi từ res
      const dataFromApi = res.data?.data || res.data || [];
      
      if (Array.isArray(dataFromApi)) {
        const mapped = dataFromApi.map(mapBackendToOrder);
        setRows(mapped.sort((a, b) => b.id - a.id));
      } else {
        setRows([]);
      }
    } catch (err) {
      if (!silent) showToast('Không thể kết nối máy chủ đơn hàng', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.orderNumber, r.customerName, r.customerPhone, r.staffName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw))
    );
  }, [rows, searchQuery]);

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setOpenDetail(true);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      {/* HEADER */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
              QUẢN LÝ ĐƠN BÁN LẺ
            </Typography>
            <Typography variant="body2" color="text.secondary">Xem và quản lý tất cả hóa đơn bán hàng tại quầy</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
            <Button 
                variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadOrders()} 
                sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#fff' }}
            >
                Làm mới
            </Button>
            <Button 
                variant="contained" color="success" startIcon={<AddIcon />} 
                onClick={() => navigate('/pos')} 
                sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 700 }}
            >
                Bán Hàng (POS)
            </Button>
        </Stack>
      </Box>

      {/* SEARCH CARD */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField 
            fullWidth
            placeholder="Tìm kiếm theo mã hóa đơn, tên khách hàng hoặc số điện thoại..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.disabled' }} /> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
          />
        </CardContent>
      </Card>

      {/* TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Thao Tác</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Mã HĐ</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Thời Gian</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Khách Hàng</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">Tổng Tiền</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">Khách Trả</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Nhân Viên</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="center">Trạng Thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ bgcolor: '#fff' }}>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><CircularProgress size={40} /><Typography sx={{ mt: 2 }} color="text.secondary">Đang tải danh sách đơn hàng...</Typography></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10, color: 'text.secondary' }}>Chưa có hóa đơn nào phù hợp.</TableCell></TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} hover sx={{ transition: '0.2s' }}>
                  <TableCell>
                    <IconButton size="small" sx={{ color: '#0ea5e9', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }} onClick={() => handleViewDetail(row)}>
                        <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>{row.orderNumber}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{new Date(row.createdAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{row.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.customerPhone}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(row.subtotal)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(row.total)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">{row.staffName}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label="Thành công" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, borderRadius: 1.5, fontSize: '0.7rem' }} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* POPUP CHI TIẾT */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 4 } }}>
        <DialogTitle sx={{ p: 3, bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Chi tiết đơn hàng</Typography>
            <Typography variant="caption" color="primary" fontWeight={700}>{selectedOrder?.orderNumber}</Typography>
          </Box>
          <IconButton onClick={() => setOpenDetail(false)} size="small"><DeleteIcon sx={{ transform: 'rotate(45deg)' }} /></IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 0 }}>
          {selectedOrder && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fdfdfd' }}>
                    <Typography variant="caption" color="text.secondary">THÔNG TIN KHÁCH HÀNG</Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 1 }}>{selectedOrder.customerName}</Typography>
                    <Typography variant="body2">{selectedOrder.customerPhone}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fdfdfd' }}>
                    <Typography variant="caption" color="text.secondary">NHÂN VIÊN & CỬA HÀNG</Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 1 }}>{selectedOrder.staffName}</Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><StoreIcon fontSize="inherit" /> {selectedOrder.storeName}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fdfdfd' }}>
                    <Typography variant="caption" color="text.secondary">THỜI GIAN GIAO DỊCH</Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 1 }}>{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</Typography>
                    <Typography variant="body2" color="success.main" fontWeight={700}>Trạng thái: Hoàn thành</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={800} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StoreIcon sx={{ fontSize: 20 }} /> DANH SÁCH MÓN HÀNG
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>SL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Đơn giá</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                              <Typography variant="body2" fontWeight={700}>{item.productName}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.variantName}</Typography>
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Không có dữ liệu chi tiết.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Stack spacing={1.5} sx={{ width: 320, p: 2, bgcolor: '#f8fafc', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Tiền hàng:</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatCurrency(selectedOrder.subtotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Giảm giá:</Typography>
                        <Typography variant="body2" color="error.main" fontWeight={600}>-{formatCurrency(selectedOrder.discount)}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight={900}>TỔNG CỘNG:</Typography>
                        <Typography variant="h6" fontWeight={900} color="#16a34a">{formatCurrency(selectedOrder.total)}</Typography>
                    </Box>
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenDetail(false)} color="inherit" sx={{ fontWeight: 600 }}>Đóng</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>In Hóa Đơn</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};