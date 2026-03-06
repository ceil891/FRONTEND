import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment,
  Grid, Button, Avatar, Divider, Tooltip, IconButton
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon, Search as SearchIcon,
  Stars as StarsIcon, CardGiftcard as GiftIcon, 
  History as HistoryIcon, Save as SaveIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Dữ liệu mẫu khách hàng thành viên
const mockMembers = [
  { id: 'KH001', name: 'Đào Quang Thành', phone: '0901234567', tier: 'DIAMOND', points: 12500, totalSpent: 125000000, lastVisit: '2026-03-04' },
  { id: 'KH002', name: 'Nguyễn Thị Hương', phone: '0988777666', tier: 'GOLD', points: 4500, totalSpent: 45000000, lastVisit: '2026-03-01' },
  { id: 'KH003', name: 'Trần Văn Kiên', phone: '0911222333', tier: 'SILVER', points: 1200, totalSpent: 12000000, lastVisit: '2026-02-25' },
  { id: 'KH004', name: 'Lê Thảo My', phone: '0933444555', tier: 'BRONZE', points: 350, totalSpent: 3500000, lastVisit: '2026-03-05' },
];

export const LoyaltyPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();

  // State quản lý cấu hình quy đổi điểm (Mặc định: 100.000đ = 1 điểm, 1 điểm = 100đ)
  const [configParams, setConfigParams] = useState({ earnRate: '100000', redeemRate: '100' });

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const filteredMembers = mockMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery)
  );

  const getTierStyle = (tier: string) => {
    switch(tier) {
      case 'DIAMOND': return { label: 'Kim Cương', color: '#3b82f6', bg: '#eff6ff', iconColor: '#2563eb' };
      case 'GOLD': return { label: 'Vàng', color: '#d97706', bg: '#fef3c7', iconColor: '#d97706' };
      case 'SILVER': return { label: 'Bạc', color: '#475569', bg: '#f1f5f9', iconColor: '#64748b' };
      default: return { label: 'Đồng', color: '#9a3412', bg: '#ffedd5', iconColor: '#c2410c' };
    }
  };

  const handleSaveConfig = () => {
    if (Number(configParams.earnRate) <= 0 || Number(configParams.redeemRate) <= 0) {
      return showToast('Vui lòng nhập số tiền hợp lệ (> 0)', 'warning');
    }
    showToast('Đã lưu định mức quy đổi điểm thành công!', 'success');
  };

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StarsIcon color="primary" sx={{ fontSize: 32 }} />
          Quản Lý Tích Điểm Hội Viên
        </Typography>
      </Box>

      {/* ✅ NÂNG CẤP: ĐƯA CẤU HÌNH QUY ĐỔI ĐIỂM RA NGOÀI THEO UI THAM KHẢO */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 3, border: '1px solid #e2e8f0', borderLeft: '4px solid #1976d2' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
            Định mức số tiền mua hàng quy đổi thành điểm
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            {/* Cột 1: Tích Điểm */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontWeight={600} color="text.secondary">Số tiền định mức:</Typography>
                <TextField 
                  size="small" type="number"
                  value={configParams.earnRate} 
                  onChange={(e) => setConfigParams({...configParams, earnRate: e.target.value})} 
                  sx={{ width: 140, bgcolor: 'white' }}
                />
                <Typography fontWeight={600} color="text.secondary">VNĐ</Typography>
              </Box>
              <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                👉 Sẽ quy đổi thành 1 điểm tích lũy.
              </Typography>
            </Grid>

            {/* Cột 2: Tiêu Điểm (Tặng thêm tính năng so với ảnh gốc) */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontWeight={600} color="text.secondary">1 Điểm tích lũy =</Typography>
                <TextField 
                  size="small" type="number"
                  value={configParams.redeemRate} 
                  onChange={(e) => setConfigParams({...configParams, redeemRate: e.target.value})} 
                  sx={{ width: 140, bgcolor: 'white' }}
                />
                <Typography fontWeight={600} color="text.secondary">VNĐ</Typography>
              </Box>
              <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                👉 Số tiền khách được giảm khi thanh toán.
              </Typography>
            </Grid>

            {/* Cột 3: Nút Lưu */}
            <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" color="success" startIcon={<SaveIcon />} 
                onClick={handleSaveConfig}
                sx={{ fontWeight: 600, px: 3, boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)' }}
              >
                Lưu
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SUMMARY THẺ THÀNH VIÊN */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bfdbfe', borderRadius: '50%', color: '#1d4ed8' }}><AccountCircleIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Hội Viên</Typography>
                <Typography variant="h5" color="#1d4ed8" fontWeight={800}>1,245</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fecaca', borderRadius: '50%', color: '#b91c1c' }}><GiftIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Điểm Đã Đổi (Trong tháng)</Typography>
                <Typography variant="h5" color="#b91c1c" fontWeight={800}>45,200 đ</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309' }}><StarsIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Hội Viên Tăng Mới</Typography>
                <Typography variant="h5" color="#b45309" fontWeight={800}>+32</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DANH SÁCH TÍCH ĐIỂM CỦA KHÁCH HÀNG */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button variant="contained" sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }} startIcon={<AccountCircleIcon />}>
              Danh sách tích điểm của khách hàng
            </Button>
            <TextField
              size="small" placeholder="Tìm kiếm tên, số điện thoại..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', md: '300px' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Mã KH</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên Khách Hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Điện Thoại</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Hạng Thẻ</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tổng Chi Tiêu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#b45309' }}>Điểm Tích Lũy</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No items to display</TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((row) => {
                    const tierStyle = getTierStyle(row.tier);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{row.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: tierStyle.bg, color: tierStyle.color, fontWeight: 700, width: 32, height: 32 }}>
                              {row.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600} color="#0f172a">{row.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            icon={<StarsIcon style={{ color: tierStyle.iconColor }} />} 
                            label={tierStyle.label} 
                            size="small"
                            sx={{ bgcolor: tierStyle.bg, color: tierStyle.color, fontWeight: 700, border: `1px solid ${tierStyle.color}40` }} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color="text.secondary">{formatCurrency(row.totalSpent)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={800} color="#b45309" fontSize="1.1rem">{row.points.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Lịch sử dùng điểm">
                            <IconButton size="small" color="info"><HistoryIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};