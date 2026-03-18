import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Print as PrintIcon,
  Sync as SyncIcon, Payments as PaymentIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { cashbookAPI, CashbookTransactionResponse } from '../../api/client';
import dayjs from 'dayjs';

export const PaymentPage: React.FC = () => {
  // --- STATES QUẢN LÝ DỮ LIỆU ---
  const [payments, setPayments] = useState<CashbookTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // --- STATES CHO DIALOG LẬP PHIẾU ---
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    receiver: '',
    amount: '',
    reason: '',
    method: 'CASH' as 'CASH' | 'BANK_TRANSFER'
  });

  // --- STATES CHO DIALOG XEM CHI TIẾT ---
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CashbookTransactionResponse | null>(null);

  const { showToast } = useToastStore();

  // 1. Hàm lấy dữ liệu Phiếu Chi từ API
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await cashbookAPI.getAll({
        type: 'EXPENSE', // Chỉ lấy loại CHI
        method: methodFilter === 'ALL' ? undefined : (methodFilter as any),
        search: searchQuery
      });
      const data = (res.data as any)?.data || res.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast('Lỗi khi tải danh sách phiếu chi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter]);

  // 2. Hàm lưu phiếu chi mới
  const handleSave = async () => {
    if (!formData.receiver || !formData.amount) {
      return showToast('Vui lòng nhập đủ thông tin bắt buộc', 'warning');
    }
    try {
      setLoading(true);
      await cashbookAPI.create({
        type: 'EXPENSE',
        method: formData.method,
        category: "Chi phí vận hành", // Hạng mục mặc định
        referenceName: formData.receiver,
        amount: Number(formData.amount),
        description: formData.reason,
        storeId: 1, // Nên lấy từ Context Store
        creatorId: 1 // Nên lấy từ Auth User
      });

      showToast('Tạo phiếu chi thành công & Đã sync Google Sheets!', 'success');
      setOpenAddDialog(false);
      setFormData({ receiver: '', amount: '', reason: '', method: 'CASH' });
      fetchPayments();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi khi tạo phiếu chi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Hàm mở xem chi tiết
  const handleOpenView = (payment: CashbookTransactionResponse) => {
    setSelectedPayment(payment);
    setOpenViewDialog(true);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="error" /> DANH SÁCH PHIẾU CHI
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} sx={{ bgcolor: '#00a65a', textTransform: 'none' }}>
          Lập Phiếu Chi
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <TextField 
            size="small" placeholder="Mã phiếu / Người nhận..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel>Hình thức</InputLabel>
            <Select value={methodFilter} label="Hình thức" onChange={(e) => setMethodFilter(e.target.value)}>
              <MenuItem value="ALL">Tất cả hình thức</MenuItem>
              <MenuItem value="CASH">Tiền mặt</MenuItem>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<SyncIcon />} onClick={fetchPayments} variant="outlined" sx={{ textTransform: 'none' }}>Làm mới</Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ngày Lập</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã Phiếu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Người Nhận</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hình Thức</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Số Tiền (-)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Không tìm thấy phiếu chi nào</TableCell></TableRow>
              ) : payments.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{dayjs(row.transactionDate).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>{row.code}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.referenceName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'} 
                      size="small" color={row.method === 'CASH' ? 'warning' : 'info'} variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 800 }}>
                    -{formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => handleOpenView(row)}>Xem</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* --- DIALOG XEM CHI TIẾT --- */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', bgcolor: '#fef2f2' }}>CHI TIẾT PHIẾU CHI</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedPayment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Mã phiếu:</Typography>
                <Typography variant="body2" fontWeight={700} color="error">{selectedPayment.code}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                <Typography variant="body2">{dayjs(selectedPayment.transactionDate).format('DD/MM/YYYY HH:mm:ss')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Người nhận tiền:</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedPayment.referenceName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Số tiền chi:</Typography>
                <Typography variant="h6" color="#dc2626" fontWeight={800}>{formatCurrency(selectedPayment.amount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Phương thức:</Typography>
                <Typography variant="body2">{selectedPayment.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Lý do chi / Ghi chú:</Typography>
                <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, mt: 0.5 }}>
                  {selectedPayment.description || 'Không có ghi chú'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()} startIcon={<PrintIcon />}>In Phiếu</Button>
          <Button onClick={() => setOpenViewDialog(false)} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG LẬP PHIẾU MỚI --- */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>LẬP PHIẾU CHI MỚI</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="Người nhận tiền (*)" fullWidth size="small" autoFocus value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} />
          <TextField label="Số tiền chi (VNĐ) (*)" type="number" fullWidth size="small" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
          <FormControl fullWidth size="small">
            <InputLabel>Hình thức</InputLabel>
            <Select value={formData.method} label="Hình thức" onChange={(e) => setFormData({...formData, method: e.target.value as any})}>
              <MenuItem value="CASH">Tiền mặt</MenuItem>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Lý do chi / Ghi chú" multiline rows={2} fullWidth size="small" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#00a65a' }}>
            {loading ? 'Đang lưu...' : 'Lập Phiếu Chi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};