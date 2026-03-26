import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, TextField, Button,
  Checkbox, Pagination, CircularProgress, Paper, Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  AnalyticsOutlined
} from '@mui/icons-material';
import { reportAPI, storeAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const StoreRevenueReport: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-31');
  const [rows, setRows] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  // 1. Logic lấy dữ liệu: Tách riêng lấy Store và lấy Doanh thu
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách store nếu chưa có
      let currentStores = stores;
      if (stores.length === 0) {
        const storeRes = await storeAPI.getAll();
        currentStores = storeRes.data?.data || [];
        setStores(currentStores);
      }

      if (currentStores.length === 0) return;

      // 🟢 CẢI TIẾN: Thay vì gọi N API, nên yêu cầu Backend tạo 1 endpoint lấy tất cả
      // Nhưng tạm thời fix logic hiện tại của Thành cho chuẩn:
      const apiPromises = currentStores.map((st: any) =>
        reportAPI.getRevenue({ startDate: dateFrom, endDate: dateTo, period: 'day', storeId: st.id })
          .catch(err => ({ error: true, storeId: st.id, data: { data: [] } }))
      );

      const responses = await Promise.all(apiPromises);
      const dateMap = new Map<string, Record<number, { revenue: number, orders: number }>>();

      responses.forEach((res: any, index) => {
        if (res.error) return; // Bỏ qua nếu 1 chi nhánh lỗi

        const storeId = currentStores[index].id;
        const dataList = res.data?.data || [];

        dataList.forEach((item: any) => {
          const date = item.period; // 'YYYY-MM-DD'
          if (!dateMap.has(date)) dateMap.set(date, {});
          const storeRecord = dateMap.get(date)!;
          storeRecord[storeId] = {
            revenue: Number(item.revenue || 0),
            orders: Number(item.orders || 0)
          };
        });
      });

      const periods = Array.from(dateMap.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      const apiRows = periods.map((period, index) => {
        const storeData = dateMap.get(period)!;
        const totalDayRevenue = Object.values(storeData).reduce((sum, val) => sum + val.revenue, 0);
        return { no: index + 1, date: period, storeData, totalRevenue: totalDayRevenue };
      });

      setRows(apiRows);
      if (apiRows.length > 0) showToast("Tải dữ liệu thành công", "success");
    } catch (error) {
      showToast("Lỗi hệ thống khi tải báo cáo", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  // 2. Tối ưu tính toán tổng doanh thu kỳ bằng useMemo
  const storeTotals = useMemo(() => {
    return stores.map(store => ({
      id: store.id,
      name: store.name,
      total: rows.reduce((sum, row) => sum + (row.storeData[store.id]?.revenue || 0), 0)
    }));
  }, [rows, stores]);

  return (
    <Box sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a335d', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsOutlined /> BÁO CÁO DOANH THU CHI NHÁNH
        </Typography>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchData} disabled={loading}>Làm mới</Button>
      </Box>

      {/* WIDGETS TỔNG HỢP */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {storeTotals.slice(0, 4).map((st, idx) => (
          <Grid item xs={12} sm={6} md={3} key={st.id}>
            <Card sx={{ borderLeft: `5px solid ${idx % 2 === 0 ? '#4caf50' : '#2196f3'}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>{st.name}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#2c3e50' }}>{formatCurrency(st.total)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        {/* THANH ĐIỀU KHIỂN */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#fff', borderBottom: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField size="small" type="date" label="Từ ngày" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <TextField size="small" type="date" label="Đến ngày" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="secondary" startIcon={<ExcelIcon />} sx={{ borderRadius: 2 }}>Xuất Excel</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} sx={{ borderRadius: 2 }}>In báo cáo</Button>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 600, boxShadow: 'none' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, color: '#475569' } }}>
                <TableCell width={60}>STT</TableCell>
                <TableCell>Ngày</TableCell>
                {stores.map(st => (
                  <TableCell key={st.id} align="right" sx={{ borderLeft: '1px solid #e2e8f0' }}>{st.name}</TableCell>
                ))}
                <TableCell align="right" sx={{ bgcolor: '#f1f5f9 !important' }}>Tổng Ngày</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={stores.length + 3} align="center" sx={{ py: 10 }}><CircularProgress /><Typography sx={{ mt: 2 }}>Đang tổng hợp dữ liệu...</Typography></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={stores.length + 3} align="center" sx={{ py: 10 }}><Typography color="text.secondary">Không tìm thấy dữ liệu trong kỳ báo cáo</Typography></TableCell></TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={row.date} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{new Date(row.date).toLocaleDateString('vi-VN')}</TableCell>
                    {stores.map(st => (
                      <TableCell key={st.id} align="right" sx={{ borderLeft: '1px solid #f1f5f9' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>{formatCurrency(row.storeData[st.id]?.revenue)}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.storeData[st.id]?.orders || 0} đơn</Typography>
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(row.totalRevenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};