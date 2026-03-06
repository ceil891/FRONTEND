import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Payment as PaymentIcon, Add as AddIcon, Search as SearchIcon,
  Visibility as VisibilityIcon, Print as PrintIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Dữ liệu mẫu Phiếu Chi
const mockPayments = [
  { id: 'PC260301', date: '2026-03-05T09:00:00', receiver: 'Điện Lực TP', amount: 3500000, reason: 'Thanh toán tiền điện tháng 2', method: 'Chuyển khoản', status: 'COMPLETED' },
  { id: 'PC260302', date: '2026-03-05T14:30:00', receiver: 'Nhà cung cấp A', amount: 12000000, reason: 'Thanh toán công nợ đợt 1', method: 'Chuyển khoản', status: 'COMPLETED' },
  { id: 'PC260303', date: '2026-03-06T10:00:00', receiver: 'Nhân viên tạp vụ', amount: 500000, reason: 'Chi tiền mua dụng cụ vệ sinh', method: 'Tiền mặt', status: 'COMPLETED' },
];

export const PaymentPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({ receiver: '', amount: '', reason: '', method: 'TRANSFER' });

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleSave = () => {
    if (!formData.receiver || !formData.amount) {
      return showToast('Vui lòng nhập người nhận và số tiền', 'warning');
    }
    showToast('Tạo phiếu chi thành công!', 'success');
    setOpenDialog(false);
    setFormData({ receiver: '', amount: '', reason: '', method: 'TRANSFER' });
  };

  const filteredPayments = mockPayments.filter(p => 
    p.id.includes(searchQuery) || p.receiver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PaymentIcon color="error" sx={{ fontSize: 32 }} />
          Quản Lý Phiếu Chi
        </Typography>
        <Button 
          variant="contained" color="error" startIcon={<AddIcon />} 
          onClick={() => setOpenDialog(true)}
          sx={{ fontWeight: 600, boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)' }}
        >
          Lập Phiếu Chi
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField
            size="small" placeholder="Tìm kiếm theo mã phiếu, người nhận..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: '400px' }, mb: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: '#fef2f2' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Mã Phiếu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày Lập</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Người Nhận Tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Lý Do Chi</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hình Thức</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#991b1b' }}>Số Tiền</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell><Chip label={row.id} size="small" sx={{ fontWeight: 600, color: '#991b1b', bgcolor: '#fee2e2' }} /></TableCell>
                    <TableCell>{new Date(row.date).toLocaleString('vi-VN')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.receiver}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell>{row.method}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(row.amount)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary"><VisibilityIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="default"><PrintIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* DIALOG LẬP PHIẾU CHI */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#dc2626', bgcolor: '#fef2f2' }}>LẬP PHIẾU CHI MỚI</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Họ tên người/đơn vị nhận" fullWidth value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} required />
            <TextField label="Số tiền chi (VNĐ)" type="number" fullWidth value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
            <FormControl fullWidth>
              <InputLabel>Phương thức thanh toán</InputLabel>
              <Select value={formData.method} label="Phương thức thanh toán" onChange={(e) => setFormData({...formData, method: e.target.value})}>
                <MenuItem value="CASH">Tiền mặt</MenuItem>
                <MenuItem value="TRANSFER">Chuyển khoản ngân hàng</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Lý do chi tiền" fullWidth multiline rows={3} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="VD: Trả tiền nhập hàng, trả lương..." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy Bỏ</Button>
          <Button variant="contained" color="error" onClick={handleSave} sx={{ fontWeight: 600 }}>Tạo Phiếu Chi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};