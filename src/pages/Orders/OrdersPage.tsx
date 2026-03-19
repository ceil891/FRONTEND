import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, TextField,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, FormControl, InputLabel, Select, Grid, CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon, Print as PrintIcon,
  Search as SearchIcon, Receipt as ReceiptIcon, Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { orderAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

// Cố định kiểu dữ liệu
export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành';
      case 'PENDING': return 'Chờ duyệt';
      case 'PROCESSING': return 'Đang xử lý';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Tiền mặt';
      case 'QR_CODE': return 'QR Code';
      case 'CARD': return 'Thẻ';
      case 'BANK_TRANSFER': return 'Chuyển khoản';
      default: return method;
    }
  };

  // 🟢 FIX 1: Chuẩn hóa dữ liệu khớp 100% với DTO của Backend
  const mapBackendToOrder = (hd: any): any => {
    return {
      id: hd.id,
      orderNumber: hd.orderNumber,
      customerName: hd.customerName || 'Khách lẻ',
      customerPhone: hd.customerPhone || '-',
      subtotal: Number(hd.subTotal ?? hd.subtotal ?? 0),
      discount: Number(hd.discount ?? 0),
      total: Number(hd.totalAmount ?? 0),
      paymentMethod: hd.paymentMethod || 'CASH',
      status: hd.status || 'PENDING',
      createdAt: new Date(hd.createdAt),
      items: hd.items || [] // Lấy luôn items thực tế từ Backend
    };
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Gọi API lấy toàn bộ danh sách (Có thể đổi thành query({ type: 'HISTORY' }) nếu cần)
      const resp = await orderAPI.getAll(); 
      const data = resp.data?.data || resp.data || [];
      setOrders(Array.isArray(data) ? data.map(mapBackendToOrder) : []);
    } catch (err: any) {
      showToast('Không tải được danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const kw = searchQuery.trim().toLowerCase();
      const matchesSearch = !kw || 
        order.orderNumber.toLowerCase().includes(kw) ||
        order.customerName.toLowerCase().includes(kw) ||
        order.customerPhone.includes(kw);
        
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'ALL' || order.paymentMethod === paymentFilter;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setOpenDetail(true);
  };

  const handlePrint = (order: any) => {
    window.print();
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#1e293b' }}>
          <ReceiptIcon color="primary" /> QUẢN LÝ ĐƠN HÀNG TỔNG HỢP
        </Typography>
        <Button
          variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/pos')}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)', fontWeight: 700, borderRadius: 2
          }}
        >
          Bán Hàng Ngay
        </Button>
      </Box>

      {/* BỘ LỌC */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Tìm theo số HĐ, tên KH, SĐT..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng Thái</InputLabel>
                <Select value={statusFilter} label="Trạng Thái" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                  <MenuItem value="PENDING">Chờ duyệt (Online)</MenuItem>
                  <MenuItem value="COMPLETED">Đã hoàn thành</MenuItem>
                  <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Thanh Toán</InputLabel>
                <Select value={paymentFilter} label="Thanh Toán" onChange={(e) => setPaymentFilter(e.target.value)}>
                  <MenuItem value="ALL">Tất cả phương thức</MenuItem>
                  <MenuItem value="CASH">Tiền mặt</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Chuyển khoản / QR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* BẢNG ĐƠN HÀNG */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Số HĐ</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Khách Hàng</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Tạm Tính</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Giảm Giá</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Tổng Tiền</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Thanh Toán</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Trạng Thái</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Thời Gian</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="center">Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ bgcolor: '#fff' }}>
            {loading ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>Không tìm thấy đơn hàng nào phù hợp.</TableCell></TableRow>
            ) : filteredOrders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell><Typography sx={{ fontWeight: 800, color: 'primary.main' }}>{order.orderNumber}</Typography></TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight={700}>{order.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.customerPhone}</Typography>
                </TableCell>
                <TableCell>{formatCurrency(order.subtotal)}</TableCell>
                <TableCell>{order.discount > 0 ? <Typography color="success.main">-{formatCurrency(order.discount)}</Typography> : '-'}</TableCell>
                <TableCell><Typography sx={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(order.total)}</Typography></TableCell>
                <TableCell><Chip label={getPaymentLabel(order.paymentMethod)} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} /></TableCell>
                <TableCell><Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status) as any} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                <TableCell><Typography variant="body2">{format(order.createdAt, 'dd/MM/yyyy HH:mm')}</Typography></TableCell>
                <TableCell align="center">
                  <IconButton size="small" color="primary" onClick={() => handleViewDetail(order)}><VisibilityIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* POPUP CHI TIẾT */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>Chi Tiết Đơn Hàng: <Typography component="span" color="primary" fontWeight={800}>{selectedOrder?.orderNumber}</Typography></DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Khách hàng</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedOrder.customerName}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedOrder.customerPhone}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Thanh toán</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{getPaymentLabel(selectedOrder.paymentMethod)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Trạng thái</Typography><br/>
                  <Chip label={getStatusLabel(selectedOrder.status)} color={getStatusColor(selectedOrder.status) as any} size="small" sx={{ mt: 0.5, fontWeight: 700 }} />
                </Grid>
              </Grid>

              {/* 🟢 FIX 2: Render Items thật từ Backend */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Sản Phẩm</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>SL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Đơn Giá</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Thành Tiền</TableCell>
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
                            <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(item.totalPrice || (item.unitPrice * item.quantity))}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Không có dữ liệu mặt hàng</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 300 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Tạm tính:</Typography>
                        <Typography fontWeight={600}>{formatCurrency(selectedOrder.subtotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Giảm giá:</Typography>
                        <Typography color="error.main" fontWeight={600}>-{formatCurrency(selectedOrder.discount)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>TỔNG CỘNG:</Typography>
                        <Typography variant="h6" color="#16a34a" sx={{ fontWeight: 800 }}>{formatCurrency(selectedOrder.total)}</Typography>
                    </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenDetail(false)} color="inherit" sx={{ fontWeight: 600 }}>Đóng</Button>
          {selectedOrder?.status === 'COMPLETED' && (
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrint(selectedOrder!)} sx={{ fontWeight: 700 }}>In Hóa Đơn</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};