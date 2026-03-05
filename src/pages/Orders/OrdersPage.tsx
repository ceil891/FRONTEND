import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  MenuItem, FormControl, InputLabel, Select, Grid, CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon, Print as PrintIcon,
  Search as SearchIcon, Receipt as ReceiptIcon, Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { format, isValid, parseISO } from 'date-fns';
import { orderAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { generateReceiptHTML } from '../../utils/receiptTemplate';
export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const safeFormatDate = (dateSource: any) => {
    if (!dateSource) return '---';
    try {
      const d = typeof dateSource === 'string' ? parseISO(dateSource) : new Date(dateSource);
      return isValid(d) ? format(d, 'dd/MM/yyyy HH:mm') : '---';
    } catch (e) {
      return '---';
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'success';
      case OrderStatus.PENDING: return 'warning';
      case OrderStatus.CANCELLED: return 'error';
      default: return 'default';
    }
  };

  const mapBackendToOrder = (hd: any): Order => {
    // 🐞 ĐẶT MÁY DÒ LỖI: F12 -> Console để xem chính xác Java gửi gì về
    console.log(">>> DỮ LIỆU TỪ BACKEND GỬI VỀ CHO MÃ:", hd?.hoaDonId, hd);

    return {
      id: String(hd?.hoaDonId || Math.random()),
      orderNumber: `HD${hd?.hoaDonId || ''}`,
      storeId: hd?.cuaHang?.tenCuaHang || 'Hệ thống',
      staffId: hd?.nhanVien?.hoTen || 'Admin',
      customerName: hd?.khachHang?.hoTen || 'Khách lẻ',
      subtotal: Number(hd?.tamTinh || 0),
      discount: Number(hd?.chietKhau || 0),
      total: Number(hd?.tongPhaiThanhToan || hd?.total || 0), 
      status: hd?.trangThai === 'COMPLETED' ? OrderStatus.COMPLETED : OrderStatus.PENDING,
      createdAt: hd?.ngayLap ? new Date(hd.ngayLap) : new Date(),
      // ✅ CÀN QUÉT MỌI TÊN TRƯỜNG CÓ THỂ CÓ TỪ BACKEND
      rawDetails: hd?.chiTietHoaDons || hd?.chiTietHoaDon || hd?.chiTietList || hd?.chiTiets || hd?.items || hd?.details || [] 
    };
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const resp = await orderAPI.getAll();
      
      let rawList: any[] = [];
      if (Array.isArray(resp.data)) {
        rawList = resp.data;
      } else if (resp.data && typeof resp.data === 'object') {
        rawList = (resp.data as any).data || (resp.data as any).content || [];
      }

      setOrders(rawList.map(mapBackendToOrder));
    } catch (err: any) {
      showToast('Lỗi: ' + (err.message || 'Không thể tải đơn hàng'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, []);
const handlePrintReceipt = () => {
    if (!selectedOrder || !selectedOrder.rawDetails) {
      showToast('Không có dữ liệu chi tiết để in!', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Vui lòng cho phép trình duyệt mở popup (Pop-up blocker) để in', 'error');
      return;
    }

    // 💡 "Dịch" dữ liệu Backend về đúng chuẩn Giỏ hàng mà hàm In đang dùng
    const cartItemsForPrint = selectedOrder.rawDetails.map((ct: any) => {
      const productName = 
        ct?.bienThe?.sanPham?.tenSanPham || 
        ct?.bienThe?.tenBienThe || 
        ct?.sanPham?.tenSanPham || 
        ct?.tenSanPham || 
        'Sản phẩm không tên';

      return {
        productName: productName,
        quantity: ct?.soLuong || 0,
        unitPrice: ct?.donGia || 0,
        total: ct?.thanhTien || 0
      };
    });

    // Gọi hàm tạo HTML đã có sẵn của bạn
    const htmlContent = generateReceiptHTML(
      cartItemsForPrint,
      selectedOrder.subtotal,
      selectedOrder.discount,
      selectedOrder.total
    );

    // Mở cửa sổ ẩn và ra lệnh in
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = (order.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setOpenDetail(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" /> Nhật Ký Giao Dịch
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/pos')} sx={{ borderRadius: 2 }}>
          Đến Màn Hình POS
        </Button>
      </Box>

      {/* Bộ lọc */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2 }}>
          <TextField
            flex={1} size="small" placeholder="Tìm theo mã hóa đơn, tên khách..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 400 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={statusFilter} label="Trạng thái" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
              <MenuItem value={OrderStatus.COMPLETED}>Hoàn thành</MenuItem>
              <MenuItem value={OrderStatus.PENDING}>Chờ xử lý</MenuItem>
              <MenuItem value={OrderStatus.CANCELLED}>Đã hủy</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={loadOrders} startIcon={<SearchIcon />}>Làm mới</Button>
        </CardContent>
      </Card>

      {/* Bảng danh sách */}
      <Card sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã HĐ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cửa Hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Thu Ngân</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tổng Tiền</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Thời Gian</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng Thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>Chưa có giao dịch nào được ghi nhận.</TableCell></TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell><Typography sx={{ fontWeight: 600, color: 'primary.main' }}>{order.orderNumber}</Typography></TableCell>
                  <TableCell>{order.storeId}</TableCell>
                  <TableCell>{order.staffId}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(order.total)}</TableCell>
                  <TableCell>{safeFormatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <Chip label={order.status} color={getStatusColor(order.status) as any} size="small" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleViewDetail(order)}><VisibilityIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog Chi Tiết */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>
          Chi Tiết Hóa Đơn: {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Cửa hàng:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedOrder.storeId}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Nhân viên bán hàng:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedOrder.staffId}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Thời gian:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{safeFormatDate(selectedOrder.createdAt)}</Typography>
                </Grid>
              </Grid>

              <TableContainer sx={{ border: '1px solid #eee', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f9fafb' }}>
                    <TableRow>
                      <TableCell>Tên Sản Phẩm / Biến Thể</TableCell>
                      <TableCell align="right">Số Lượng</TableCell>
                      <TableCell align="right">Đơn Giá</TableCell>
                      <TableCell align="right">Thành Tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Kiểm tra nếu rawDetails có dữ liệu mới render */}
                    {selectedOrder?.rawDetails && selectedOrder.rawDetails.length > 0 ? (
                      selectedOrder.rawDetails.map((ct: any, index: number) => {
                        // 💡 Bọc lót mọi trường hợp lồng nhau để lấy tên
                        const productName = 
                          ct?.bienThe?.sanPham?.tenSanPham || 
                          ct?.bienThe?.tenBienThe || 
                          ct?.sanPham?.tenSanPham || // Dự phòng trường hợp gửi thẳng tên sản phẩm
                          ct?.tenSanPham || 
                          'Sản phẩm không tên';

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {productName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {ct?.bienThe?.maSku || '---'}
                              </Typography>
                            </TableCell>
                            
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 700 }}>
                                {ct?.soLuong || 0}
                              </Typography>
                            </TableCell>
                            
                            <TableCell align="right">
                              {formatCurrency(ct?.donGia || 0)}
                            </TableCell>
                            
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatCurrency(ct?.thanhTien || 0)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Không tìm thấy chi tiết sản phẩm. Vui lòng kiểm tra lại Backend.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="body1">Tạm tính: {formatCurrency(selectedOrder.subtotal)}</Typography>
                <Typography variant="body1" color="error">Chiết khấu: -{formatCurrency(selectedOrder.discount)}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 1 }}>
                  Tổng cộng: {formatCurrency(selectedOrder.total)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
       <DialogActions>
  <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
  
  {/* ✅ Thêm sự kiện onClick vào nút In này */}
  <Button 
    variant="contained" 
    startIcon={<PrintIcon />} 
    onClick={handlePrintReceipt}
  >
    In Lại Hóa Đơn
  </Button>
  
</DialogActions>
      </Dialog>
    </Box>
  );
};