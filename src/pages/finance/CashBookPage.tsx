import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, InputAdornment, Button, Grid
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Search as SearchIcon,
  ArrowCircleDown as IncomeIcon, // Icon Thu (Tiền vào)
  ArrowCircleUp as ExpenseIcon,  // Icon Chi (Tiền ra)
  Print as PrintIcon
} from '@mui/icons-material';

// Dữ liệu mẫu (Sau này bạn gọi API thay thế)
const mockTransactions = [
  { id: 'PT001', date: '2026-03-05T08:30:00', type: 'INCOME', category: 'Bán hàng', description: 'Thu tiền mặt đơn hàng #1001', amountIn: 1500000, amountOut: 0, balance: 1500000, creator: 'Nguyễn Văn A' },
  { id: 'PC001', date: '2026-03-05T09:15:00', type: 'EXPENSE', category: 'Chi phí vận hành', description: 'Chi trả tiền nước đóng chai', amountIn: 0, amountOut: 50000, balance: 1450000, creator: 'Trần Thị B' },
  { id: 'PT002', date: '2026-03-05T10:00:00', type: 'INCOME', category: 'Bán hàng', description: 'Thu tiền mặt đơn hàng #1002', amountIn: 450000, amountOut: 0, balance: 1900000, creator: 'Nguyễn Văn A' },
  { id: 'PC002', date: '2026-03-05T14:20:00', type: 'EXPENSE', category: 'Nhập hàng', description: 'Chi trả tiền nhập trái cây NPP X', amountIn: 0, amountOut: 1000000, balance: 900000, creator: 'Nguyễn Văn A' },
];

export const CashBookPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Lọc dữ liệu
  const filteredTransactions = mockTransactions.filter(t => {
    const matchSearch = t.id.includes(searchQuery) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  // Tính toán tóm tắt
  const totalIncome = mockTransactions.reduce((sum, t) => sum + t.amountIn, 0);
  const totalExpense = mockTransactions.reduce((sum, t) => sum + t.amountOut, 0);
  const currentBalance = totalIncome - totalExpense; // Giả sử tồn đầu kỳ = 0

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WalletIcon color="primary" sx={{ fontSize: 32 }} />
          Sổ Quỹ Tiền Mặt
        </Typography>
        <Button variant="outlined" startIcon={<PrintIcon />} sx={{ bgcolor: 'white' }}>
          Xuất Báo Cáo
        </Button>
      </Box>

      {/* THẺ SUMMARY (TÓM TẮT) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bbf7d0', borderRadius: '50%', color: '#166534' }}><IncomeIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Thu Tiền Mặt</Typography>
                <Typography variant="h5" color="#166534" fontWeight={800}>{formatCurrency(totalIncome)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fecaca', borderRadius: '50%', color: '#991b1b' }}><ExpenseIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Chi Tiền Mặt</Typography>
                <Typography variant="h5" color="#991b1b" fontWeight={800}>{formatCurrency(totalExpense)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bfdbfe', borderRadius: '50%', color: '#1e40af' }}><WalletIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tồn Quỹ Hiện Tại</Typography>
                <Typography variant="h5" color="#1e40af" fontWeight={800}>{formatCurrency(currentBalance)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTER & BẢNG */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Tìm theo mã phiếu, lý do..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, minWidth: '250px' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: '200px' }}>
              <InputLabel>Loại Phiếu</InputLabel>
              <Select value={typeFilter} label="Loại Phiếu" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="ALL">Tất cả giao dịch</MenuItem>
                <MenuItem value="INCOME">Chỉ Phiếu Thu</MenuItem>
                <MenuItem value="EXPENSE">Chỉ Phiếu Chi</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mã Phiếu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Loại Thu/Chi</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Diễn Giải</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#16a34a' }}>Số Tiền Thu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>Số Tiền Chi</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#2563eb' }}>Tồn Quỹ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{new Date(row.date).toLocaleDateString('vi-VN')}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(row.date).toLocaleTimeString('vi-VN')}</Typography>
                    </TableCell>
                    <TableCell><Chip label={row.id} size="small" sx={{ fontWeight: 600, bgcolor: '#e2e8f0' }} /></TableCell>
                    <TableCell>
                      <Chip 
                        label={row.type === 'INCOME' ? 'Phiếu Thu' : 'Phiếu Chi'} 
                        color={row.type === 'INCOME' ? 'success' : 'error'} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontWeight: 600 }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.category}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.description}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {row.amountIn > 0 && <Typography sx={{ fontWeight: 700, color: '#16a34a' }}>+{formatCurrency(row.amountIn)}</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {row.amountOut > 0 && <Typography sx={{ fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(row.amountOut)}</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, color: '#2563eb' }}>{formatCurrency(row.balance)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};