import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, Grid, Pagination
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  ArrowCircleDown as IncomeIcon,
  ArrowCircleUp as ExpenseIcon,
  Print as PrintIcon,
  Add as AddIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  SyncAlt as SyncIcon
} from '@mui/icons-material';

// Dữ liệu mẫu giao dịch Ngân hàng
const mockBankTransactions = [
  { no: 1, id: 'CK001', date: '2026-03-05 08:30:00', type: 'INCOME', category: 'Bán hàng', description: 'Nhận CK tiền hàng Vietcombank', amountIn: 25000000, amountOut: 0, balance: 125000000, creator: 'System' },
  { no: 2, id: 'CK002', date: '2026-03-05 09:15:00', type: 'EXPENSE', category: 'Nhập hàng', description: 'CK trả NCC Nước Giải Khát', amountIn: 0, amountOut: 15000000, balance: 110000000, creator: 'Kế toán trưởng' },
  { no: 3, id: 'CK003', date: '2026-03-05 14:20:00', type: 'INCOME', category: 'Bán hàng', description: 'Khách hàng A quét mã QR', amountIn: 1500000, amountOut: 0, balance: 111500000, creator: 'System' },
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          SỔ QUỸ TÀI KHOẢN NGÂN HÀNG
        </Typography>
      </Box>

      {/* THẺ SUMMARY (TÓM TẮT) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
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
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
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
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309' }}><BankIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Số Dư Ngân Hàng Hiện Tại</Typography>
                <Typography variant="h5" color="#b45309" fontWeight={800}>{formatCurrency(currentBalance)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTER & BẢNG - CHUẨN RIC */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã GD/Diễn giải..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <FormControl size="small" sx={{ minWidth: 180, mr: 1 }}>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ bgcolor: 'white', '& .MuiSelect-select': { py: 0.8, fontSize: '0.875rem' } }}>
                <MenuItem value="ALL">Tất cả giao dịch</MenuItem>
                <MenuItem value="INCOME">Chỉ Tiền Vào (+)</MenuItem>
                <MenuItem value="EXPENSE">Chỉ Tiền Ra (-)</MenuItem>
              </Select>
            </FormControl>

            <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Tạo Giao Dịch</Button>
            <Button size="small" variant="contained" startIcon={<SyncIcon />} sx={{ bgcolor: '#39cccc', '&:hover': { bgcolor: '#33b8b8' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Đồng Bộ Bank</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Sổ Quỹ</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  
                  {['Thời Gian', 'Mã GD', 'Phân Loại', 'Diễn Giải (Nội dung CK)', 'Ghi Có (+)', 'Ghi Nợ (-)', 'Số Dư Cuối'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.date}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>{row.id}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      {row.type === 'INCOME' ? 
                        <Chip label="Tiền vào" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                        <Chip label="Tiền ra" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                      }
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{row.category}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.description}</Typography>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', p: 1.5 }}>
                      {row.amountIn > 0 ? `+${formatCurrency(row.amountIn)}` : ''}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', p: 1.5 }}>
                      {row.amountOut > 0 ? `-${formatCurrency(row.amountOut)}` : ''}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#b45309', p: 1.5 }}>
                      {formatCurrency(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {filteredTransactions.length} of {filteredTransactions.length} items</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};