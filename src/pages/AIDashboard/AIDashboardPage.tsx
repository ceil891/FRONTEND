import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  SwapHoriz as TransferIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { AIRecommendation, DemandPrediction, AIRecommendationType } from '../../types';

export const AIDashboardPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'predictions' | 'alerts'>('recommendations');

  // Mock data - Thay thế bằng API call
  const mockRecommendations: AIRecommendation[] = [
    {
      id: '1',
      type: AIRecommendationType.LOW_STOCK,
      storeId: 'store-1',
      productId: 'prod-2',
      title: 'Cảnh Báo Tồn Kho Thấp',
      message: 'Sản phẩm Pepsi 330ml đang ở mức tồn kho thấp (25/50). Đề xuất nhập thêm 100 đơn vị.',
      priority: 'HIGH',
      isRead: false,
      isResolved: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      type: AIRecommendationType.DEMAND_PREDICTION,
      storeId: 'store-1',
      productId: 'prod-1',
      title: 'Dự Đoán Nhu Cầu Tăng',
      message: 'Dự đoán nhu cầu Coca Cola sẽ tăng 20% trong 7 ngày tới. Đề xuất tăng tồn kho.',
      priority: 'MEDIUM',
      isRead: false,
      isResolved: false,
      createdAt: new Date(),
    },
    {
      id: '3',
      type: AIRecommendationType.SLOW_MOVING,
      storeId: 'store-1',
      productId: 'prod-3',
      title: 'Sản Phẩm Bán Chậm',
      message: 'Bánh mì thịt nướng có tốc độ bán chậm. Đề xuất giảm giá 10% hoặc điều chuyển sang cửa hàng khác.',
      priority: 'LOW',
      isRead: true,
      isResolved: false,
      createdAt: new Date(),
    },
    {
      id: '4',
      type: AIRecommendationType.REVENUE_ANOMALY,
      storeId: 'store-1',
      title: 'Doanh Thu Bất Thường',
      message: 'Doanh thu ngày hôm nay giảm 15% so với cùng kỳ tuần trước. Cần kiểm tra nguyên nhân.',
      priority: 'URGENT',
      isRead: false,
      isResolved: false,
      createdAt: new Date(),
    },
  ];

  const mockPredictions: DemandPrediction[] = [
    {
      productId: 'prod-1',
      productName: 'Coca Cola 330ml',
      currentStock: 150,
      predictedDemand: 180,
      recommendedOrder: 200,
      confidence: 85,
      period: '7 ngày',
    },
    {
      productId: 'prod-2',
      productName: 'Pepsi 330ml',
      currentStock: 25,
      predictedDemand: 60,
      recommendedOrder: 100,
      confidence: 90,
      period: '7 ngày',
    },
    {
      productId: 'prod-3',
      productName: 'Bánh mì thịt nướng',
      currentStock: 80,
      predictedDemand: 50,
      recommendedOrder: 0,
      confidence: 75,
      period: '7 ngày',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: AIRecommendationType) => {
    switch (type) {
      case AIRecommendationType.LOW_STOCK:
        return <InventoryIcon />;
      case AIRecommendationType.DEMAND_PREDICTION:
        return <TrendingUpIcon />;
      case AIRecommendationType.TRANSFER_SUGGESTION:
        return <TransferIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const unreadCount = mockRecommendations.filter(r => !r.isRead).length;
  const urgentCount = mockRecommendations.filter(r => r.priority === 'URGENT' && !r.isResolved).length;

  return (
    <Box className="fade-in">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          mb: 4,
          p: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #1565c0 100%)',
          borderRadius: 4,
          color: 'white',
          boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
        }}
      >
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
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            AI-Agent Dashboard
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Phân tích thông minh và đề xuất tự động cho hệ thống
          </Typography>
        </Box>
      </Box>

      {/* Alert Summary */}
      {urgentCount > 0 && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(211, 47, 47, 0.2)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            '& .MuiAlert-icon': {
              fontSize: 32,
            },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Có {urgentCount} cảnh báo khẩn cấp cần xử lý ngay!
          </Typography>
          <Typography variant="body2">
            Vui lòng kiểm tra và xử lý các đề xuất có độ ưu tiên cao ngay lập tức.
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button
          variant={selectedTab === 'recommendations' ? 'contained' : 'outlined'}
          onClick={() => setSelectedTab('recommendations')}
          sx={{
            ...(selectedTab === 'recommendations' && {
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
            }),
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            },
          }}
        >
          Đề Xuất ({mockRecommendations.length})
        </Button>
        <Button
          variant={selectedTab === 'predictions' ? 'contained' : 'outlined'}
          onClick={() => setSelectedTab('predictions')}
          sx={{
            ...(selectedTab === 'predictions' && {
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
            }),
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            },
          }}
        >
          Dự Đoán Nhu Cầu
        </Button>
        <Button
          variant={selectedTab === 'alerts' ? 'contained' : 'outlined'}
          onClick={() => setSelectedTab('alerts')}
          sx={{
            ...(selectedTab === 'alerts' && {
              background: 'linear-gradient(45deg, #ed6c02 30%, #ff9800 90%)',
              boxShadow: '0 3px 10px rgba(237, 108, 2, 0.3)',
            }),
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            },
          }}
        >
          Cảnh Báo ({unreadCount})
        </Button>
      </Box>

      {/* Recommendations Tab */}
      {selectedTab === 'recommendations' && (
        <Grid container spacing={3}>
          {mockRecommendations.map((rec, index) => (
            <Grid item xs={12} md={6} key={rec.id}>
              <Card
                className="fade-in"
                sx={{
                  borderLeft: `5px solid`,
                  borderColor: `${getPriorityColor(rec.priority)}.main`,
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${getPriorityColor(rec.priority)}.main, ${getPriorityColor(rec.priority)}.light)`,
                  },
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          bgcolor: `${getPriorityColor(rec.priority)}.light`,
                          color: `${getPriorityColor(rec.priority)}.main`,
                          borderRadius: 2,
                          p: 1.2,
                        }}
                      >
                        {getTypeIcon(rec.type)}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {rec.title}
                      </Typography>
                    </Box>
                    <Chip
                      label={rec.priority}
                      color={getPriorityColor(rec.priority) as any}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                    {rec.message}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(rec.createdAt).toLocaleString('vi-VN')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!rec.isRead && (
                        <Chip
                          label="Mới"
                          color="primary"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            animation: 'pulse 2s infinite',
                          }}
                        />
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        Xem Chi Tiết
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          background: `linear-gradient(135deg, ${getPriorityColor(rec.priority)}.main, ${getPriorityColor(rec.priority)}.light)`,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 20px ${getPriorityColor(rec.priority)}.main40`,
                          },
                        }}
                      >
                        Xử Lý
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Predictions Tab */}
      {selectedTab === 'predictions' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Dự Đoán Nhu Cầu Sản Phẩm (7 Ngày Tới)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sản Phẩm</TableCell>
                    <TableCell align="right">Tồn Kho Hiện Tại</TableCell>
                    <TableCell align="right">Nhu Cầu Dự Đoán</TableCell>
                    <TableCell align="right">Đề Xuất Nhập</TableCell>
                    <TableCell align="right">Độ Tin Cậy</TableCell>
                    <TableCell align="right">Thao Tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPredictions.map((pred) => (
                    <TableRow key={pred.productId}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500 }}>
                          {pred.productName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{pred.currentStock}</TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600 }}>
                          {pred.predictedDemand}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {pred.recommendedOrder > 0 ? (
                          <Typography color="primary.main" sx={{ fontWeight: 600 }}>
                            {pred.recommendedOrder}
                          </Typography>
                        ) : (
                          <Typography color="text.secondary">Không cần</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={pred.confidence}
                            sx={{ width: 100, height: 8, borderRadius: 1 }}
                          />
                          <Typography variant="body2">{pred.confidence}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {pred.recommendedOrder > 0 && (
                          <Button size="small" variant="contained">
                            Nhập Hàng
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Cảnh Báo Hệ Thống
            </Typography>
            {mockRecommendations.filter(r => !r.isRead).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography color="text.secondary">
                  Không có cảnh báo mới
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Loại</TableCell>
                      <TableCell>Tiêu Đề</TableCell>
                      <TableCell>Mức Độ</TableCell>
                      <TableCell>Thời Gian</TableCell>
                      <TableCell align="right">Thao Tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockRecommendations
                      .filter(r => !r.isRead)
                      .map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell>{getTypeIcon(rec.type)}</TableCell>
                          <TableCell>{rec.title}</TableCell>
                          <TableCell>
                            <Chip
                              label={rec.priority}
                              color={getPriorityColor(rec.priority) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(rec.createdAt).toLocaleString('vi-VN')}
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined">
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
