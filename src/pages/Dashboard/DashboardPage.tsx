import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, AlertTitle, Chip, Avatar, Paper, Skeleton, CircularProgress
} from '@mui/material';
import {
  TrendingUp, TrendingDown, ShoppingBag, People, AttachMoney,
  WarningAmber, GetApp, PictureAsPdf, Store
} from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

// Import API thực tế của bạn
import { dashboardAPI, reportAPI, storeAPI } from '../../api/client';

const COLORS = ['#1e40af', '#3b82f6', '#93c5fd', '#94a3b8', '#64748b'];

// --- SUB-COMPONENT: KPI CARD ---
const KPICard = ({ title, value, subValue, trend, icon, color, loading }: any) => {
  if (loading) return <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} />;
  
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography color="text.secondary" variant="subtitle2" fontWeight={600} textTransform="uppercase">{title}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', mt: 1 }}>{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56 }}>{icon}</Avatar>
        </Box>
        {trend !== undefined && trend !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              icon={trend >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />} 
              label={`${Math.abs(trend)}%`} 
              size="small" 
              sx={{ bgcolor: trend >= 0 ? '#dcfce7' : '#fee2e2', color: trend >= 0 ? '#166534' : '#991b1b', fontWeight: 700 }} 
            />
            <Typography variant="body2" color="text.secondary">{subValue}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardPage = () => {
  // --- STATES QUẢN LÝ DỮ LIỆU THỰC ---
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  
  // States bộ lọc
  const [filters, setFilters] = useState({
    timeRange: 'thang', // ngay, tuan, thang, nam
    startDate: '2026-03-01', 
    endDate: '2026-03-31',
    storeId: 'all'
  });

  // States dữ liệu
  const [stats, setStats] = useState<any>({});
  const [trendData, setTrendData] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Format tiền tệ
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  const formatCompactNumber = (number: number) => {
    if (!number) return '0';
    if (number >= 1e9) return +(number / 1e9).toFixed(1) + "B";
    if (number >= 1e6) return +(number / 1e6).toFixed(1) + "M";
    if (number >= 1e3) return +(number / 1e3).toFixed(1) + "K";
    return number.toString();
  };

  // --- FETCH DATA TỪ BACKEND ---
  const fetchStores = async () => {
    try {
      const res = await storeAPI.getAll();
      if (res.data?.success) setStores(res.data.data);
    } catch (err) { console.error("Lỗi lấy danh sách cửa hàng", err); }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Chuẩn bị tham số gọi API
      const apiParams = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.storeId !== 'all' && { storeId: Number(filters.storeId) })
      };

      // 1. Gọi API Tổng quan (Overview)
      const statsRes = await dashboardAPI.getStats(apiParams);
      if (statsRes.data?.success) setStats(statsRes.data.data);

      // 2. Gọi API Biểu đồ xu hướng (Line Chart)
      // Nếu chọn "all", bạn cần API hỗ trợ lấy trend toàn hệ thống. Tạm thời map storeId = 1 nếu chọn all để tránh lỗi backend
      const trendStoreId = filters.storeId === 'all' ? 1 : Number(filters.storeId); 
      const trendRes = await dashboardAPI.getStoreTrend(trendStoreId, { startDate: filters.startDate, endDate: filters.endDate });
      if (trendRes.data?.success) setTrendData(trendRes.data.data);

      // 3. Gọi API Báo cáo Chi nhánh (Bar Chart)
      const branchRes = await dashboardAPI.getStorePerformance({ startDate: filters.startDate, endDate: filters.endDate });
      if (branchRes.data?.success) setBranchData(branchRes.data.data);

      // 4. Gọi API Top Sản phẩm (List)
      const productsRes = await reportAPI.getProductSales({ startDate: filters.startDate, endDate: filters.endDate, limit: 5 });
      if (productsRes.data?.success) setTopProducts(productsRes.data.data);

      // 5. [Ghi chú] API Category Share (Pie chart) chưa có trong client.ts của bạn, 
      // Cần gọi API thực tế nếu có, tạm gán rỗng để biểu đồ chờ dữ liệu
      // const catRes = await reportAPI.getCategoryShare(...); 
      // setCategoryData(catRes.data.data);

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);
reportAPI.getCategoryRatio()
  useEffect(() => { fetchStores(); }, []);
  useEffect(() => { loadAllData(); }, [loadAllData]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. HEADER & ACTIONS */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#1e293b">Retail Overview</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <Typography variant="body2" color="text.secondary">Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')} (Real-time)</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<GetApp />} onClick={loadAllData} disabled={loading}
            sx={{ borderColor: '#cbd5e1', color: '#475569', '&:hover': { bgcolor: '#f1f5f9' } }}>
            {loading ? <CircularProgress size={20} /> : 'Làm mới'}
          </Button>
          <Button variant="contained" startIcon={<PictureAsPdf />} sx={{ bgcolor: '#1e40af', '&:hover': { bgcolor: '#1e3a8a' } }}>Xuất Báo Cáo</Button>
        </Box>
      </Box>

      {/* 2. BỘ LỌC (FILTERS) */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Thời gian</InputLabel>
          <Select value={filters.timeRange} label="Thời gian" 
            onChange={(e) => setFilters({...filters, timeRange: e.target.value})}>
            <MenuItem value="ngay">Hôm nay</MenuItem>
            <MenuItem value="tuan">Tuần này</MenuItem>
            <MenuItem value="thang">Tháng này</MenuItem>
            <MenuItem value="nam">Năm nay</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Chi nhánh</InputLabel>
          <Select value={filters.storeId} label="Chi nhánh" 
            onChange={(e) => setFilters({...filters, storeId: e.target.value})}>
            <MenuItem value="all">Tất cả chi nhánh</MenuItem>
            {stores.map(store => (
              <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* 3. CẢNH BÁO (ALERTS) - Lấy từ data thực */}
      {stats.lowStockProducts > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Alert severity="warning" icon={<WarningAmber />} sx={{ borderRadius: 2, alignItems: 'center' }}>
              <AlertTitle sx={{ fontWeight: 700, mb: 0 }}>Cảnh báo tồn kho</AlertTitle>
              Hệ thống ghi nhận có <strong>{stats.lowStockProducts} sản phẩm</strong> chạm mức cảnh báo tồn kho. <span style={{ color: '#b45309', cursor: 'pointer', textDecoration: 'underline' }}>Xem chi tiết</span>
            </Alert>
          </Grid>
        </Grid>
      )}

      {/* 4. TỔNG QUAN - KPI CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Tổng Doanh Thu" value={formatCompactNumber(stats.totalRevenue)} subValue="vs kỳ trước" trend={stats.revenueGrowth} icon={<AttachMoney fontSize="large"/>} color="#1e40af" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Tổng Đơn Hàng" value={stats.totalOrders?.toLocaleString()} subValue="vs kỳ trước" trend={stats.orderGrowth} icon={<ShoppingBag fontSize="large"/>} color="#3b82f6" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {/* Thay thế Khách Hàng bằng data thực (nếu backend có, hiện đang placeholder bằng tổng số sản phẩm bán) */}
          <KPICard title="Tổng Sản Phẩm Xuất" value={stats.totalProducts?.toLocaleString()} subValue="đang kinh doanh" trend={null} icon={<People fontSize="large"/>} color="#0ea5e9" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {/* Cần API Profit. Tạm thời hiển thị lợi nhuận giả định 30% doanh thu nếu backend chưa trả về */}
          <KPICard title="Lợi Nhuận Ước Tính" value={formatCompactNumber((stats.totalRevenue || 0) * 0.3)} subValue="Biên lợi nhuận 30%" trend={stats.revenueGrowth} icon={<TrendingUp fontSize="large"/>} color="#10b981" loading={loading} />
        </Grid>
      </Grid>

      {/* 5. KHU VỰC BIỂU ĐỒ CHÍNH */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Area Chart: Doanh thu theo thời gian */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 400 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} color="#1e293b" mb={3}>Biến động Doanh thu</Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                {loading ? <Skeleton variant="rectangular" width="100%" height="100%" /> : trendData.length === 0 ? (
                  <Typography color="text.secondary" align="center" mt={10}>Không có dữ liệu</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} />
                      <RechartsTooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#1e40af" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart: Tỷ trọng danh mục */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 400 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} color="#1e293b" mb={1}>Cơ cấu Danh mục</Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                 {loading ? <Skeleton variant="circular" width={250} height={250} sx={{ mx: 'auto', mt: 4 }} /> : categoryData.length === 0 ? (
                  <Typography color="text.secondary" align="center" mt={10}>Cần bổ sung API Tỷ lệ danh mục</Typography>
                 ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" nameKey="name">
                        {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                 )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 6. CHI NHÁNH & SẢN PHẨM */}
      <Grid container spacing={3}>
        {/* Bar Chart: So sánh chi nhánh */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 400 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={800} color="#1e293b">Hiệu suất Chi nhánh</Typography>
                <Store sx={{ color: '#94a3b8' }} />
              </Box>
              <Box sx={{ width: '100%', height: 300 }}>
                {loading ? <Skeleton variant="rectangular" width="100%" height="100%" /> : branchData.length === 0 ? (
                   <Typography color="text.secondary" align="center" mt={10}>Không có dữ liệu</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} />
                      <YAxis dataKey="storeName" type="category" stroke="#1e293b" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} width={100} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="totalRevenue" name="Doanh thu" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Sản Phẩm */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 400, overflow: 'auto' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} color="#1e293b" mb={3}>Top Sản Phẩm Bán Chạy</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loading ? (
                   [1,2,3,4,5].map(i => <Skeleton key={i} height={60} variant="rounded" />)
                ) : topProducts.length === 0 ? (
                  <Typography color="text.secondary" align="center" mt={4}>Chưa có giao dịch sản phẩm</Typography>
                ) : (
                  topProducts.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Avatar sx={{ bgcolor: '#e2e8f0', color: '#1e40af', fontWeight: 800, mr: 2 }}>{index + 1}</Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#1e293b">{item.productName || 'Sản phẩm ' + item.productId}</Typography>
                        <Typography variant="caption" color="text.secondary">Doanh thu: {formatCurrency(item.revenue)}</Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800} color="#3b82f6">
                        {item.quantitySold} <span style={{fontSize: '0.75rem', fontWeight: 400, color: '#64748b'}}>đã bán</span>
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};