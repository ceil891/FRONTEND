import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, LinearProgress, CircularProgress,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { dashboardAPI } from '../../api/client';

// ✅ 1. CẬP NHẬT LẠI TYPE ĐỂ HỨNG THÊM DỮ LIỆU MỚI TỪ BACKEND
interface RecentActivity {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingRecommendations: number;
  revenueGrowth: number;
  orderGrowth: number;
  // Thêm 4 trường mới này để hứng dữ liệu mảng và phần trăm
  recentActivities: RecentActivity[]; 
  targetProgress: number;
  completionRate: number;
  satisfactionRate: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  growth?: number;
}> = ({ title, value, icon, color, growth }) => {
  const colorMap: Record<string, { bg: string; iconBg: string }> = {
    success: { bg: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)', iconBg: 'rgba(46, 125, 50, 0.1)' },
    primary: { bg: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', iconBg: 'rgba(25, 118, 210, 0.1)' },
    info: { bg: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)', iconBg: 'rgba(2, 136, 209, 0.1)' },
    warning: { bg: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)', iconBg: 'rgba(237, 108, 2, 0.1)' },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: colors.bg, color: 'white', position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', top: 0, right: 0, width: '100px', height: '100px',
          background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', transform: 'translate(30px, -30px)',
        },
        '&:hover': { transform: 'translateY(-8px) scale(1.02)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography sx={{ opacity: 0.9 }} gutterBottom variant="body2">{title}</Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mt: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {value}
            </Typography>
            {growth !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                <TrendingUpIcon sx={{ fontSize: 18, mr: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>+{growth}%</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', borderRadius: 3, p: 2, border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  // ✅ 2. KHỞI TẠO STATE RỖNG CHUẨN XÁC
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingRecommendations: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    recentActivities: [], // Mảng rỗng chờ API
    targetProgress: 0,
    completionRate: 0,
    satisfactionRate: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.data && response.data.data) {
        // Đổ toàn bộ dữ liệu Backend trả về vào state
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Hàm fomat ngày tháng cho hoạt động gần đây
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return '---';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" gutterBottom 
          sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}
        >
          Chào mừng, {user?.fullName || 'Admin'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">Đây là tổng quan hoạt động của bạn hôm nay</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 4 THẺ THỐNG KÊ TRÊN CÙNG */}
        <Grid item xs={12} sm={6} md={3}><StatCard title="Doanh Thu" value={formatCurrency(stats.totalRevenue)} icon={<AttachMoneyIcon sx={{ fontSize: 32 }} />} color="success" growth={stats.revenueGrowth} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Tổng Đơn Hàng" value={stats.totalOrders.toLocaleString()} icon={<ShoppingCartIcon sx={{ fontSize: 32 }} />} color="primary" growth={stats.orderGrowth} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Sản Phẩm" value={stats.totalProducts} icon={<InventoryIcon sx={{ fontSize: 32 }} />} color="info" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Cảnh Báo Tồn Kho" value={stats.lowStockProducts} icon={<WarningIcon sx={{ fontSize: 32 }} />} color="warning" /></Grid>

        {/* AI Recommendations Alert */}
        {stats.pendingRecommendations > 0 && (
          <Grid item xs={12}>
            <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #0288d1 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)', '&::before': { content: '""', position: 'absolute', top: -50, right: -50, width: '200px', height: '200px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }, '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(25, 118, 210, 0.4)' } }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', borderRadius: 3, p: 2, border: '1px solid rgba(255, 255, 255, 0.3)' }}><SmartToyIcon sx={{ fontSize: 48 }} /></Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Có {stats.pendingRecommendations} đề xuất từ AI-Agent</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>Vui lòng xem chi tiết tại AI Dashboard để xử lý các đề xuất quan trọng.</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* HOẠT ĐỘNG GẦN ĐÂY */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Hoạt Động Gần Đây</Typography>
              <Box sx={{ mt: 2 }}>
                {/* ✅ 3. LẶP QUA MẢNG DỮ LIỆU THẬT TỪ BACKEND */}
                {stats.recentActivities && stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                          Đơn hàng #{item.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(item.createdAt)}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {formatCurrency(item.total)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Chưa có hoạt động nào gần đây.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* THỐNG KÊ NHANH */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Thống Kê Nhanh</Typography>
              <Box sx={{ mt: 2 }}>
                {/* ✅ 4. GẮN SỐ LIỆU TỪ API VÀO THANH TIẾN ĐỘ */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500}>Mục tiêu tháng này</Typography>
                    <Typography variant="body2" fontWeight={700}>{stats.targetProgress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={stats.targetProgress} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500}>Tỷ lệ hoàn thành đơn</Typography>
                    <Typography variant="body2" fontWeight={700}>{stats.completionRate}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={stats.completionRate} color="success" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500}>Mức độ hài lòng</Typography>
                    <Typography variant="body2" fontWeight={700}>{stats.satisfactionRate}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={stats.satisfactionRate} color="info" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};