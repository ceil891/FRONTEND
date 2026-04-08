import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField,
  Grid, Button, Avatar, IconButton, CircularProgress
} from '@mui/material';
import {
  CardGiftcard as GiftIcon, 
  History as HistoryIcon, Save as SaveIcon,
  Print as PrintIcon, FileDownload as ExcelIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { loyaltyAPI } from '../../api/client';
import dayjs from 'dayjs';

export const LoyaltyPage: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [configParams, setConfigParams] = useState({ 
    exchangeRateEarn: '100000', 
    exchangeRateRedeem: '100' 
  });

  const { showToast } = useToastStore();

  const fetchLoyaltyData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, membersRes] = await Promise.all([
        loyaltyAPI.getConfig(),
        loyaltyAPI.getMembers(searchQuery)
      ]);

      if (configRes?.data?.success && configRes?.data?.data) {
        const cfg = configRes.data.data;
        setConfigParams({
          exchangeRateEarn: String(cfg.exchangeRateEarn || '100000'),
          exchangeRateRedeem: String(cfg.exchangeRateRedeem || '100')
        });
      }

      // 🟢 Backend trả về danh sách khách hàng thông qua CustomerResponse
      const membersData = membersRes?.data?.data || membersRes.data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
      
    } catch (error: any) {
      showToast(error.message || 'Không thể tải dữ liệu hội viên', 'error');
      setMembers([]); 
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLoyaltyData();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchLoyaltyData]);

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      await loyaltyAPI.saveConfig({
        exchangeRateEarn: Number(configParams.exchangeRateEarn),
        exchangeRateRedeem: Number(configParams.exchangeRateRedeem)
      });
      showToast('Đã cập nhật định mức quy đổi!', 'success');
      fetchLoyaltyData(); 
    } catch (error: any) {
      showToast('Lỗi: ' + (error.response?.data?.message || 'Không thể lưu'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  // 🟢 ĐỒNG BỘ THEO RANK TIẾNG VIỆT TỪ BACKEND
  const getTierStyle = (rank: string) => {
    const r = String(rank || "Đồng");
    switch(r) {
      case 'Vàng': return { label: 'Vàng', color: '#d97706', bg: '#fef3c7' };
      case 'Bạc': return { label: 'Bạc', color: '#475569', bg: '#f1f5f9' };
      case 'Kim Cương': return { label: 'Kim Cương', color: '#2563eb', bg: '#eff6ff' };
      default: return { label: 'Đồng', color: '#c2410c', bg: '#ffedd5' };
    }
  };

  return (
    <Box className="fade-in" sx={{ p: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
          TÍCH ĐIỂM & THÀNH VIÊN
        </Typography>
        <Button startIcon={<SyncIcon />} onClick={fetchLoyaltyData} variant="outlined" size="small">
          Làm mới
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GiftIcon color="primary" /> Thiết lập định mức quy đổi
          </Typography>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>Mua hàng:</Typography>
                <TextField size="small" type="number" 
                  value={configParams.exchangeRateEarn} 
                  onChange={(e) => setConfigParams({...configParams, exchangeRateEarn: e.target.value})} 
                  sx={{ width: 140 }} 
                />
                <Typography variant="body2">= 1 Điểm</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>1 Điểm =</Typography>
                <TextField size="small" type="number" 
                  value={configParams.exchangeRateRedeem} 
                  onChange={(e) => setConfigParams({...configParams, exchangeRateRedeem: e.target.value})} 
                  sx={{ width: 100 }} 
                />
                <Typography variant="body2">VNĐ</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveConfig} disabled={loading} sx={{ bgcolor: '#00a65a', textTransform: 'none', px: 3 }}>
                Lưu cấu hình
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          <TextField 
            size="small" placeholder="Tìm tên hoặc số điện thoại..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
          />
          <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be' }}>In</Button>
          <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7' }}>Excel</Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã KH</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên Hội Viên</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hạng Thẻ</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tổng Chi Tiêu</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Điểm Hiện Có</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Lịch Sử</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : members.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10, color: 'text.secondary' }}>Không có dữ liệu hội viên</TableCell></TableRow>
              ) : members.map((row) => {
                // 🟢 Sử dụng rank từ Backend
                const tier = getTierStyle(row.rank);
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{row.code}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: tier.bg, color: tier.color, width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}>{row.fullName?.charAt(0) || 'K'}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{row.fullName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={tier.label} size="small" sx={{ bgcolor: tier.bg, color: tier.color, fontWeight: 700 }} />
                    </TableCell>
                    {/* 🟢 Khớp tên trường totalSpending với Backend */}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(row.totalSpending)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#b45309' }}>{(row.currentPoints || 0).toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary"><HistoryIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};