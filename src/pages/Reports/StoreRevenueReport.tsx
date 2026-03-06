import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, TextField
} from '@mui/material';
import {
  Assessment as AssessmentIcon, AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon, Store as StoreIcon
} from '@mui/icons-material';

const mockRevenue = [
  { date: '2026-03-05', store1: 25000000, store2: 18000000, orders1: 45, orders2: 32 },
  { date: '2026-03-04', store1: 22000000, store2: 19500000, orders1: 40, orders2: 35 },
  { date: '2026-03-03', store1: 28000000, store2: 21000000, orders1: 50, orders2: 38 },
];

export const StoreRevenueReport: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-05');

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const totalStore1 = mockRevenue.reduce((sum, item) => sum + item.store1, 0);
  const totalStore2 = mockRevenue.reduce((sum, item) => sum + item.store2, 0);

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MoneyIcon color="success" sx={{ fontSize: 32 }} />
          Doanh Thu Theo Cửa Hàng
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" type="date" label="Từ ngày" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <TextField size="small" type="date" label="Đến ngày" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Cửa Hàng Hà Nội</Typography>
              <Typography variant="h4" color="#166534" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(totalStore1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Cửa Hàng Hồ Chí Minh</Typography>
              <Typography variant="h4" color="#1d4ed8" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(totalStore2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#166534' }}>Doanh Thu Hà Nội</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#166534' }}>Đơn Hàng (HN)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#1d4ed8' }}>Doanh Thu HCM</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#1d4ed8' }}>Đơn Hàng (HCM)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tổng Doanh Thu Ngày</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockRevenue.map((row) => (
                  <TableRow key={row.date} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{new Date(row.date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#15803d' }}>{formatCurrency(row.store1)}</TableCell>
                    <TableCell align="right">{row.orders1}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#1e40af' }}>{formatCurrency(row.store2)}</TableCell>
                    <TableCell align="right">{row.orders2}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={800} color="#0f172a">{formatCurrency(row.store1 + row.store2)}</Typography>
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