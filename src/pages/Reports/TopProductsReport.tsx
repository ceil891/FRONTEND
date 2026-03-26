import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, Avatar, TextField,
  Button, Checkbox, Pagination, CircularProgress, Chip
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { reportAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const TopProductsReport: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-31');
  
  // 🟢 ĐÃ XÓA MOCK DATA: Khởi tạo bằng mảng rỗng []
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  
  // Tránh chia cho 0 khi mảng rỗng
  const maxSold = Math.max(...rows.map((p) => p.sold), 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportAPI.getProductSales({ startDate: dateFrom, endDate: dateTo });
        
        // Bóc tách dữ liệu thật từ Backend
        const apiRows = (res.data?.data || res.data || []).map((item: any, index: number) => ({
          rank: index + 1,
          name: item.productName || 'Sản phẩm không tên',
          category: item.categoryName || 'Chưa phân loại',
          sold: Number(item.quantitySold || 0),
          revenue: Number(item.revenue || 0),
          stock: Number(item.stock || 0), 
        }));
        
        setRows(apiRows);
      } catch (error) {
        console.error("Lỗi lấy báo cáo top sản phẩm:", error);
        // 🟢 ĐÃ XÓA MOCK DATA: Khi lỗi API thì set mảng rỗng
        setRows([]); 
        showToast('Không thể tải báo cáo top sản phẩm', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // Hàm lấy màu cho huy hiệu Top 3
  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return { bg: 'linear-gradient(45deg, #facc15, #eab308)', color: '#fff', shadow: '0 2px 8px rgba(234, 179, 8, 0.4)' };
      case 2: return { bg: 'linear-gradient(45deg, #cbd5e1, #94a3b8)', color: '#fff', shadow: '0 2px 8px rgba(148, 163, 184, 0.4)' };
      case 3: return { bg: 'linear-gradient(45deg, #fdba74, #f97316)', color: '#fff', shadow: '0 2px 8px rgba(249, 115, 22, 0.4)' };
      default: return { bg: '#f1f5f9', color: '#64748b', shadow: 'none' };
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          TOP SẢN PHẨM BÁN CHẠY
        </Typography>
      </Box>

      {/* BẢNG CHUẨN RIC */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                <TextField size="small" type="date" label="Từ ngày" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} sx={{ width: 150, bgcolor: 'white' }} />
                <TextField size="small" type="date" label="Đến ngày" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} sx={{ width: 150, bgcolor: 'white' }} />
            </Box>
            
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => window.print()}>In Báo Cáo</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => showToast('Tính năng đang phát triển', 'info')}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Phân tích mặt hàng có sức tiêu thụ tốt nhất trong kỳ</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 60, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Top</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 50, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Xem</TableCell>
                  
                  {[
                    { label: 'Sản Phẩm', width: '30%' },
                    { label: 'Danh Mục', width: '15%' },
                    { label: 'Tồn Kho', width: '10%' },
                    { label: 'Sản Lượng Bán', width: '25%' },
                    { label: 'Doanh Thu (VND)', width: '15%' }
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
                {/* 🟢 Nếu Loading thì xoay tròn, rỗng thì báo rỗng 🟢 */}
                {loading ? (
                   <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                   <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>Không có dữ liệu trong khoảng thời gian này</TableCell></TableRow>
                ) : rows.map((row) => {
                  const rankStyle = getRankStyle(row.rank);
                  return (
                    <TableRow key={row.rank} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }}>
                        <Avatar sx={{ 
                          width: 28, height: 28, fontSize: '0.8rem', fontWeight: 800,
                          background: rankStyle.bg, color: rankStyle.color, boxShadow: rankStyle.shadow 
                        }}>
                          {row.rank}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Typography variant="body2" fontWeight={600} color="#0f172a">{row.name}</Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip label={row.category} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500, borderRadius: 1 }} />
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }} align="right">
                        <Typography variant="body2" fontWeight={600} color={row.stock < 50 && row.stock > 0 ? '#dc2626' : '#475569'}>
                          {row.stock}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="body2" fontWeight={800} sx={{ minWidth: 40, color: '#0284c7' }}>{row.sold}</Typography>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(row.sold / maxSold) * 100} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3, 
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': { bgcolor: '#0ea5e9', borderRadius: 3 }
                              }} 
                            />
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }} align="right">
                        <Typography variant="body2" fontWeight={800} color="#16a34a">{formatCurrency(row.revenue)}</Typography>
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
               Hiển thị {rows.length} sản phẩm dẫn đầu
             </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};