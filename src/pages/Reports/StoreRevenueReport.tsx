import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, TextField, Button,
  Checkbox, Pagination
} from '@mui/material';
import {
  Money as MoneyIcon,
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { reportAPI } from '../../api/client';

const mockRevenue = [
  { no: 1, date: '2026-03-05', store1: 25000000, store2: 18000000, orders1: 45, orders2: 32 },
  { no: 2, date: '2026-03-04', store1: 22000000, store2: 19500000, orders1: 40, orders2: 35 },
  { no: 3, date: '2026-03-03', store1: 28000000, store2: 21000000, orders1: 50, orders2: 38 },
];

export const StoreRevenueReport: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-05');
  const [rows, setRows] = useState(mockRevenue);

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hnRes, hcmRes] = await Promise.all([
          reportAPI.getRevenue({ startDate: dateFrom, endDate: dateTo, period: 'day', storeId: 1 }),
          reportAPI.getRevenue({ startDate: dateFrom, endDate: dateTo, period: 'day', storeId: 2 }),
        ]);

        const hnMap = new Map((hnRes.data.data || []).map((i) => [i.period, i]));
        const hcmMap = new Map((hcmRes.data.data || []).map((i) => [i.period, i]));
        const periods = Array.from(new Set([...hnMap.keys(), ...hcmMap.keys()]));

        const apiRows = periods.map((period, index) => {
          const hn = hnMap.get(period);
          const hcm = hcmMap.get(period);
          return {
            no: index + 1,
            date: period,
            store1: Number(hn?.revenue || 0),
            store2: Number(hcm?.revenue || 0),
            orders1: Number(hn?.orders || 0),
            orders2: Number(hcm?.orders || 0),
          };
        });

        if (apiRows.length > 0) setRows(apiRows);
      } catch (error) {
        setRows(mockRevenue);
      }
    };
    fetchData();
  }, [dateFrom, dateTo]);

  const totalStore1 = rows.reduce((sum, item) => sum + item.store1, 0);
  const totalStore2 = rows.reduce((sum, item) => sum + item.store2, 0);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          BÁO CÁO DOANH THU THEO CHI NHÁNH
        </Typography>
      </Box>

      {/* BLOCK 1: TỔNG HỢP NHANH (WIDGETS) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="#166534" fontWeight={600} sx={{ textTransform: 'uppercase' }}>HÀ NỘI (Tổng doanh thu kỳ)</Typography>
              <Typography variant="h4" color="#15803d" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(totalStore1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="#1d4ed8" fontWeight={600} sx={{ textTransform: 'uppercase' }}>TP. HCM (Tổng doanh thu kỳ)</Typography>
              <Typography variant="h4" color="#1e40af" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(totalStore2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BLOCK 2: BẢNG DỮ LIỆU CHI TIẾT CHUẨN RIC */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                <TextField size="small" type="date" label="Từ" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} sx={{ width: 150, bgcolor: 'white' }} />
                <TextField size="small" type="date" label="Đến" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} sx={{ width: 150, bgcolor: 'white' }} />
            </Box>
            
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Báo Cáo</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Chi tiết doanh số và đơn hàng theo từng ngày</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 50, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Xem</TableCell>
                  
                  {['Ngày Báo Cáo', 'Doanh Thu Hà Nội', 'Đơn HN', 'Doanh Thu HCM', 'Đơn HCM', 'Tổng Cộng Ngày'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.date} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#475569', p: 1.5 }}>
                      {new Date(row.date).toLocaleDateString('vi-VN')}
                    </TableCell>

                    {/* Dữ liệu Hà Nội */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>
                      {formatCurrency(row.store1)}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }} align="center">
                      {row.orders1}
                    </TableCell>

                    {/* Dữ liệu HCM */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>
                      {formatCurrency(row.store2)}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }} align="center">
                      {row.orders2}
                    </TableCell>

                    {/* Tổng cộng */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', bgcolor: '#f8fafc', p: 1.5 }}>
                      {formatCurrency(row.store1 + row.store2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
               1 - {rows.length} of {rows.length} items
             </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};