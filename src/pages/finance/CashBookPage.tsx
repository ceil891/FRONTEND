import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, Grid, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ArrowCircleDown as IncomeIcon,
  ArrowCircleUp as ExpenseIcon,
  Print as PrintIcon,
  Add as AddIcon,
  SyncAlt as SyncIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { cashbookAPI, CashbookTransactionResponse } from '../../api/client';
import dayjs from 'dayjs';

export const CashBookPage: React.FC = () => {
  const [transactions, setTransactions] = useState<CashbookTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // States cho Dialog Lập Phiếu
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    referenceName: '',
    amount: '',
    description: ''
  });

  // States cho Dialog Xem Chi Tiết
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState<CashbookTransactionResponse | null>(null);

  const { showToast } = useToastStore();

  // 1. Hàm lấy dữ liệu Sổ Tiền Mặt từ API
  const fetchCashTransactions = async () => {
    setLoading(true);
    try {
      const res = await cashbookAPI.getAll({
        method: 'CASH', // Fix cứng là Tiền mặt
        type: typeFilter === 'ALL' ? undefined : (typeFilter as any),
        search: searchQuery
      });
      
      const data = (res.data as any)?.data || res.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast('Lỗi khi tải dữ liệu sổ quỹ tiền mặt', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashTransactions();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchCashTransactions();
  };

  // 2. Hàm lưu Phiếu Thu/Chi tiền mặt
  const handleSaveTransaction = async () => {
    if (!formData.category || !formData.referenceName || !formData.amount) {
      return showToast('Vui lòng điền đủ thông tin (*)', 'warning');
    }

    try {
      setLoading(true);
      await cashbookAPI.create({
        type: formData.type,
        method: 'CASH',
        category: formData.category,
        referenceName: formData.referenceName,
        description: formData.description,
        amount: Number(formData.amount),
        storeId: 1, // Nên lấy từ Auth Context/Store
        creatorId: 1 // Nên lấy từ Auth Context/Store
      });
      
      showToast(formData.type === 'INCOME' ? 'Tạo Phiếu Thu thành công!' : 'Tạo Phiếu Chi thành công!', 'success');
      setOpenAddDialog(false);
      setFormData({ type: 'INCOME', category: '', referenceName: '', amount: '', description: '' });
      fetchCashTransactions();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi khi tạo phiếu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenView = (tx: CashbookTransactionResponse) => {
    setSelectedTx(tx);
    setOpenViewDialog(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // 3. Tính toán tóm tắt bằng useMemo
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const balance = transactions.length > 0 ? transactions[0].balanceAfterTransaction : 0;
    return { income, expense, balance };
  }, [transactions]);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50' }}>
          SỔ QUỸ TIỀN MẶT (KÉT SẮT)
        </Typography>
        <Button variant="outlined" startIcon={<SyncIcon />} onClick={fetchCashTransactions}>Làm mới</Button>
      </Box>

      {/* THẺ SUMMARY */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>TỔNG THU TIỀN MẶT</Typography>
              <Typography variant="h5" color="#166534" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(stats.income)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>TỔNG CHI TIỀN MẶT</Typography>
              <Typography variant="h5" color="#991b1b" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(stats.expense)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>TỒN QUỸ HIỆN TẠI</Typography>
              <Typography variant="h5" color="#1e40af" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(stats.balance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {/* TOOLBAR */}
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
          <TextField 
            size="small" placeholder="Mã phiếu / Diễn giải... (Enter)" 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ width: 180 }}>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="ALL">Tất cả phiếu</MenuItem>
              <MenuItem value="INCOME">Chỉ Phiếu Thu (+)</MenuItem>
              <MenuItem value="EXPENSE">Chỉ Phiếu Chi (-)</MenuItem>
            </Select>
          </FormControl>
          <Button onClick={() => setOpenAddDialog(true)} variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', ml: 'auto' }}>
            Lập Phiếu Thu/Chi
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Thời Gian</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã Phiếu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Đối Tượng / Lý Do</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tiền Thu (+)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tiền Chi (-)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tồn Quỹ</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : transactions.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Chưa có giao dịch tiền mặt nào</TableCell></TableRow>
              ) : transactions.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{dayjs(row.transactionDate).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: row.type === 'INCOME' ? '#16a34a' : '#dc2626' }}>{row.code}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{row.referenceName}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.category}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 700 }}>
                    {row.type === 'INCOME' ? `+${formatCurrency(row.amount)}` : ''}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 700 }}>
                    {row.type === 'EXPENSE' ? `-${formatCurrency(row.amount)}` : ''}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
                    {formatCurrency(row.balanceAfterTransaction)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpenView(row)} color="primary">
                        <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* --- DIALOG XEM CHI TIẾT --- */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          CHI TIẾT PHIẾU {selectedTx?.type === 'INCOME' ? 'THU' : 'CHI'}
          <IconButton onClick={() => setOpenViewDialog(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTx && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Mã giao dịch:</Typography>
                <Typography variant="body2" fontWeight={700} color="primary">{selectedTx.code}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                <Typography variant="body2">{dayjs(selectedTx.transactionDate).format('DD/MM/YYYY HH:mm:ss')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Đối tượng:</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedTx.referenceName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Số tiền:</Typography>
                <Typography variant="h6" color={selectedTx.type === 'INCOME' ? '#16a34a' : '#dc2626'} fontWeight={800}>
                    {formatCurrency(selectedTx.amount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Lý do / Diễn giải:</Typography>
                <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, mt: 0.5, fontStyle: 'italic' }}>
                  {selectedTx.description || 'Không có ghi chú chi tiết'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Người lập:</Typography>
                <Typography variant="body2">{selectedTx.creatorName || 'Admin'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()} startIcon={<PrintIcon />}>In Phiếu</Button>
          <Button onClick={() => setOpenViewDialog(false)} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG LẬP PHIẾU MỚI --- */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>LẬP PHIẾU THU / CHI TIỀN MẶT</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Loại Phiếu</InputLabel>
            <Select value={formData.type} label="Loại Phiếu" onChange={(e) => setFormData({...formData, type: e.target.value as any})}>
              <MenuItem value="INCOME">Phiếu Thu (Nhận tiền)</MenuItem>
              <MenuItem value="EXPENSE">Phiếu Chi (Trả tiền)</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Người nộp / Người nhận (*)" fullWidth size="small" value={formData.referenceName} onChange={(e) => setFormData({...formData, referenceName: e.target.value})} />
          <TextField label="Số tiền (VNĐ) (*)" type="number" fullWidth size="small" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
          <TextField label="Hạng mục (VD: Bán hàng, Chi phí...)" fullWidth size="small" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
          <TextField label="Lý do chi tiết" multiline rows={2} fullWidth size="small" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy Bỏ</Button>
          <Button variant="contained" onClick={handleSaveTransaction} disabled={loading} sx={{ bgcolor: '#00a65a' }}>
            Lưu Phiếu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};