import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  FormControl, InputLabel, Select, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Print as PrintIcon,
  Sync as SyncIcon, AccountBalanceWallet as ReceiptIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { cashbookAPI } from '../../api/client';
import dayjs from 'dayjs';

// 🟢 TỰ ĐỊNH NGHĨA KIỂU DỮ LIỆU ĐỂ TRÁNH LỖI IMPORT
export interface CashbookTransactionResponse {
  id: number;
  code: string;
  transactionDate: string;
  type: string;
  method: string;
  category: string;
  description: string;
  referenceName: string;
  amount: number;
  balanceAfterTransaction?: number;
  status?: string;
  storeName?: string;
  creatorName?: string;
}

// 🟢 DANH SÁCH CÁC HẠNG MỤC THU
const INCOME_CATEGORIES = [
  "Thu tiền bán hàng",
  "Thu khi Xuất hàng trả nhà cung cấp",
  "Thu tồn quỹ",
  "Công nợ đầu kỳ",
  "Khác"
];

export const ReceiptPage: React.FC = () => {
  const [receipts, setReceipts] = useState<CashbookTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: INCOME_CATEGORIES[0], 
    sender: '',
    amount: '',
    description: '',
    method: 'CASH' as 'CASH' | 'BANK_TRANSFER'
  });

  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<CashbookTransactionResponse | null>(null);

  const { showToast } = useToastStore();

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await cashbookAPI.getAll({
        type: 'INCOME', // Lọc ra Phiếu Thu
        method: methodFilter === 'ALL' ? undefined : (methodFilter as any),
        search: searchQuery
      });
      const data = (res.data as any)?.data || res.data || [];
      setReceipts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast('Lỗi khi tải danh sách phiếu thu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [methodFilter]);

  const handleSave = async () => {
    if (!formData.sender || !formData.amount || !formData.category) {
      return showToast('Vui lòng nhập đủ thông tin bắt buộc (*)', 'warning');
    }
    try {
      setLoading(true);
      await cashbookAPI.create({
        type: 'INCOME', // Đẩy xuống BE là thu tiền
        method: formData.method,
        category: formData.category,
        referenceName: formData.sender,
        amount: Number(formData.amount),
        description: formData.description,
        storeId: 1, 
        creatorId: 1 
      });

      showToast('Tạo phiếu thu thành công!', 'success');
      setOpenAddDialog(false);
      setFormData({ category: INCOME_CATEGORIES[0], sender: '', amount: '', description: '', method: 'CASH' });
      fetchReceipts();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi khi tạo phiếu thu', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          <ReceiptIcon color="success" /> DANH SÁCH PHIẾU THU
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
                <TableCell sx={{ fontWeight: 700 }}>Hạng Mục Thu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Người Nộp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hình Thức</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Số Tiền (+)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : receipts.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Không tìm thấy phiếu thu nào</TableCell></TableRow>
              ) : receipts.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{dayjs(row.transactionDate).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0ea5e9' }}>{row.code}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      {row.category}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.referenceName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'} 
                      size="small" color={row.method === 'CASH' ? 'warning' : 'info'} variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 800 }}>
                    +{formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => handleOpenView(row)}>Xem</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* --- DIALOG XEM CHI TIẾT --- */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', bgcolor: '#f0fdf4', color: '#166534' }}>CHI TIẾT PHIẾU THU</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedReceipt && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Mã phiếu:</Typography>
                <Typography variant="body2" fontWeight={700} color="primary">{selectedReceipt.code}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                <Typography variant="body2">{dayjs(selectedReceipt.transactionDate).format('DD/MM/YYYY HH:mm:ss')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Hạng mục thu:</Typography>
                <Typography variant="body2" fontWeight={600} color="primary">{selectedReceipt.category}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Người nộp tiền:</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedReceipt.referenceName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Số tiền thu:</Typography>
                <Typography variant="h6" color="#16a34a" fontWeight={800}>+{formatCurrency(selectedReceipt.amount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Phương thức:</Typography>
                <Typography variant="body2">{selectedReceipt.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Lý do thu / Ghi chú:</Typography>
                <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, mt: 0.5 }}>
                  {selectedReceipt.description || 'Không có ghi chú'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()} startIcon={<PrintIcon />}>In Phiếu</Button>
          <Button onClick={() => setOpenViewDialog(false)} variant="contained" color="success">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG LẬP PHIẾU MỚI --- */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f0fdf4', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          THÔNG TIN PHIẾU THU
          <IconButton size="small" onClick={() => setOpenAddDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Nội dung thu (Hạng mục) (*)</InputLabel>
            <Select 
              value={formData.category} 
              label="Nội dung thu (Hạng mục) (*)" 
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              {INCOME_CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField 
            label="Đối tượng (KH/Nhân viên) (*)" 
            fullWidth size="small" 
            placeholder="Ví dụ: Khách hàng vãng lai..."
            value={formData.sender} 
            onChange={(e) => setFormData({...formData, sender: e.target.value})} 
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Hình thức thanh toán</InputLabel>
                <Select 
                  value={formData.method} 
                  label="Hình thức thanh toán" 
                  onChange={(e) => setFormData({...formData, method: e.target.value as any})}
                >
                  <MenuItem value="CASH">Tiền mặt</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Số tiền (VNĐ) (*)" 
                type="number" fullWidth size="small" 
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                sx={{
                  '& .MuiInputBase-root': { color: '#16a34a', fontWeight: 'bold' }
                }}
              />
            </Grid>
          </Grid>

          <TextField 
            label="Nội dung / Ghi chú chi tiết" 
            multiline rows={3} fullWidth size="small" 
            placeholder="Nhập chi tiết diễn giải lý do thu tiền..."
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />

        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">Đóng</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#00a65a' }}>
            {loading ? 'Đang lưu...' : 'Lưu Phiếu Thu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};