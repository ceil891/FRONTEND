import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import {
  People as PeopleIcon, Search as SearchIcon, History as HistoryIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  AccountBalanceWallet as DebtIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Dữ liệu mẫu
const mockDebts = [
  { no: 1, id: 'NCC001', name: 'Công ty TNHH Nước Giải Khát', phone: '0988111222', totalDebt: 25000000, lastImport: '01/03/2026', creator: 'Admin' },
  { no: 2, id: 'NCC002', name: 'Nhà phân phối Trái Cây Miền Tây', phone: '0909333444', totalDebt: 8500000, lastImport: '03/03/2026', creator: 'Kế toán 01' },
  { no: 3, id: 'NCC003', name: 'Đại lý Bánh Kẹo Hùng Phát', phone: '0977555666', totalDebt: 0, lastImport: '28/02/2026', creator: 'Admin' },
];

export const SupplierDebtPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleOpenPayment = (supplier: any) => {
    setSelectedSupplier(supplier);
    setPaymentAmount(supplier.totalDebt.toString());
    setOpenDialog(true);
  };

  const handlePayDebt = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return showToast('Số tiền thanh toán không hợp lệ', 'warning');
    }
    showToast(`Đã ghi nhận thanh toán nợ cho ${selectedSupplier?.name}`, 'success');
    setOpenDialog(false);
  };

  const totalSystemDebt = mockDebts.reduce((sum, item) => sum + item.totalDebt, 0);

  const filteredDebts = mockDebts.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          CÔNG NỢ NHÀ CUNG CẤP
        </Typography>
      </Box>

      {/* THẺ TỔNG QUAN */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="#991b1b" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Tổng Nợ Cần Trả Hiện Tại</Typography>
              <Typography variant="h4" color="#dc2626" fontWeight={800} sx={{ mt: 1 }}>{formatCurrency(totalSystemDebt)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BẢNG CHUẨN RIC */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã NCC/Tên NCC..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Báo Cáo</Button>
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
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {['Mã NCC', 'Tên Nhà Cung Cấp', 'Điện Thoại', 'Lần Nhập Gần Nhất', 'Dư Nợ Hiện Tại', 'Nhân Viên Phụ Trách'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDebts.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    
                    {/* Cột Thao tác kiểu Nút vuông */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Box title="Lịch sử giao dịch" sx={{ bgcolor: '#0284c7', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><HistoryIcon sx={{ fontSize: 14 }} /></Box>
                        {row.totalDebt > 0 && (
                          <Box title="Thanh toán nợ" onClick={() => handleOpenPayment(row)} sx={{ bgcolor: '#f39c12', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><DebtIcon sx={{ fontSize: 14 }} /></Box>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{row.id}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700, p: 1.5 }}>{row.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.phone}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.lastImport}</TableCell>
                    
                    {/* Dư nợ màu đỏ */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: row.totalDebt > 0 ? '#dc2626' : '#16a34a', p: 1.5 }}>
                      {formatCurrency(row.totalDebt)}
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.creator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {filteredDebts.length} of {filteredDebts.length} items</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* DIALOG THANH TOÁN NỢ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>THANH TOÁN CÔNG NỢ</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          {selectedSupplier && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                <Typography variant="body2" color="text.secondary">Tên đối tác:</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: '#0f172a' }}>{selectedSupplier.name}</Typography>
                <Typography variant="body2" color="text.secondary">Dư nợ hiện tại (Cần thanh toán):</Typography>
                <Typography variant="h5" color="#dc2626" fontWeight={800}>{formatCurrency(selectedSupplier.totalDebt)}</Typography>
              </Box>
              
              <TextField 
                size="small" label="Số tiền trả (VNĐ) (*)" type="number" fullWidth 
                value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} 
                autoFocus
              />
              <TextField size="small" label="Ghi chú thanh toán" fullWidth multiline rows={3} placeholder="VD: CK trả nợ đợt 1..." />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy Bỏ</Button>
          <Button variant="contained" onClick={handlePayDebt} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            Xác Nhận Trả Nợ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};