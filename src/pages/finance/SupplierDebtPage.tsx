import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Grid
} from '@mui/material';
import {
  People as PeopleIcon, Search as SearchIcon, Payment as PaymentIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Dữ liệu mẫu
const mockDebts = [
  { id: 'NCC001', name: 'Công ty TNHH Nước Giải Khát', phone: '0988111222', totalDebt: 25000000, lastImport: '2026-03-01' },
  { id: 'NCC002', name: 'Nhà phân phối Trái Cây Miền Tây', phone: '0909333444', totalDebt: 8500000, lastImport: '2026-03-03' },
  { id: 'NCC003', name: 'Đại lý Bánh Kẹo Hùng Phát', phone: '0977555666', totalDebt: 0, lastImport: '2026-02-28' },
];

export const SupplierDebtPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleOpenPayment = (supplier: any) => {
    setSelectedSupplier(supplier);
    setPaymentAmount(supplier.totalDebt.toString());
    setOpenDialog(true);
  };

  const handlePayDebt = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return showToast('Số tiền thanh toán không hợp lệ', 'warning');
    }
    showToast(`Đã ghi nhận thanh toán nợ cho ${selectedSupplier?.name}`, 'success');
    setOpenDialog(false);
  };

  const totalSystemDebt = mockDebts.reduce((sum, item) => sum + item.totalDebt, 0);

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PeopleIcon color="error" sx={{ fontSize: 32 }} />
          Công Nợ Nhà Cung Cấp
        </Typography>
      </Box>

      {/* THẺ TỔNG QUAN */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Nợ Cần Trả Hiện Tại</Typography>
              <Typography variant="h4" color="#dc2626" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(totalSystemDebt)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField
            size="small" placeholder="Tìm kiếm nhà cung cấp..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: '400px' }, mb: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Mã NCC</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên Nhà Cung Cấp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Điện Thoại</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nhập Hàng Gần Nhất</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>Dư Nợ Hiện Tại</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockDebts.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600} color="text.secondary">{row.id}</Typography></TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{new Date(row.lastImport).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 800, color: row.totalDebt > 0 ? '#dc2626' : '#16a34a' }}>
                        {formatCurrency(row.totalDebt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="info" title="Lịch sử giao dịch" sx={{ mr: 1 }}><HistoryIcon fontSize="small" /></IconButton>
                      <Button 
                        size="small" variant="contained" color="error" 
                        disabled={row.totalDebt === 0}
                        onClick={() => handleOpenPayment(row)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                      >
                        Trả nợ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* DIALOG THANH TOÁN NỢ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#dc2626', bgcolor: '#fef2f2' }}>THANH TOÁN CÔNG NỢ</DialogTitle>
        <DialogContent dividers>
          {selectedSupplier && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="body2" color="text.secondary">Nhà cung cấp:</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{selectedSupplier.name}</Typography>
                <Typography variant="body2" color="text.secondary">Dư nợ hiện tại:</Typography>
                <Typography variant="h6" color="error" fontWeight={700}>{formatCurrency(selectedSupplier.totalDebt)}</Typography>
              </Box>
              
              <TextField 
                label="Số tiền trả (VNĐ)" type="number" fullWidth 
                value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} 
                autoFocus
              />
              <TextField label="Ghi chú thanh toán" fullWidth multiline rows={2} placeholder="VD: CK trả nợ đợt 1 tháng 3..." />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handlePayDebt} sx={{ fontWeight: 600 }}>Xác Nhận Trả Nợ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};