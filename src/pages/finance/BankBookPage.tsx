
import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, InputAdornment, Button, Grid
} from '@mui/material';
import {
  AccountBalance as BankIcon, // Đổi icon sang Ngân hàng
  Search as SearchIcon,
  ArrowCircleDown as IncomeIcon,
  ArrowCircleUp as ExpenseIcon,
  Print as PrintIcon
} from '@mui/icons-material';

// Dữ liệu mẫu giao dịch Ngân hàng
const mockBankTransactions = [
  { id: 'CK001', date: '2026-03-05T08:30:00', type: 'INCOME', category: 'Bán hàng', description: 'Nhận CK tiền hàng Vietcombank', amountIn: 25000000, amountOut: 0, balance: 125000000, creator: 'System' },
  { id: 'CK002', date: '2026-03-05T09:15:00', type: 'EXPENSE', category: 'Nhập hàng', description: 'CK trả NCC Nước Giải Khát', amountIn: 0, amountOut: 15000000, balance: 110000000, creator: 'Kế toán trưởng' },
  { id: 'CK003', date: '2026-03-05T14:20:00', type: 'INCOME', category: 'Bán hàng', description: 'Khách hàng A quét mã QR', amountIn: 1500000, amountOut: 0, balance: 111500000, creator: 'System' },
];

export const BankBookPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const filteredTransactions = mockBankTransactions.filter(t => {
    const matchSearch = t.id.includes(searchQuery) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalIncome = mockBankTransactions.reduce((sum, t) => sum + t.amountIn, 0);
  const totalExpense = mockBankTransactions.reduce((sum, t) => sum + t.amountOut, 0);
  const currentBalance = 111500000; // Mock số dư hiện tại của tài khoản ngân hàng

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BankIcon color="info" sx={{ fontSize: 32 }} />
          Sổ Quỹ Tài Khoản Ngân Hàng
        </Typography>
        <Button variant="outlined" startIcon={<PrintIcon />} sx={{ bgcolor: 'white' }}>
          Xuất Sao Kê
        </Button>
      </Box>

      {/* THẺ SUMMARY (TÓM TẮT) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bbf7d0', borderRadius: '50%', color: '#166534' }}><IncomeIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Tiền Vào (Báo Có)</Typography>
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
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Tiền Ra (Báo Nợ)</Typography>
                <Typography variant="h5" color="#991b1b" fontWeight={800}>{formatCurrency(totalExpense)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309' }}><BankIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Số Dư Ngân Hàng Hiện Tại</Typography>
                <Typography variant="h5" color="#b45309" fontWeight={800}>{formatCurrency(currentBalance)}</Typography>
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
              size="small" placeholder="Tìm theo mã GD, diễn giải..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, minWidth: '250px' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: '200px' }}>
              <InputLabel>Loại Giao Dịch</InputLabel>
              <Select value={typeFilter} label="Loại Giao Dịch" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="ALL">Tất cả giao dịch</MenuItem>
                <MenuItem value="INCOME">Tiền vào (Báo Có)</MenuItem>
                <MenuItem value="EXPENSE">Tiền ra (Báo Nợ)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mã GD</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phân Loại</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Diễn Giải (Nội dung CK)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#16a34a' }}>Ghi Có (+)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>Ghi Nợ (-)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#b45309' }}>Số Dư</TableCell>
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
                        label={row.type === 'INCOME' ? 'Tiền vào' : 'Tiền ra'} 
                        color={row.type === 'INCOME' ? 'success' : 'error'} 
                        size="small" variant="outlined" sx={{ fontWeight: 600 }} 
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
                      <Typography sx={{ fontWeight: 700, color: '#b45309' }}>{formatCurrency(row.balance)}</Typography>
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