import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, TextField, Button,
  Checkbox, Pagination, CircularProgress
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
  Storefront as StoreIcon
} from '@mui/icons-material';
import { reportAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const StorePerformanceReport: React.FC = () => {
  const [month, setMonth] = useState('2026-03');
  
  // 🟢 Đã dọn sạch Mock Data, dùng mảng rỗng chờ API
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const startDate = `${month}-01`;
        const endDate = `${month}-31`; 
        
        // Gọi API lấy dữ liệu thật
        const res = await reportAPI.getStoreComparison({ startDate, endDate });
        
        // Map dữ liệu an toàn
        const apiRows = (res.data?.data || []).map((item: any, index: number) => ({
          no: index + 1,
          id: `CH${item.storeId}`,
          name: item.storeName || 'Cửa hàng chưa tên',
          revenue: Number(item.revenue || 0),
          target: Number(item.target || 1), // Tránh lỗi chia cho 0
          orders: Number(item.orders || 0),
          customers: Number(item.customers || 0), 
        }));
        
        setRows(apiRows);
      } catch (error) {
        console.error("Lỗi tải báo cáo hiệu suất:", error);
        setRows([]); // Lỗi thì hiển thị bảng rỗng
        showToast('Không thể tải dữ liệu hiệu suất chi nhánh', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          SO SÁNH HIỆU SUẤT CHI NHÁNH
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" type="month"
              value={month} onChange={(e) => setMonth(e.target.value)}
              sx={{ width: 220, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => window.print()}>In Báo Cáo</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => showToast('Đang xuất Excel...', 'info')}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Dữ liệu so sánh giữa doanh thu thực tế và chỉ tiêu kinh doanh (KPI)</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 50, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Xem</TableCell>
                  
                  {[
                    { label: 'Chi Nhánh', width: '20%' },
                    { label: 'Doanh Thu (Thực tế)', width: '15%' },
                    { label: 'Mục Tiêu (KPI)', width: '15%' },
                    { label: '% Hoàn Thành', width: '25%' },
                    { label: 'Số Đơn', width: '10%' },
                    { label: 'Khách Hàng', width: '10%' }
                  ].map((col) => (
                    <TableCell key={col.label} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: col.width }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col.label} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* 🟢 Xử lý hiển thị Loading / Rỗng / Có dữ liệu */}
                {loading ? (
                   <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                   <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>Không có dữ liệu hiệu suất trong tháng này</TableCell></TableRow>
                ) : rows.map((row) => {
                  const progress = (row.revenue / row.target) * 100;
                  const progressColor = progress >= 100 ? 'success' : progress >= 75 ? 'primary' : 'error';
                  
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StoreIcon sx={{ fontSize: 18, color: '#64748b' }} />
                          <Typography variant="body2" fontWeight={600} color="#0f172a">{row.name}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Typography variant="body2" fontWeight={700} color="#16a34a">{formatCurrency(row.revenue)}</Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Typography variant="body2" color="#64748b" fontWeight={500}>{formatCurrency(row.target)}</Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(progress, 100)} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3, 
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': { borderRadius: 3 }
                              }} 
                              color={progressColor as any}
                            />
                          </Box>
                          <Typography variant="caption" fontWeight={800} sx={{ minWidth: 45, color: progress >= 100 ? '#16a34a' : progress >= 75 ? '#0284c7' : '#dc2626' }}>
                            {progress.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }} align="right">
                        <Typography variant="body2" fontWeight={600} color="#475569">{row.orders.toLocaleString('vi-VN')}</Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }} align="right">
                        <Typography variant="body2" fontWeight={600} color="#475569">{row.customers.toLocaleString('vi-VN')}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
               1 - {rows.length} của {rows.length} chi nhánh
             </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};