import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, Grid, Pagination, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ArrowCircleDown as IncomeIcon,
  ArrowCircleUp as ExpenseIcon,
  Print as PrintIcon,
  Add as AddIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

import { useToastStore } from '../../store/toastStore';
import { cashbookAPI, BackendCashbookTransaction } from '../../api/client';
import dayjs from 'dayjs';

export const CashBookPage: React.FC = () => {
  const [transactions, setTransactions] = useState<BackendCashbookTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // States cho Dialog Tạo Phiếu
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: 'INCOME',
    category: '',
    referenceName: '',
    amount: '',
    description: ''
  });

  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // --- API CALLS ---
  const fetchCashTransactions = async () => {
    setLoading(true);
    try {
      // Chỉ lấy giao dịch Tiền mặt (CASH)
      const res = await cashbookAPI.getAll('CASH', typeFilter, searchQuery);
      if (res.success) {
        setTransactions(res.data);
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải dữ liệu sổ quỹ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchCashTransactions();
    }
  };

  const handleSaveTransaction = async () => {
    if (!formData.category || !formData.referenceName || !formData.amount) {
      return showToast('Vui lòng điền đủ thông tin bắt buộc (*)', 'warning');
    }

    try {
      setLoading(true);
      await cashbookAPI.create({
        type: formData.type as 'INCOME' | 'EXPENSE',
        method: 'CASH', // Fix cứng phương thức Tiền mặt
        category: formData.category,
        referenceName: formData.referenceName,
        description: formData.description,
        amount: Number(formData.amount),
        storeId: 1, // Tạm fix cứng, sau lấy từ Auth
        creatorId: 1 // Tạm fix cứng, sau lấy từ Auth
      });
      
      showToast(formData.type === 'INCOME' ? 'Tạo Phiếu Thu thành công!' : 'Tạo Phiếu Chi thành công!', 'success');
      setOpenDialog(false);
      setFormData({ type: 'INCOME', category: '', referenceName: '', amount: '', description: '' });
      fetchCashTransactions(); // Tải lại bảng dữ liệu mới nhất
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tạo phiếu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- TÍNH TOÁN TÓM TẮT ---
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  // Số dư tồn quỹ hiện tại (Lấy từ giao dịch mới nhất ở đầu mảng)
  const currentBalance = transactions.length > 0 ? transactions[0].balanceAfterTransaction : 0;

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          SỔ QUỸ TIỀN MẶT
        </Typography>
      </Box>

      {/* THẺ SUMMARY (TÓM TẮT) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bbf7d0', borderRadius: '50%', color: '#166534' }}><IncomeIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Thu Tiền Mặt</Typography>
                <Typography variant="h5" color="#166534" fontWeight={800}>{formatCurrency(totalIncome)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fecaca', borderRadius: '50%', color: '#991b1b' }}><ExpenseIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Chi Tiền Mặt</Typography>
                <Typography variant="h5" color="#991b1b" fontWeight={800}>{formatCurrency(totalExpense)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bfdbfe', borderRadius: '50%', color: '#1e40af' }}><WalletIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tồn Quỹ Hiện Tại</Typography>
                <Typography variant="h5" color="#1e40af" fontWeight={800}>{formatCurrency(currentBalance)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTER & BẢNG */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã phiếu/Diễn giải... (Enter)" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <FormControl size="small" sx={{ minWidth: 180, mr: 1 }}>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ bgcolor: 'white', '& .MuiSelect-select': { py: 0.8, fontSize: '0.875rem' } }}>
                <MenuItem value="ALL">Tất cả giao dịch</MenuItem>
                <MenuItem value="INCOME">Chỉ Phiếu Thu (+)</MenuItem>
                <MenuItem value="EXPENSE">Chỉ Phiếu Chi (-)</MenuItem>
              </Select>
            </FormControl>

            <Button onClick={() => setOpenDialog(true)} size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Lập Phiếu Thu/Chi</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Sổ Quỹ</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 50, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Xem</TableCell>

                  {['Thời Gian', 'Mã Phiếu', 'Loại Thu/Chi', 'Diễn Giải / Lý Do', 'Tiền Thu (+)', 'Tiền Chi (-)', 'Tồn Quỹ', 'Người Lập'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={11} align="center" sx={{ py: 3 }}>Không có dữ liệu sổ quỹ</TableCell></TableRow>
                )}
                {loading && transactions.length === 0 && (
                  <TableRow><TableCell colSpan={11} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                )}
                
                {transactions.map((row, index) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 }, bgcolor: row.status === 'CANCELLED' ? '#f871711a' : 'inherit' }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                      {dayjs(row.transactionDate).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>{row.code}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      {row.type === 'INCOME' ? 
                        <Chip label="Phiếu Thu" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                        <Chip label="Phiếu Chi" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                      }
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{row.category} - {row.referenceName}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.description}</Typography>
                      {row.status === 'CANCELLED' && <Typography variant="caption" color="error" sx={{display: 'block', fontWeight: 'bold'}}>* Đã hủy</Typography>}
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', p: 1.5 }}>
                      {row.type === 'INCOME' ? `+${formatCurrency(row.amount)}` : ''}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', p: 1.5 }}>
                      {row.type === 'EXPENSE' ? `-${formatCurrency(row.amount)}` : ''}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#1e40af', p: 1.5 }}>
                      {formatCurrency(row.balanceAfterTransaction)}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                      {row.creatorName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Hiển thị {transactions.length} giao dịch</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG LẬP PHIẾU THU/CHI ================= */}
      <Dialog open={openDialog} onClose={() => !loading && setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>LẬP PHIẾU THU / CHI TIỀN MẶT</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại Phiếu (*)</InputLabel>
              <Select value={formData.type} label="Loại Phiếu (*)" onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <MenuItem value="INCOME">Phiếu Thu (Nhận tiền)</MenuItem>
                <MenuItem value="EXPENSE">Phiếu Chi (Trách tiền)</MenuItem>
              </Select>
            </FormControl>

            <TextField size="small" label="Người nộp / Người nhận (*)" fullWidth value={formData.referenceName} onChange={(e) => setFormData({...formData, referenceName: e.target.value})} required />
            <TextField size="small" label="Số tiền (VNĐ) (*)" type="number" fullWidth value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
            <TextField size="small" label="Nhóm phân loại (*)" placeholder="VD: Bán hàng, Trả nợ NCC..." fullWidth value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
            <TextField size="small" label="Lý do / Diễn giải chi tiết" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button disabled={loading} onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy Bỏ</Button>
          <Button disabled={loading} variant="contained" onClick={handleSaveTransaction} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Lưu Phiếu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};