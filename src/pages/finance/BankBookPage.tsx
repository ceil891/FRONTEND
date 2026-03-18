import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, Grid, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  ArrowCircleDown as IncomeIcon,
  ArrowCircleUp as ExpenseIcon,
  Add as AddIcon,
  SyncAlt as SyncIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { cashbookAPI, CashbookTransactionResponse } from '../../api/client'; 
import dayjs from 'dayjs';

export const BankBookPage: React.FC = () => {
  const [transactions, setTransactions] = useState<CashbookTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    referenceName: '',
    amount: '',
    description: ''
  });

  const { showToast } = useToastStore();

  const fetchBankTransactions = async () => {
    setLoading(true);
    try {
      const res = await cashbookAPI.getAll({
        method: 'BANK_TRANSFER',
        type: typeFilter === 'ALL' ? undefined : (typeFilter as 'INCOME' | 'EXPENSE'),
        search: searchQuery
      });

      const data = res.data.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải dữ liệu ngân hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankTransactions();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchBankTransactions();
  };

  const handleSaveTransaction = async () => {
    if (!formData.category || !formData.referenceName || !formData.amount) {
      return showToast('Vui lòng điền đủ thông tin bắt buộc (*)', 'warning');
    }

    try {
      setLoading(true);
      await cashbookAPI.create({
        type: formData.type,
        method: 'BANK_TRANSFER',
        category: formData.category,
        referenceName: formData.referenceName,
        description: formData.description,
        amount: Number(formData.amount),
        storeId: 1, // Nên lấy từ AuthStore sau này
        creatorId: 1 
      });
      
      showToast('Ghi nhận giao dịch thành công!', 'success');
      setOpenDialog(false);
      setFormData({ type: 'INCOME', category: '', referenceName: '', amount: '', description: '' });
      fetchBankTransactions(); 
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi khi tạo giao dịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(value || 0).replace('₫', 'đ'); // Chỉnh ₫ thành đ cho giống ảnh
  };

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const balance = transactions.length > 0 ? transactions[0].balanceAfterTransaction : 0;
    return { income, expense, balance };
  }, [transactions]);

  return (
    <Box className="fade-in">
      {/* HEADER: Tiêu đề và nút Làm mới ở góc phải */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
          SỔ QUỸ TÀI KHOẢN NGÂN HÀNG
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<SyncIcon />} 
          onClick={fetchBankTransactions}
          size="small"
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Làm mới
        </Button>
      </Box>

      {/* SUMMARY CARDS: Thu - Chi - Số dư */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>TỔNG THU (BÁO CÓ)</Typography>
              <Typography variant="h5" color="#28a745" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(stats.income)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>TỔNG CHI (BÁO NỢ)</Typography>
              <Typography variant="h5" color="#dc3545" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(stats.expense)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>SỐ DƯ TÀI KHOẢN</Typography>
              <Typography variant="h5" color="#007bff" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(stats.balance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none' }}>
        {/* TOOLBAR: Search và Nút tạo */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <TextField 
            size="small" 
            placeholder="Mã GD / Diễn giải... (Enter)" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            sx={{ width: 300 }}
          />
          <Button 
            onClick={() => setOpenDialog(true)} 
            variant="contained" 
            startIcon={<AddIcon />} 
            sx={{ bgcolor: '#28a745', '&:hover': { bgcolor: '#218838' }, ml: 'auto', textTransform: 'none' }}
          >
            Tạo Giao Dịch
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Thời Gian</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã GD</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ghi Có (+)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ghi Nợ (-)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Số Dư</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : transactions.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10, color: 'text.secondary' }}>Chưa có dữ liệu giao dịch</TableCell></TableRow>
              ) : transactions.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{dayjs(row.transactionDate).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#007bff' }}>{row.code}</TableCell>
                  <TableCell sx={{ color: '#28a745', fontWeight: 700 }}>{row.type === 'INCOME' ? formatCurrency(row.amount) : '-'}</TableCell>
                  <TableCell sx={{ color: '#dc3545', fontWeight: 700 }}>{row.type === 'EXPENSE' ? formatCurrency(row.amount) : '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(row.balanceAfterTransaction)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* DIALOG THÊM GIAO DỊCH (Đúng theo ảnh image_9f1c1a.jpg) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          THÊM GIAO DỊCH NGÂN HÀNG
          <IconButton onClick={() => setOpenDialog(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Loại giao dịch</InputLabel>
            <Select 
              value={formData.type} 
              label="Loại giao dịch" 
              onChange={(e) => setFormData({...formData, type: e.target.value as any})}
            >
              <MenuItem value="INCOME">Tiền vào (Báo Có)</MenuItem>
              <MenuItem value="EXPENSE">Tiền ra (Báo Nợ)</MenuItem>
            </Select>
          </FormControl>
          
          <TextField 
            label="Đối tượng (Người gửi/nhận) (*)" 
            fullWidth size="small" 
            value={formData.referenceName} 
            onChange={(e) => setFormData({...formData, referenceName: e.target.value})} 
          />
          
          <TextField 
            label="Số tiền (VNĐ) (*)" 
            type="number" 
            fullWidth size="small" 
            value={formData.amount} 
            onChange={(e) => setFormData({...formData, amount: e.target.value})} 
          />
          
          <TextField 
            label="Hạng mục (VD: Bán hàng, Thu nợ...)" 
            fullWidth size="small" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
          />
          
          <TextField 
            label="Ghi chú chi tiết" 
            fullWidth multiline rows={3} 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#007bff' }}>
            Hủy Bỏ
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTransaction} 
            disabled={loading}
            sx={{ bgcolor: '#28a745', '&:hover': { bgcolor: '#218838' }, px: 3, textTransform: 'none' }}
          >
            Lưu Giao Dịch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};