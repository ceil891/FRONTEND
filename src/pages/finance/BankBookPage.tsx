import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, Grid, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  ArrowCircleDown as IncomeIcon,
  ArrowCircleUp as ExpenseIcon,
  Print as PrintIcon,
  Add as AddIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  SyncAlt as SyncIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore'; // Đảm bảo đường dẫn đúng
import { cashbookAPI, BackendCashbookTransaction } from '../../api/client'; // Đảm bảo đường dẫn file api.ts đúng
import dayjs from 'dayjs'; // Cài thêm npm install dayjs nếu chưa có để format ngày

export const BankBookPage: React.FC = () => {
  const [transactions, setTransactions] = useState<BackendCashbookTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // States cho Dialog Tạo giao dịch
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: 'INCOME',
    category: '',
    referenceName: '',
    amount: '',
    description: ''
  });

  const { showToast } = useToastStore();

  // Gọi API lấy dữ liệu Sổ ngân hàng
  const fetchBankTransactions = async () => {
    setLoading(true);
    try {
      // Chỉ lấy giao dịch BANK_TRANSFER
      const res = await cashbookAPI.getAll('BANK_TRANSFER', typeFilter, searchQuery);
      if (res.success) {
        setTransactions(res.data);
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tự động gọi lại API khi Filter thay đổi (có thể dùng debounce cho searchQuery nếu cần)
  useEffect(() => {
    fetchBankTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchBankTransactions();
    }
  };

  // Xử lý lưu giao dịch mới
  const handleSaveTransaction = async () => {
    if (!formData.category || !formData.referenceName || !formData.amount) {
      return showToast('Vui lòng điền đủ thông tin bắt buộc (*)', 'warning');
    }

    try {
      setLoading(true);
      await cashbookAPI.create({
        type: formData.type as 'INCOME' | 'EXPENSE',
        method: 'BANK_TRANSFER', // Hardcode vì đây là trang Ngân hàng
        category: formData.category,
        referenceName: formData.referenceName,
        description: formData.description,
        amount: Number(formData.amount),
        storeId: 1, // Fix cứng tạm thời, sau này lấy từ Auth Context
        creatorId: 1 // Fix cứng tạm thời, sau này lấy từ Auth Context
      });
      
      showToast('Ghi nhận giao dịch ngân hàng thành công!', 'success');
      setOpenDialog(false);
      setFormData({ type: 'INCOME', category: '', referenceName: '', amount: '', description: '' });
      fetchBankTransactions(); // Load lại bảng
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tạo giao dịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // Tính toán Tóm tắt
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  // Số dư ngân hàng lấy từ giao dịch mới nhất (phần tử đầu tiên vì list đang order DESC)
  const currentBalance = transactions.length > 0 ? transactions[0].balanceAfterTransaction : 0;

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          SỔ QUỸ TÀI KHOẢN NGÂN HÀNG
        </Typography>
      </Box>

      {/* THẺ SUMMARY (TÓM TẮT) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#bbf7d0', borderRadius: '50%', color: '#166534' }}><IncomeIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Tiền Vào (Báo Có)</Typography>
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
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Tổng Tiền Ra (Báo Nợ)</Typography>
                <Typography variant="h5" color="#991b1b" fontWeight={800}>{formatCurrency(totalExpense)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fde68a', borderRadius: '50%', color: '#b45309' }}><BankIcon fontSize="large" /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Số Dư Ngân Hàng Hiện Tại</Typography>
                <Typography variant="h5" color="#b45309" fontWeight={800}>{formatCurrency(currentBalance)}</Typography>
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
              size="small" placeholder="Tìm: Mã GD/Diễn giải... (Enter)" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <FormControl size="small" sx={{ minWidth: 180, mr: 1 }}>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ bgcolor: 'white', '& .MuiSelect-select': { py: 0.8, fontSize: '0.875rem' } }}>
                <MenuItem value="ALL">Tất cả giao dịch</MenuItem>
                <MenuItem value="INCOME">Chỉ Tiền Vào (+)</MenuItem>
                <MenuItem value="EXPENSE">Chỉ Tiền Ra (-)</MenuItem>
              </Select>
            </FormControl>

            <Button onClick={() => setOpenDialog(true)} size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Tạo Giao Dịch</Button>
            <Button onClick={fetchBankTransactions} size="small" variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit"/> : <SyncIcon />} sx={{ bgcolor: '#39cccc', '&:hover': { bgcolor: '#33b8b8' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Đồng Bộ</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Sổ Quỹ</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  {['Thời Gian', 'Mã GD', 'Phân Loại', 'Diễn Giải (Nội dung CK)', 'Ghi Có (+)', 'Ghi Nợ (-)', 'Số Dư Cuối'].map((col) => (
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
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>Không có dữ liệu giao dịch</TableCell></TableRow>
                )}
                {transactions.map((row, index) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 }, bgcolor: row.status === 'CANCELLED' ? '#f871711a' : 'inherit' }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                      {dayjs(row.transactionDate).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>{row.code}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      {row.type === 'INCOME' ? 
                        <Chip label="Tiền vào" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                        <Chip label="Tiền ra" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none', borderRadius: 1 }} />
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
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#b45309', p: 1.5 }}>
                      {formatCurrency(row.balanceAfterTransaction)}
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

      {/* ================= DIALOG LẬP GIAO DỊCH NGÂN HÀNG ================= */}
      <Dialog open={openDialog} onClose={() => !loading && setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>THÊM GIAO DỊCH NGÂN HÀNG</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại giao dịch (*)</InputLabel>
              <Select value={formData.type} label="Loại giao dịch (*)" onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <MenuItem value="INCOME">Tiền vào (Báo Có)</MenuItem>
                <MenuItem value="EXPENSE">Tiền ra (Báo Nợ)</MenuItem>
              </Select>
            </FormControl>

            <TextField size="small" label="Đối tượng (Người gửi / Người nhận) (*)" fullWidth value={formData.referenceName} onChange={(e) => setFormData({...formData, referenceName: e.target.value})} required />
            <TextField size="small" label="Số tiền (VNĐ) (*)" type="number" fullWidth value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
            <TextField size="small" label="Nhóm phân loại (*)" placeholder="VD: Bán hàng, Trả nợ NCC..." fullWidth value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
            <TextField size="small" label="Nội dung chuyển khoản (Diễn giải)" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button disabled={loading} onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy Bỏ</Button>
          <Button disabled={loading} variant="contained" onClick={handleSaveTransaction} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Lưu Giao Dịch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};