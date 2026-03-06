import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, TextField, Grid,
  LinearProgress, Checkbox, Pagination, Button, Chip
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const mockPerformance = [
  { no: 1, id: 'NV01', name: 'Nguyễn Văn A', avatar: 'A', store: 'CH Hà Nội', orders: 152, revenue: 155000000, kpi: 150000000, rating: 'Xuất sắc' },
  { no: 2, id: 'NV02', name: 'Trần Thị B', avatar: 'B', store: 'CH Hồ Chí Minh', orders: 89, revenue: 85000000, kpi: 100000000, rating: 'Khá' },
  { no: 3, id: 'NV03', name: 'Lê Hoàng C', avatar: 'C', store: 'CH Hà Nội', orders: 45, revenue: 32000000, kpi: 50000000, rating: 'Cần cố gắng' },
];

export const EmployeePerformancePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const filteredStaff = mockPerformance.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          HIỆU SUẤT BÁN HÀNG NHÂN VIÊN
        </Typography>
      </Box>

      {/* THẺ TÓM TẮT (WIDGETS) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bfdbfe', borderRadius: '50%', color: '#1d4ed8' }}><PeopleIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="#1d4ed8" fontWeight={600}>Nhân Viên Đang Đánh Giá</Typography>
                <Typography variant="h5" color="#1e3a8a" fontWeight={800}>{mockPerformance.length} người</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309' }}><TrophyIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="#b45309" fontWeight={600}>Xuất Sắc Nhất Tháng</Typography>
                <Typography variant="h5" color="#78350f" fontWeight={800}>Nguyễn Văn A</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bbf7d0', borderRadius: '50%', color: '#166534' }}><TrendingUpIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="#166534" fontWeight={600}>Tỉ Lệ Hoàn Thành KPI</Typography>
                <Typography variant="h5" color="#064e3b" fontWeight={800}>82.5%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BẢNG CHUẨN RIC */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Tên nhân viên/Mã NV..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Báo Cáo</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Dữ liệu được cập nhật theo thời gian thực từ các đơn hàng POS</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 50, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Xem</TableCell>
                  
                  {['Nhân Viên', 'Chi Nhánh', 'Số Đơn', 'Doanh Thu / KPI', 'Tiến Độ KPI', 'Xếp Loại'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((row) => {
                  const progress = Math.min((row.revenue / row.kpi) * 100, 100);
                  const progressColor = progress >= 100 ? 'success' : progress >= 70 ? 'info' : 'warning';
                  
                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#e2e8f0', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>{row.avatar}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} color="#0f172a">{row.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.store}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }} align="center">{row.orders}</TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">{formatCurrency(row.revenue)}</Typography>
                        <Typography variant="caption" color="text.secondary">KPI: {formatCurrency(row.kpi)}</Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', width: '220px', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress variant="determinate" value={progress} color={progressColor as any} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9' }} />
                          </Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">{Math.round(progress)}%</Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }} align="center">
                        <Chip 
                          label={row.rating} 
                          size="small" 
                          sx={{ 
                            fontWeight: 700, fontSize: '0.75rem',
                            bgcolor: progress >= 100 ? '#dcfce7' : progress >= 70 ? '#e0f2fe' : '#fef08a',
                            color: progress >= 100 ? '#166534' : progress >= 70 ? '#075985' : '#854d0e',
                            borderRadius: 1
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {filteredStaff.length} of {filteredStaff.length} items</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};