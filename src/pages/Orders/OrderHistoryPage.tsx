import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button,
  Chip, CircularProgress, Stack, Paper
} from '@mui/material';
import {
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { orderAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const OrderHistoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  const renderTypeChip = (type: string) => {
    const isOnline = type === 'ONLINE';
    return (
      <Chip 
        label={isOnline ? 'Online' : 'Tại quầy'} 
        size="small" 
        sx={{ 
            bgcolor: isOnline ? '#e0f2fe' : '#dcfce7', 
            color: isOnline ? '#0284c7' : '#15803d', 
            fontWeight: 800, 
            borderRadius: 1.5 
        }} 
      />
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.query({ type: 'HISTORY' });
      const data = res.data?.data || res.data || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Lỗi tải lịch sử', 'error');
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  // 🟢 ĐÃ SỬA: Thêm r.storeName vào logic tìm kiếm
  const filtered = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) => 
      [r.orderNumber, r.customerName, r.employeeName, r.customerPhone, r.storeName]
        .some(v => String(v || '').toLowerCase().includes(kw))
    );
  }, [rows, searchQuery]);

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight={800} color="#1e293b">LỊCH SỬ GIAO DỊCH</Typography>
        <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} sx={{ borderRadius: 2, bgcolor: '#fff' }}>Làm mới</Button>
            <Button variant="contained" startIcon={<ExcelIcon />} sx={{ borderRadius: 2, bgcolor: '#0284c7' }}>Xuất Excel</Button>
        </Stack>
      </Box>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
            <TextField 
                fullWidth size="small" 
                placeholder="Tìm kiếm theo mã HĐ, chi nhánh, tên khách hàng, nhân viên..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                InputProps={{ startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.disabled' }} /> }} 
            />
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#1e293b' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Mã GD</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Thời Gian</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Kênh Bán</TableCell>
                {/* 🟢 ĐÃ SỬA: Thêm cột Cửa Hàng */}
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Cửa Hàng</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Khách Hàng</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">Tổng Tiền</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Nhân Viên</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ bgcolor: '#fff' }}>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>Không có giao dịch nào.</TableCell></TableRow>
              ) : filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{row.orderNumber}</TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>{renderTypeChip(row.orderType)}</TableCell>
                  {/* 🟢 ĐÃ SỬA: Map dữ liệu storeName */}
                  <TableCell sx={{ fontWeight: 700, color: '#3b82f6' }}>{row.storeName || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.customerName || 'Khách lẻ'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#16a34a' }}>
                    {formatCurrency(row.totalAmount)}
                  </TableCell>
                  <TableCell>{row.employeeName || 'Admin'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};