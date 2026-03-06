import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField,
  Grid, Button, Avatar, Checkbox, Pagination, Tooltip
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Stars as StarsIcon, CardGiftcard as GiftIcon, 
  History as HistoryIcon, Save as SaveIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Dữ liệu mẫu khách hàng thành viên
const mockMembers = [
  { no: 1, id: 'KH001', name: 'Đào Quang Thành', phone: '0901234567', tier: 'DIAMOND', points: 12500, totalSpent: 125000000, lastVisit: '04/03/2026' },
  { no: 2, id: 'KH002', name: 'Nguyễn Thị Hương', phone: '0988777666', tier: 'GOLD', points: 4500, totalSpent: 45000000, lastVisit: '01/03/2026' },
  { no: 3, id: 'KH003', name: 'Trần Văn Kiên', phone: '0911222333', tier: 'SILVER', points: 1200, totalSpent: 12000000, lastVisit: '25/02/2026' },
  { no: 4, id: 'KH004', name: 'Lê Thảo My', phone: '0933444555', tier: 'BRONZE', points: 350, totalSpent: 3500000, lastVisit: '05/03/2026' },
];

export const LoyaltyPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();
  const [configParams, setConfigParams] = useState({ earnRate: '100000', redeemRate: '100' });

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const filteredMembers = mockMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery)
  );

  const getTierStyle = (tier: string) => {
    switch(tier) {
      case 'DIAMOND': return { label: 'Kim Cương', color: '#2563eb', bg: '#eff6ff' };
      case 'GOLD': return { label: 'Vàng', color: '#d97706', bg: '#fef3c7' };
      case 'SILVER': return { label: 'Bạc', color: '#475569', bg: '#f1f5f9' };
      default: return { label: 'Đồng', color: '#c2410c', bg: '#ffedd5' };
    }
  };

  const handleSaveConfig = () => {
    if (Number(configParams.earnRate) <= 0) return showToast('Định mức không hợp lệ', 'warning');
    showToast('Đã lưu cấu hình quy đổi điểm!', 'success');
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          TÍCH ĐIỂM & THÀNH VIÊN
        </Typography>
      </Box>

      {/* BLOCK 1: CẤU HÌNH QUY ĐỔI ĐIỂM (UI PHẲNG) */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', mb: 3, border: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GiftIcon color="primary" /> Thiết lập định mức quy đổi
          </Typography>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ minWidth: 110 }}>Mua hàng:</Typography>
                <TextField size="small" type="number" value={configParams.earnRate} onChange={(e) => setConfigParams({...configParams, earnRate: e.target.value})} sx={{ width: 150 }} />
                <Typography variant="body2" fontWeight={600}>= 1 Điểm</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ minWidth: 110 }}>Khi tiêu dùng:</Typography>
                <Typography variant="body2" fontWeight={600}>1 Điểm =</Typography>
                <TextField size="small" type="number" value={configParams.redeemRate} onChange={(e) => setConfigParams({...configParams, redeemRate: e.target.value})} sx={{ width: 100 }} />
                <Typography variant="body2" fontWeight={600}>VNĐ</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveConfig} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', boxShadow: 'none' }}>
                Lưu cấu hình
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* BLOCK 2: SUMMARY CARDS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
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
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fecaca', borderRadius: '50%', color: '#b91c1c' }}><GiftIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Số Điểm Đã Sử Dụng</Typography>
                <Typography variant="h5" color="#b91c1c" fontWeight={800}>12,450</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309' }}><StarsIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tăng Trưởng Mới</Typography>
                <Typography variant="h5" color="#b45309" fontWeight={800}>+32</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BLOCK 3: DANH SÁCH HỘI VIÊN CHUẨN RIC */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Tên/Số điện thoại..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Danh Sách</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 60, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Lịch Sử</TableCell>
                  
                  {['Mã KH', 'Tên Hội Viên', 'Số Điện Thoại', 'Hạng Thẻ', 'Tổng Chi Tiêu', 'Điểm Tích Lũy', 'Lần Cuối Ghé'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((row) => {
                  const tier = getTierStyle(row.tier);
                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Box sx={{ bgcolor: '#0284c7', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><HistoryIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{row.id}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: tier.bg, color: tier.color, width: 28, height: 28, fontSize: '0.8rem', fontWeight: 700 }}>{row.name.charAt(0)}</Avatar>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.phone}</TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip icon={<StarsIcon style={{ color: tier.color, fontSize: '16px' }} />} label={tier.label} size="small" sx={{ bgcolor: tier.bg, color: tier.color, fontWeight: 700, borderRadius: 1 }} />
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#475569', p: 1.5 }}>{formatCurrency(row.totalSpent)}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 800, color: '#b45309', p: 1.5 }}>{row.points.toLocaleString()}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.lastVisit}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {filteredMembers.length} of {filteredMembers.length} items</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};