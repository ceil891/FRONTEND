import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
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
import { DashboardStats } from '../../types';

// Mock data - Thay thế bằng API call
const mockStats: DashboardStats = {
  totalRevenue: 125000000,
  totalOrders: 1250,
  totalProducts: 450,
  lowStockProducts: 12,
  pendingRecommendations: 5,
  revenueGrowth: 15.5,
  orderGrowth: 8.2,
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  growth?: number;
}> = ({ title, value, icon, color, growth }) => {
  const colorMap: Record<string, { bg: string; iconBg: string }> = {
    success: {
      bg: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
      iconBg: 'rgba(46, 125, 50, 0.1)',
    },
    primary: {
      bg: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      iconBg: 'rgba(25, 118, 210, 0.1)',
    },
    info: {
      bg: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)',
      iconBg: 'rgba(2, 136, 209, 0.1)',
    },
    warning: {
      bg: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
      iconBg: 'rgba(237, 108, 2, 0.1)',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <Card
      sx={{
        background: colors.bg,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          transform: 'translate(30px, -30px)',
        },
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography sx={{ opacity: 0.9 }} gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mt: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {value}
            </Typography>
            {growth !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                <TrendingUpIcon sx={{ fontSize: 18, mr: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  +{growth}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              p: 2,
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Chào mừng, {user?.fullName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Đây là tổng quan hoạt động của bạn hôm nay
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Doanh Thu"
            value={formatCurrency(mockStats.totalRevenue)}
            icon={<AttachMoneyIcon sx={{ fontSize: 32 }} />}
            color="success"
            growth={mockStats.revenueGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng Đơn Hàng"
            value={mockStats.totalOrders.toLocaleString()}
            icon={<ShoppingCartIcon sx={{ fontSize: 32 }} />}
            color="primary"
            growth={mockStats.orderGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sản Phẩm"
            value={mockStats.totalProducts}
            icon={<InventoryIcon sx={{ fontSize: 32 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cảnh Báo Tồn Kho"
            value={mockStats.lowStockProducts}
            icon={<WarningIcon sx={{ fontSize: 32 }} />}
            color="warning"
          />
        </Grid>

        {/* AI Recommendations Alert */}
        {mockStats.pendingRecommendations > 0 && (
          <Grid item xs={12}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #0288d1 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: '200px',
                  height: '200px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      p: 2,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 48 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                      Có {mockStats.pendingRecommendations} đề xuất từ AI-Agent
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Vui lòng xem chi tiết tại AI Dashboard để xử lý các đề xuất quan trọng.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Hoạt Động Gần Đây
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="body1">Đơn hàng #{1000 + item}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date().toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatCurrency(500000 * item)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Thống Kê Nhanh
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Mục tiêu tháng này</Typography>
                    <Typography variant="body2">75%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={75} />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tỷ lệ hoàn thành đơn hàng</Typography>
                    <Typography variant="body2">98%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={98} color="success" />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Mức độ hài lòng</Typography>
                    <Typography variant="body2">92%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={92} color="info" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
