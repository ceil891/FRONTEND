import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Print as PrintIcon,
  Sync as SyncIcon, ReceiptLong as ReceiptIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { cashbookAPI, CashbookTransactionResponse } from '../../api/client';
import dayjs from 'dayjs';

export const ReceiptPage: React.FC = () => {
  // --- STATES QUẢN LÝ DỮ LIỆU ---
  const [receipts, setReceipts] = useState<CashbookTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // --- STATES CHO DIALOG LẬP PHIẾU ---
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    payer: '',
    amount: '',
    reason: '',
    method: 'CASH' as 'CASH' | 'BANK_TRANSFER'
  });

  // --- STATES CHO DIALOG XEM CHI TIẾT ---
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<CashbookTransactionResponse | null>(null);

  const { showToast } = useToastStore();

  // 1. Hàm lấy dữ liệu từ API
  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await cashbookAPI.getAll({
        type: 'INCOME', // Cố định là loại Thu
        method: methodFilter === 'ALL' ? undefined : (methodFilter as any),
        search: searchQuery
      });
      const data = (res.data as any)?.data || res.data || [];
      setReceipts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast('Không thể tải danh sách phiếu thu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [methodFilter]);

  // 2. Hàm lưu phiếu thu mới
  const handleSave = async () => {
    if (!formData.payer || !formData.amount) {
      return showToast('Vui lòng nhập người nộp và số tiền', 'warning');
    }
    try {
      setLoading(true);
      await cashbookAPI.create({
        type: 'INCOME',
        method: formData.method,
        category: "Thu tiền khách hàng",
        referenceName: formData.payer,
        amount: Number(formData.amount),
        description: formData.reason,
        storeId: 1, // Nên lấy từ AuthStore
        creatorId: 1 // Nên lấy từ AuthStore
      });

      showToast('Lập phiếu thu thành công & Đã sync Google Sheets!', 'success');
      setOpenAddDialog(false);
      setFormData({ payer: '', amount: '', reason: '', method: 'CASH' });
      fetchReceipts();
    } catch (error: any) {
      showToast('Lỗi khi tạo phiếu thu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Hàm mở xem chi tiết
  const handleOpenView = (receipt: CashbookTransactionResponse) => {
    setSelectedReceipt(receipt);
    setOpenViewDialog(true);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" /> DANH SÁCH PHIẾU THU
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} sx={{ bgcolor: '#00a65a', textTransform: 'none' }}>
          Lập Phiếu Thu
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <TextField 
            size="small" placeholder="Mã phiếu / Người nộp..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReceipts()}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel>Hình thức</InputLabel>
            <Select value={methodFilter} label="Hình thức" onChange={(e) => setMethodFilter(e.target.value)}>
              <MenuItem value="ALL">Tất cả hình thức</MenuItem>
              <MenuItem value="CASH">Tiền mặt</MenuItem>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<SyncIcon />} onClick={fetchReceipts} variant="outlined" sx={{ textTransform: 'none' }}>Làm mới</Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ngày Lập</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã Phiếu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Người Nộp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hình Thức</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Số Tiền</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : receipts.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Không tìm thấy phiếu thu nào</TableCell></TableRow>
              ) : receipts.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{dayjs(row.transactionDate).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>{row.code}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.referenceName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'} 
                      size="small" color={row.method === 'CASH' ? 'primary' : 'info'} variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 800 }}>
                    +{formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => handleOpenView(row)} variant="text">Xem</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* --- DIALOG XEM CHI TIẾT --- */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', borderBottom: '1px solid #eee' }}>CHI TIẾT PHIẾU THU</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedReceipt && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Mã giao dịch:</Typography>
                <Typography variant="body2" fontWeight={700}>{selectedReceipt.code}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                <Typography variant="body2">{dayjs(selectedReceipt.transactionDate).format('DD/MM/YYYY HH:mm:ss')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Người nộp tiền:</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedReceipt.referenceName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Số tiền thu:</Typography>
                <Typography variant="h6" color="#16a34a" fontWeight={800}>{formatCurrency(selectedReceipt.amount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Phương thức:</Typography>
                <Typography variant="body2">{selectedReceipt.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Ghi chú / Lý do:</Typography>
                <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, mt: 0.5, fontStyle: 'italic' }}>
                  {selectedReceipt.description || 'Không có ghi chú'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => window.print()} startIcon={<PrintIcon />} variant="outlined">In Phiếu</Button>
          <Button onClick={() => setOpenViewDialog(false)} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG LẬP PHIẾU MỚI --- */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>LẬP PHIẾU THU MỚI</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="Người nộp tiền (*)" fullWidth size="small" autoFocus value={formData.payer} onChange={(e) => setFormData({...formData, payer: e.target.value})} />
          <TextField label="Số tiền (VNĐ) (*)" type="number" fullWidth size="small" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
          <FormControl fullWidth size="small">
            <InputLabel>Hình thức</InputLabel>
            <Select value={formData.method} label="Hình thức" onChange={(e) => setFormData({...formData, method: e.target.value as any})}>
              <MenuItem value="CASH">Tiền mặt</MenuItem>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Lý do thu / Ghi chú" multiline rows={2} fullWidth size="small" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#00a65a' }}>Lưu Phiếu Thu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};