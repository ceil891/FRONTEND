import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, Grid, TextField, Button
} from '@mui/material';
import { Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const mockStorePerformance = [
  { id: 'CH01', name: 'Cửa hàng Hà Nội', revenue: 450000000, target: 400000000, orders: 1250, customers: 980 },
  { id: 'CH02', name: 'Cửa hàng Hồ Chí Minh', revenue: 380000000, target: 500000000, orders: 950, customers: 820 },
  { id: 'CH03', name: 'Cửa hàng Đà Nẵng', revenue: 150000000, target: 150000000, orders: 420, customers: 390 },
];

export const StorePerformanceReport: React.FC = () => {
  const [month, setMonth] = useState('2026-03');
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUpIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
          So Sánh Hiệu Suất Chi Nhánh
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" type="month" label="Tháng đánh giá" InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} />
          <Button variant="contained" sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>Lọc</Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Chi Nhánh</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Doanh Thu (VNĐ)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Mục Tiêu (KPI)</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '25%' }}>% Hoàn Thành</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Số Đơn Hàng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Khách Hàng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockStorePerformance.map((row) => {
                  const progress = (row.revenue / row.target) * 100;
                  const progressColor = progress >= 100 ? 'success' : progress >= 75 ? 'primary' : 'error';
                  
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</TableCell>
                      <TableCell align="right"><Typography fontWeight={700} color="#15803d">{formatCurrency(row.revenue)}</Typography></TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(row.target)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={Math.min(progress, 100)} color={progressColor} sx={{ height: 8, borderRadius: 4 }} />
                          </Box>
                          <Typography variant="body2" fontWeight={700} color={`${progressColor}.main`}>{progress.toFixed(1)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{row.orders}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{row.customers}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};