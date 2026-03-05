import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  CircularProgress,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RevenueReport, ProductSalesReport, StoreComparison } from '../../types';
import { reportAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [revenueData, setRevenueData] = useState<RevenueReport[]>([]);
  const [productSalesData, setProductSalesData] = useState<ProductSalesReport[]>([]);
  const [storeComparisonData, setStoreComparisonData] = useState<StoreComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // ✅ Hàm helper xử lý ngày tháng chuẩn múi giờ Local (Việt Nam) thay vì UTC
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    void loadReports();
  }, [period]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let start: Date;

      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week': {
          const day = now.getDay() || 7;
          start = new Date(now);
          start.setDate(now.getDate() - day + 1);
          break;
        }
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // ✅ Dùng formatLocalDate để tránh lỗi lệch ngày do toISOString()
      const startDateStr = formatLocalDate(start);
      const endDateStr = formatLocalDate(now);

      const [revRes, prodRes, storeRes] = await Promise.all([
        reportAPI.getRevenue(startDateStr, endDateStr),
        reportAPI.getProductSales(startDateStr, endDateStr),
        reportAPI.getStoreComparison(startDateStr, endDateStr),
      ]);

      if (revRes.data.success && revRes.data.data) {
        setRevenueData(revRes.data.data);
      }
      if (prodRes.data.success && prodRes.data.data) {
        setProductSalesData(prodRes.data.data);
      }
      if (storeRes.data.success && storeRes.data.data) {
        setStoreComparisonData(storeRes.data.data);
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi tải báo cáo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pieColors = ['#1976d2', '#42a5f5', '#90caf9', '#e3f2fd', '#bbdefb'];

  if (loading && revenueData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Báo cáo & Thống kê
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
            <InputLabel>Kỳ Báo Cáo</InputLabel>
            <Select
              value={period}
              label="Kỳ Báo Cáo"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="day">Hôm nay</MenuItem>
              <MenuItem value="week">Tuần này</MenuItem>
              <MenuItem value="month">Tháng này</MenuItem>
              <MenuItem value="year">Năm nay</MenuItem>
            </Select>
          </FormControl>
          <ButtonGroup variant="outlined" size="medium" sx={{ bgcolor: 'white' }}>
            <Button 
              startIcon={<PdfIcon />} 
              onClick={() => alert('Tính năng xuất PDF đang được cập nhật')}
            >
              PDF
            </Button>
            <Button 
              startIcon={<ExcelIcon />} 
              onClick={() => alert('Tính năng xuất Excel đang được cập nhật')}
            >
              Excel
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* BIỂU ĐỒ DOANH THU THEO THỜI GIAN */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#334155' }}>
                Doanh Thu & Lợi Nhuận
              </Typography>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={revenueData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000000}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Doanh Thu" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" name="Lợi Nhuận" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>Không có dữ liệu trong kỳ này.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* BÁN HÀNG THEO SẢN PHẨM */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, height: '100%', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#334155' }}>
                Top 5 sản phẩm bán vhạy nhất
              </Typography>
              {productSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={productSalesData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="productName" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000000}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Doanh Thu" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" fill="#10b981" name="Lợi Nhuận" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>Không có dữ liệu trong kỳ này.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* PHÂN BỔ DOANH THU */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, height: '100%', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#334155' }}>
                Tỷ trọng doanh thu
              </Typography>
              {productSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={productSalesData}
                      dataKey="revenue"
                      nameKey="productName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      labelLine={false}
                    >
                      {productSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>Không có dữ liệu trong kỳ này.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* BẢNG SO SÁNH CỬA HÀNG */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#334155', mb: 2 }}>
                Bảng xếp hạng cửa hàng
              </Typography>
              <TableContainer>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Tên Cửa Hàng</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Doanh Thu</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>Số Đơn Hàng</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Giá Trị TB / Đơn</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Tăng Trưởng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {storeComparisonData.length > 0 ? storeComparisonData.map((store) => (
                      <TableRow key={store.storeId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>
                          {store.storeName}
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>
                            {formatCurrency(store.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ bgcolor: '#e2e8f0', display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 500 }}>
                            {store.orders.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(store.averageOrderValue)}</TableCell>
                        <TableCell align="right">
                          <Typography color={store.growth >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 700 }}>
                            {store.growth >= 0 ? '+' : ''}{store.growth}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Chưa có dữ liệu bán hàng của các cửa hàng trong kỳ này.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};