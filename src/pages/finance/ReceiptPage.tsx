import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Grid, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Receipt as ReceiptIcon, Add as AddIcon, Search as SearchIcon,
  Visibility as VisibilityIcon, Print as PrintIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Dữ liệu mẫu
const mockReceipts = [
  { id: 'PT260301', date: '2026-03-05T08:30:00', payer: 'Nguyễn Văn Khách', amount: 5000000, reason: 'Thu nợ cũ tháng 2', method: 'Tiền mặt', status: 'COMPLETED' },
  { id: 'PT260302', date: '2026-03-05T10:15:00', payer: 'Công ty ABC', amount: 15000000, reason: 'Tạm ứng đơn hàng sỉ', method: 'Chuyển khoản', status: 'COMPLETED' },
];

export const ReceiptPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({ payer: '', amount: '', reason: '', method: 'CASH' });

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleSave = () => {
    if (!formData.payer || !formData.amount) {
      return showToast('Vui lòng nhập người nộp và số tiền', 'warning');
    }
    showToast('Tạo phiếu thu thành công!', 'success');
    setOpenDialog(false);
    setFormData({ payer: '', amount: '', reason: '', method: 'CASH' });
  };

  const filteredReceipts = mockReceipts.filter(r => 
    r.id.includes(searchQuery) || r.payer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptIcon color="success" sx={{ fontSize: 32 }} />
          Quản Lý Phiếu Thu
        </Typography>
        <Button 
          variant="contained" color="success" startIcon={<AddIcon />} 
          onClick={() => setOpenDialog(true)}
          sx={{ fontWeight: 600, boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)' }}
        >
          Lập Phiếu Thu
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField
            size="small" placeholder="Tìm kiếm theo mã phiếu, người nộp..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: '400px' }, mb: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Mã Phiếu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày Lập</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Người Nộp Tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Lý Do Thu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hình Thức</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#166534' }}>Số Tiền</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReceipts.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell><Chip label={row.id} size="small" sx={{ fontWeight: 600, color: '#166534', bgcolor: '#dcfce7' }} /></TableCell>
                    <TableCell>{new Date(row.date).toLocaleString('vi-VN')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.payer}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell>{row.method}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, color: '#16a34a' }}>+{formatCurrency(row.amount)}</Typography>
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

      {/* DIALOG LẬP PHIẾU THU */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#166534', bgcolor: '#f0fdf4' }}>LẬP PHIẾU THU MỚI</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Họ tên người nộp" fullWidth value={formData.payer} onChange={(e) => setFormData({...formData, payer: e.target.value})} required />
            <TextField label="Số tiền thu (VNĐ)" type="number" fullWidth value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
            <FormControl fullWidth>
              <InputLabel>Phương thức thanh toán</InputLabel>
              <Select value={formData.method} label="Phương thức thanh toán" onChange={(e) => setFormData({...formData, method: e.target.value})}>
                <MenuItem value="CASH">Tiền mặt</MenuItem>
                <MenuItem value="TRANSFER">Chuyển khoản ngân hàng</MenuItem>
                <MenuItem value="CARD">Quẹt thẻ (POS)</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Lý do thu tiền" fullWidth multiline rows={3} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="VD: Khách trả nợ tháng trước..." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy Bỏ</Button>
          <Button variant="contained" color="success" onClick={handleSave} sx={{ fontWeight: 600 }}>Tạo Phiếu Thu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};