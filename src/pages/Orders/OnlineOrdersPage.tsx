import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, IconButton, CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, CheckCircle as ApproveIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';

// 👉 1. IMPORT API VÀ TOAST
import { orderAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const OnlineOrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  // 🟢 2. LOGIC LẤY DANH SÁCH ĐƠN ONLINE (PENDING) 🟢
  const loadOrders = async () => {
    try {
      setLoading(true);
      // Chỉ lấy đơn ONLINE và đang PENDING
      const res = await orderAPI.query({ channel: 'ONLINE', status: 'PENDING' });
      const dataList = res.data?.data || res.data || [];
      setRows(dataList);
    } catch (err) {
      showToast('Lỗi khi tải danh sách đơn Online', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 🟢 3. LOGIC DUYỆT ĐƠN: Đổi PENDING -> COMPLETED 🟢
  const handleApprove = async (id: number) => {
    if (!window.confirm("Bạn muốn xác nhận duyệt đơn hàng này?")) return;
    try {
      await orderAPI.updateStatus(id, 'COMPLETED');
      showToast("Đã duyệt đơn! Đơn đã chuyển sang danh sách Bán Lẻ.", "success");
      loadOrders(); // Tải lại danh sách, đơn này sẽ tự biến mất khỏi đây
    } catch (err) {
      showToast("Duyệt đơn thất bại", "error");
    }
  };

  // 🟢 4. LOGIC HỦY ĐƠN: Đổi PENDING -> CANCELLED 🟢
  const handleCancel = async (id: number) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      await orderAPI.updateStatus(id, 'CANCELLED');
      showToast("Đã hủy đơn thành công.", "warning");
      loadOrders(); // Đơn sẽ nhảy sang trang Đơn Bị Hủy
    } catch (err) {
      showToast("Hủy đơn thất bại", "error");
    }
  };

  const filtered = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.orderNumber, r.customerName, r.customerPhone].some((v) => String(v || '').toLowerCase().includes(kw))
    );
  }, [rows, searchQuery]);

  const getStatusChip = (status: string) => {
    return <Chip label="Chờ duyệt" size="small" sx={{ bgcolor: '#fef08a', color: '#854d0e', fontWeight: 600, borderRadius: 1 }} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333', textTransform: 'uppercase' }}>
          ĐƠN HÀNG ONLINE / CHỜ DUYỆT
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm kiếm đơn hàng..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
            />
            <Button size="small" variant="contained" color="success" startIcon={<ExcelIcon />}>Xuất Excel</Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Mã HĐ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ngày Đặt</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tổng Tiền</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>Không có đơn hàng online nào đang chờ.</TableCell></TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{row.orderNumber || row.maHoaDon}</TableCell>
                      <TableCell>{new Date(row.createdAt || row.ngayLap).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.customerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.customerPhone}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(row.totalAmount || row.total)}</TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          {/* NÚT DUYỆT ĐƠN */}
                          <Button 
                            size="small" variant="contained" color="success" 
                            startIcon={<ApproveIcon />} onClick={() => handleApprove(row.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Duyệt
                          </Button>
                          
                          {/* NÚT HỦY ĐƠN */}
                          <Button 
                            size="small" variant="outlined" color="error" 
                            startIcon={<DeleteIcon />} onClick={() => handleCancel(row.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Hủy
                          </Button>

                          <IconButton size="small" color="primary"><ViewIcon fontSize="small" /></IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};