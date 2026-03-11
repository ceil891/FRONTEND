import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { orderAPI, BackendHoaDon } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuthStore();
  const { showToast } = useToastStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const mockOrderDetails = [
    { id: '1', orderId: '1', productId: '1', productName: 'Coca Cola 330ml', quantity: 2, unitPrice: 15000, discount: 0, total: 30000 },
    { id: '2', orderId: '1', productId: '3', productName: 'Bánh mì thịt nướng', quantity: 1, unitPrice: 25000, discount: 5000, total: 20000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'success';
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.PROCESSING:
        return 'info';
      case OrderStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'Hoàn thành';
      case OrderStatus.PENDING:
        return 'Chờ xử lý';
      case OrderStatus.PROCESSING:
        return 'Đang xử lý';
      case OrderStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return 'Tiền mặt';
      case PaymentMethod.QR_CODE:
        return 'QR Code';
      case PaymentMethod.CARD:
        return 'Thẻ';
      default:
        return method;
    }
  };

  const mapBackendToOrder = (hd: BackendHoaDon): Order => {
    // Backend hiện không trả phương thức thanh toán/khách hàng chi tiết -> map tối thiểu
    return {
      id: String(hd.hoaDonId),
      orderNumber: `HD${hd.hoaDonId}`,
      storeId: 'store-1',
      staffId: 'staff-1',
      customerName: undefined,
      customerPhone: undefined,
      subtotal: Number(hd.tamTinh ?? 0),
      discount: Number(hd.chietKhau ?? 0),
      total: Number(hd.tongPhaiThanhToan ?? 0),
      paymentMethod: PaymentMethod.CASH,
      status:
        hd.trangThai === 'COMPLETED'
          ? OrderStatus.COMPLETED
          : hd.trangThai === 'CANCELLED'
          ? OrderStatus.CANCELLED
          : OrderStatus.PENDING,
      createdAt: new Date(hd.ngayLap),
      updatedAt: new Date(hd.ngayLap),
    };
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const resp = await orderAPI.getAll();
      const data = resp.data ?? [];
      setOrders(data.map(mapBackendToOrder));
    } catch (err: any) {
      showToast(err?.message || 'Không tải được danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || order.paymentMethod === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setOpenDetail(true);
  };

  const handlePrint = (order: Order) => {
    window.print();
    // In thực tế sẽ gọi API để lấy chi tiết và in
  };

  const orderDetails = selectedOrder
    ? mockOrderDetails.filter(detail => detail.orderId === selectedOrder.id)
    : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" />
          Quản Lý Đơn Hàng
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pos')}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
            },
          }}
        >
          Tạo Đơn Hàng Mới
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo số HĐ, tên KH, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Trạng Thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng Thái"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <MenuItem value="ALL">Tất cả</MenuItem>
                  <MenuItem value={OrderStatus.PENDING}>Chờ xử lý</MenuItem>
                  <MenuItem value={OrderStatus.PROCESSING}>Đang xử lý</MenuItem>
                  <MenuItem value={OrderStatus.COMPLETED}>Hoàn thành</MenuItem>
                  <MenuItem value={OrderStatus.CANCELLED}>Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Phương Thức Thanh Toán</InputLabel>
                <Select
                  value={paymentFilter}
                  label="Phương Thức Thanh Toán"
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                >
                  <MenuItem value="ALL">Tất cả</MenuItem>
                  <MenuItem value={PaymentMethod.CASH}>Tiền mặt</MenuItem>
                  <MenuItem value={PaymentMethod.QR_CODE}>QR Code</MenuItem>
                  <MenuItem value={PaymentMethod.CARD}>Thẻ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Số HĐ</TableCell>
                  <TableCell>Khách Hàng</TableCell>
                  <TableCell>SĐT</TableCell>
                  <TableCell>Tạm Tính</TableCell>
                  <TableCell>Giảm Giá</TableCell>
                  <TableCell>Tổng Tiền</TableCell>
                  <TableCell>Thanh Toán</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>Thời Gian</TableCell>
                  <TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.customerName || 'Khách lẻ'}</TableCell>
                    <TableCell>{order.customerPhone || '-'}</TableCell>
                    <TableCell>{formatCurrency(order.subtotal)}</TableCell>
                    <TableCell>
                      {order.discount > 0 ? (
                        <Typography color="success.main">-{formatCurrency(order.discount)}</Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {formatCurrency(order.total)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={getPaymentLabel(order.paymentMethod)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(order.createdAt, 'dd/MM/yyyy HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetail(order)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {order.status === OrderStatus.COMPLETED && (
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handlePrint(order)}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi Tiết Đơn Hàng: {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Khách hàng:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedOrder.customerName || 'Khách lẻ'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Số điện thoại:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedOrder.customerPhone || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phương thức thanh toán:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getPaymentLabel(selectedOrder.paymentMethod)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái:
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedOrder.status)}
                    color={getStatusColor(selectedOrder.status) as any}
                    size="small"
                  />
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản Phẩm</TableCell>
                      <TableCell align="right">SL</TableCell>
                      <TableCell align="right">Đơn Giá</TableCell>
                      <TableCell align="right">Giảm Giá</TableCell>
                      <TableCell align="right">Thành Tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderDetails.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>{detail.productName}</TableCell>
                        <TableCell align="right">{detail.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(detail.unitPrice)}</TableCell>
                        <TableCell align="right">
                          {detail.discount > 0 ? formatCurrency(detail.discount) : '-'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(detail.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tạm tính:</Typography>
                  <Typography>{formatCurrency(selectedOrder.subtotal)}</Typography>
                </Box>
                {selectedOrder.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="success.main">Giảm giá:</Typography>
                    <Typography color="success.main">-{formatCurrency(selectedOrder.discount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Tổng cộng:
                  </Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                    {formatCurrency(selectedOrder.total)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
          {selectedOrder?.status === OrderStatus.COMPLETED && (
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrint(selectedOrder!)}>
              In Hóa Đơn
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
