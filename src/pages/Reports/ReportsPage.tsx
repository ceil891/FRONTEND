import React, { useState } from 'react';
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
  Paper,
  Button,
  ButtonGroup,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
// PDF/Excel export functionality - temporarily disabled due to Vite import issues
// Will be re-enabled after resolving module resolution
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

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Export functions temporarily disabled - will be re-enabled after resolving Vite import issues
  // const handleExportPDF = async () => { ... }
  // const handleExportExcel = async () => { ... }

  // Mock data - Thay thế bằng API call
  const revenueData: RevenueReport[] = [
    { period: 'T1', revenue: 120000000, orders: 1200, averageOrderValue: 100000, profit: 36000000, profitMargin: 30 },
    { period: 'T2', revenue: 135000000, orders: 1300, averageOrderValue: 103846, profit: 40500000, profitMargin: 30 },
    { period: 'T3', revenue: 150000000, orders: 1450, averageOrderValue: 103448, profit: 45000000, profitMargin: 30 },
    { period: 'T4', revenue: 125000000, orders: 1250, averageOrderValue: 100000, profit: 37500000, profitMargin: 30 },
  ];

  const productSalesData: ProductSalesReport[] = [
    { productId: '1', productName: 'Coca Cola 330ml', quantitySold: 5000, revenue: 75000000, profit: 25000000 },
    { productId: '2', productName: 'Pepsi 330ml', quantitySold: 4500, revenue: 67500000, profit: 22500000 },
    { productId: '3', productName: 'Bánh mì thịt nướng', quantitySold: 3000, revenue: 75000000, profit: 30000000 },
  ];

  const storeComparisonData: StoreComparison[] = [
    { storeId: '1', storeName: 'Cửa Hàng 1', revenue: 500000000, orders: 5000, averageOrderValue: 100000, growth: 15.5 },
    { storeId: '2', storeName: 'Cửa Hàng 2', revenue: 450000000, orders: 4500, averageOrderValue: 100000, growth: 12.3 },
    { storeId: '3', storeName: 'Cửa Hàng 3', revenue: 380000000, orders: 3800, averageOrderValue: 100000, growth: 8.7 },
  ];

  const pieColors = ['#1976d2', '#42a5f5', '#90caf9', '#e3f2fd'];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Báo Cáo & Thống Kê
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Kỳ Báo Cáo</InputLabel>
            <Select
              value={period}
              label="Kỳ Báo Cáo"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="day">Theo Ngày</MenuItem>
              <MenuItem value="week">Theo Tuần</MenuItem>
              <MenuItem value="month">Theo Tháng</MenuItem>
              <MenuItem value="year">Theo Năm</MenuItem>
            </Select>
          </FormControl>
          <ButtonGroup variant="outlined">
            <Button 
              startIcon={<PdfIcon />} 
              onClick={() => alert('Tính năng xuất PDF đang được phát triển')}
              disabled
            >
              Xuất PDF
            </Button>
            <Button 
              startIcon={<ExcelIcon />} 
              onClick={() => alert('Tính năng xuất Excel đang được phát triển')}
              disabled
            >
              Xuất Excel
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Revenue Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Doanh Thu Theo Thời Gian
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#1976d2" name="Doanh Thu" />
                  <Line type="monotone" dataKey="profit" stroke="#2e7d32" name="Lợi Nhuận" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Product Sales */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Bán Hàng Theo Sản Phẩm
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1976d2" name="Doanh Thu" />
                  <Bar dataKey="profit" fill="#2e7d32" name="Lợi Nhuận" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Phân Bổ Doanh Thu
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productSalesData}
                    dataKey="revenue"
                    nameKey="productName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {productSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Store Comparison Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                So Sánh Cửa Hàng
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cửa Hàng</TableCell>
                      <TableCell align="right">Doanh Thu</TableCell>
                      <TableCell align="right">Số Đơn</TableCell>
                      <TableCell align="right">Giá Trị TB/Đơn</TableCell>
                      <TableCell align="right">Tăng Trưởng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {storeComparisonData.map((store) => (
                      <TableRow key={store.storeId}>
                        <TableCell>{store.storeName}</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 600 }}>
                            {formatCurrency(store.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{store.orders.toLocaleString()}</TableCell>
                        <TableCell align="right">{formatCurrency(store.averageOrderValue)}</TableCell>
                        <TableCell align="right">
                          <Typography color="success.main" sx={{ fontWeight: 600 }}>
                            +{store.growth}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
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
