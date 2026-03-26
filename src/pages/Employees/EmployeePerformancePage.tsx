import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, TextField, Grid,
  LinearProgress, Pagination, Button, Chip, CircularProgress, Stack
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Sync as SyncIcon
} from '@mui/icons-material';

// 🟢 IMPORT API VÀ STORE 🟢
import { reportAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import dayjs from 'dayjs';

export const EmployeePerformancePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const { showToast } = useToastStore();

  // --- 🟢 LOGIC LẤY DỮ LIỆU TỪ BACKEND 🟢 ---
  const fetchPerformance = async () => {
    try {
      setLoading(true);
      // Mặc định lấy báo cáo trong tháng hiện tại
      const start = dayjs().startOf('month').format('YYYY-MM-DD');
      const end = dayjs().format('YYYY-MM-DD');
      
      const res = await reportAPI.getEmployeePerformance({ startDate: start, endDate: end });
      const result = res.data?.data || res.data || [];
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      showToast('Không thể tải dữ liệu hiệu suất nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  // --- XỬ LÝ TÌM KIẾM ---
  const filteredStaff = useMemo(() => {
    const kw = searchQuery.toLowerCase().trim();
    return data.filter(s => 
      (s.fullName || '').toLowerCase().includes(kw) || 
      (s.employeeCode || '').toLowerCase().includes(kw)
    );
  }, [data, searchQuery]);

  // --- TÍNH TOÁN CÁC CON SỐ TỔNG HỢP ---
  const topEmployee = useMemo(() => [...data].sort((a, b) => b.totalRevenue - a.totalRevenue)[0], [data]);
  const avgCompletion = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + (item.completionRate || 0), 0) / data.length;
  }, [data]);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase' }}>
          HIỆU SUẤT BÁN HÀNG NHÂN VIÊN
        </Typography>
        <Button startIcon={<SyncIcon />} onClick={fetchPerformance} size="small" variant="outlined">Làm mới</Button>
      </Box>

      {/* THẺ TÓM TẮT (WIDGETS) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bfdbfe', borderRadius: '50%', color: '#1d4ed8', display: 'flex' }}><PeopleIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="#1d4ed8" fontWeight={700}>Nhân Viên Đang Đánh Giá</Typography>
                <Typography variant="h4" color="#1e3a8a" fontWeight={800}>{data.length} <small style={{fontSize: '1rem'}}>người</small></Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309', display: 'flex' }}><TrophyIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="#b45309" fontWeight={700}>Xuất Sắc Nhất Tháng</Typography>
                <Typography variant="h5" color="#78350f" fontWeight={800} noWrap sx={{ maxWidth: 200 }}>
                  {topEmployee ? topEmployee.fullName : '---'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bbf7d0', borderRadius: '50%', color: '#166534', display: 'flex' }}><TrendingUpIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="#166534" fontWeight={700}>Tỉ Lệ Hoàn Thành KPI</Typography>
                <Typography variant="h4" color="#064e3b" fontWeight={800}>{Math.round(avgCompletion)}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BẢNG DỮ LIỆU THẬT */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm tên nhân viên hoặc mã..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 320, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0284c7', borderRadius: 2, textTransform: 'none' }}>Xuất Excel</Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Nhân Viên</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Chi Nhánh</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="center">Số Đơn</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Doanh Thu / KPI</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }} width={250}>Tiến Độ KPI</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="center">Xếp Loại</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={30} /><Typography sx={{mt: 2}} color="textSecondary">Đang tính toán hiệu suất...</Typography></TableCell></TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><Typography color="textSecondary">Không có dữ liệu nhân viên nào trong kỳ này.</Typography></TableCell></TableRow>
                ) : filteredStaff.map((row, index) => {
                  const progress = row.completionRate || 0;
                  const progressColor = progress >= 100 ? '#22c55e' : progress >= 80 ? '#0ea5e9' : '#f59e0b';
                  
                  return (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#e2e8f0', color: '#475569', fontWeight: 800, width: 36, height: 36 }}>
                            {row.fullName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">{row.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.employeeCode || 'N/A'}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontWeight: 500 }}>{row.storeName}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#0369a1' }}>{row.orderCount}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={800} color="#0f172a">{formatCurrency(row.totalRevenue)}</Typography>
                        <Typography variant="caption" color="text.secondary">KPI: {formatCurrency(row.kpiAmount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(progress, 100)} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4, 
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': { bgcolor: progressColor }
                              }} 
                            />
                          </Box>
                          <Typography variant="caption" fontWeight={800} color={progressColor}>{Math.round(progress)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={row.rank || 'Chưa xếp loại'} 
                          size="small" 
                          sx={{ 
                            fontWeight: 800, fontSize: '0.7rem',
                            bgcolor: progress >= 100 ? '#dcfce7' : progress >= 80 ? '#e0f2fe' : '#fef3c7',
                            color: progress >= 100 ? '#166534' : progress >= 80 ? '#075985' : '#92400e',
                            borderRadius: 1.5
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
             <Typography variant="body2" color="text.secondary">Hiển thị {filteredStaff.length} nhân sự</Typography>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};