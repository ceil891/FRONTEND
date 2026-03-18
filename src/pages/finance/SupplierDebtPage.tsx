import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, IconButton // 👉 Thêm IconButton vào đây
} from '@mui/material';
import {
  AccountBalanceWallet as DebtIcon,
  Sync as SyncIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  Close as CloseIcon // 👉 Thêm icon đóng cho đẹp
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { supplierAPI, cashbookAPI, CashbookTransactionResponse } from '../../api/client';
import dayjs from 'dayjs';

export const SupplierDebtPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // States cho Dialog Thanh toán nợ
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('BANK_TRANSFER');

  // States cho Dialog Lịch sử đối soát
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyTransactions, setHistoryTransactions] = useState<CashbookTransactionResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { showToast } = useToastStore();

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierAPI.getAll();
      const data = (res as any).data?.data || res.data || [];
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Lỗi tải danh sách nhà cung cấp', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSuppliers(); }, []);

  const handleOpenPayment = (supplier: any) => {
    setSelectedSupplier(supplier);
    setPaymentAmount(Math.abs(supplier.debt).toString());
    setOpenPayDialog(true);
  };

  const handleExecutePay = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return showToast('Số tiền không hợp lệ', 'warning');
    try {
      setLoading(true);
      await cashbookAPI.paySupplier({
        supplierId: selectedSupplier.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        storeId: 1, 
        creatorId: 1,
        notes: `Thanh toán nợ cho ${selectedSupplier.name}`
      });
      showToast('Đã ghi nhận thanh toán & Sync Google Sheets!', 'success');
      setOpenPayDialog(false);
      loadSuppliers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (supplier: any) => {
    setSelectedSupplier(supplier);
    setOpenHistoryDialog(true);
    setLoadingHistory(true);
    try {
      // 💡 Gợi ý: Nếu Backend hỗ trợ supplierId thì nên dùng để chính xác tuyệt đối
      const res = await cashbookAPI.getAll({ search: supplier.name });
      const data = (res as any).data?.data || res.data || [];
      setHistoryTransactions(data);
    } catch (error) {
      showToast('Lỗi tải lịch sử đối soát', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalDebt = suppliers.reduce((sum, item) => sum + (item.debt || 0), 0);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>CÔNG NỢ NHÀ CUNG CẤP</Typography>
        <Button variant="outlined" startIcon={<SyncIcon />} onClick={loadSuppliers}>Làm mới</Button>
      </Box>

      <Grid container sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="error" fontWeight={600}>TỔNG NỢ CẦN TRẢ HIỆN TẠI</Typography>
              <Typography variant="h4" color="#dc2626" fontWeight={800} sx={{ mt: 1 }}>
                {formatCurrency(totalDebt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid #f1f5f9' }}>
          <TextField 
            size="small" placeholder="Mã NCC / Tên NCC..." 
            sx={{ width: 300 }} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be' }}>In Báo Cáo</Button>
          <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7' }}>Xuất Excel</Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã NCC</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên Nhà Cung Cấp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Điện Thoại</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Dư Nợ Hiện Tại</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>Không tìm thấy NCC nào</TableCell></TableRow>
              ) : filteredSuppliers.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.code || 'NCC' + row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 800, 
                    color: row.debt < 0 ? '#dc2626' : '#16a34a' 
                  }}>
                    {formatCurrency(row.debt)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Button 
                        size="small" variant="contained" color="warning" 
                        disabled={row.debt === 0}
                        onClick={() => handleOpenPayment(row)}
                        sx={{ minWidth: 80, textTransform: 'none' }}
                      >
                        Trả Nợ
                      </Button>
                      <Button 
                        size="small" variant="outlined" 
                        startIcon={<HistoryIcon />}
                        onClick={() => handleViewHistory(row)}
                        sx={{ minWidth: 80, textTransform: 'none' }}
                      >
                        Lịch sử
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openPayDialog} onClose={() => setOpenPayDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>XÁC NHẬN THANH TOÁN</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px dashed #cbd5e1' }}>
             <Typography variant="caption">Nhà cung cấp: <b>{selectedSupplier?.name}</b></Typography>
             <Typography variant="h6" color="error" fontWeight={800} sx={{mt: 0.5}}>{formatCurrency(selectedSupplier?.debt)}</Typography>
          </Box>
          <TextField 
            label="Số tiền thanh toán" type="number" fullWidth autoFocus size="small" sx={{mt: 1}}
            value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Phương thức</InputLabel>
            <Select value={paymentMethod} label="Phương thức" onChange={(e:any) => setPaymentMethod(e.target.value)}>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
              <MenuItem value="CASH">Tiền mặt</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{px: 3, pb: 2}}>
          <Button onClick={() => setOpenPayDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleExecutePay} disabled={loading}>Xác Nhận Trả</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          LỊCH SỬ GIAO DỊCH: {selectedSupplier?.name}
          <IconButton onClick={() => setOpenHistoryDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingHistory ? (
            <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell sx={{fontWeight: 700}}>Ngày giờ</TableCell>
                    <TableCell sx={{fontWeight: 700}}>Mã phiếu</TableCell>
                    <TableCell sx={{fontWeight: 700}}>Loại giao dịch</TableCell>
                    <TableCell align="right" sx={{fontWeight: 700}}>Số tiền</TableCell>
                    <TableCell sx={{fontWeight: 700}}>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyTransactions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{py: 3}}>Chưa có giao dịch nào với đối tác này</TableCell></TableRow>
                  ) : historyTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{dayjs(tx.transactionDate).format('DD/MM/YYYY HH:mm')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{tx.code}</TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.type === 'INCOME' ? 'Nợ tăng' : 'Trả tiền'} 
                          size="small" 
                          color={tx.type === 'INCOME' ? 'error' : 'success'} 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(tx.amount)}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{tx.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{p: 2}}>
          <Button onClick={() => setOpenHistoryDialog(false)} variant="contained" sx={{px: 4}}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};