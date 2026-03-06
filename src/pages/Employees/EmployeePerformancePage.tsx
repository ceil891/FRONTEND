import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, TextField, Grid,
  InputAdornment, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
  Assessment as AssessmentIcon, Search as SearchIcon,
  EmojiEvents as TrophyIcon, TrendingUp as TrendingUpIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const mockPerformance = [
  { id: 'NV01', name: 'Nguyễn Văn A', avatar: 'A', store: 'CH Hà Nội', orders: 152, revenue: 155000000, kpi: 150000000, rating: 'Xuất sắc' },
  { id: 'NV02', name: 'Trần Thị B', avatar: 'B', store: 'CH Hồ Chí Minh', orders: 89, revenue: 85000000, kpi: 100000000, rating: 'Khá' },
  { id: 'NV03', name: 'Lê Hoàng C', avatar: 'C', store: 'CH Hà Nội', orders: 45, revenue: 32000000, kpi: 50000000, rating: 'Cần cố gắng' },
];

export const EmployeePerformancePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const filteredStaff = mockPerformance.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssessmentIcon color="primary" sx={{ fontSize: 32 }} />
          Hiệu Suất Bán Hàng
        </Typography>
      </Box>

      {/* TÓM TẮT */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bfdbfe', borderRadius: '50%', color: '#1d4ed8' }}><PeopleIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Nhân Viên Đang Đánh Giá</Typography>
                <Typography variant="h5" color="#1d4ed8" fontWeight={800}>{mockPerformance.length} người</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309' }}><TrophyIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Nhân Viên Xuất Sắc Nhất</Typography>
                <Typography variant="h5" color="#b45309" fontWeight={800}>Nguyễn Văn A</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <TextField
            size="small" placeholder="Tìm kiếm nhân viên..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: '300px' }, mb: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nhân Viên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Chi Nhánh</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Số Đơn Hàng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Doanh Thu (VNĐ)</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '25%' }}>Tiến Độ KPI</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Xếp Loại</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((row) => {
                  const progress = Math.min((row.revenue / row.kpi) * 100, 100);
                  const progressColor = progress >= 100 ? 'success' : progress >= 70 ? 'info' : 'warning';
                  
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '14px' }}>{row.avatar}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.id}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{row.store}</TableCell>
                      <TableCell align="center"><Typography fontWeight={600} color="primary">{row.orders}</Typography></TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color="#0f172a">{formatCurrency(row.revenue)}</Typography>
                        <Typography variant="caption" color="text.secondary">KPI: {formatCurrency(row.kpi)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={progress} color={progressColor} sx={{ height: 8, borderRadius: 4 }} />
                          </Box>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">{Math.round(progress)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" sx={{ 
                          fontWeight: 700, px: 1.5, py: 0.5, borderRadius: 1,
                          bgcolor: progress >= 100 ? '#dcfce7' : progress >= 70 ? '#e0f2fe' : '#fef08a',
                          color: progress >= 100 ? '#166534' : progress >= 70 ? '#075985' : '#854d0e'
                        }}>
                          {row.rating}
                        </Typography>
                      </TableCell>
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