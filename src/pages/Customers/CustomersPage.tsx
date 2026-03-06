import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  QrCode as QrCodeIcon, FileUpload as ImportIcon, FileDownload as ExcelIcon, 
  FilterAlt as FilterIcon, Edit as EditIcon, SwapHoriz as TransferIcon,
  Stars as StarsIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// Dữ liệu mẫu
const initialCustomers = [
  { no: 1, khuVuc: 'Miền Bắc', nhom: 'SILVER', maKH: 'KL', tenToChuc: 'Khách lẻ', diaChi: 'Hà Nội', dienThoai: '0988123123', email: 'khachle@gmail.com', nhanVien: 'Admin', coTheDatHang: '1' },
  { no: 2, khuVuc: 'Hà Nội', nhom: 'DIAMOND', maKH: 'KH001', tenToChuc: 'Công ty ABC', diaChi: 'Cầu Giấy', dienThoai: '0901234567', email: 'abc@gmail.com', nhanVien: 'Admin', coTheDatHang: '1' },
];

export const CustomersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { showToast } = useToastStore();

  // State cho Form
  const [formData, setFormData] = useState({
    maKH: '', tenToChuc: '', dienThoai: '', email: '', diaChi: '', 
    khuVuc: 'Hà Nội', nhom: 'SILVER', nhanVien: 'Admin', coTheDatHang: '1'
  });

  const handleToolbarClick = (action: string) => {
    if (action === 'Thêm') {
      setEditingCustomer(null);
      setFormData({ maKH: '', tenToChuc: '', dienThoai: '', email: '', diaChi: '', khuVuc: 'Hà Nội', nhom: 'SILVER', nhanVien: 'Admin', coTheDatHang: '1' });
      setOpenDialog(true);
    } else {
      console.log(`Thực hiện: ${action}`);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.tenToChuc || !formData.dienThoai) {
      return showToast('Vui lòng nhập tên và số điện thoại', 'warning');
    }
    showToast(editingCustomer ? 'Cập nhật khách hàng thành công!' : 'Thêm khách hàng thành công!', 'success');
    setOpenDialog(false);
  };

  const getTierStyle = (tier: string) => {
    switch(tier) {
      case 'DIAMOND': return { label: 'Kim Cương', color: '#2563eb', bg: '#eff6ff' };
      case 'GOLD': return { label: 'Vàng', color: '#d97706', bg: '#fef3c7' };
      case 'SILVER': return { label: 'Bạc', color: '#475569', bg: '#f1f5f9' };
      default: return { label: 'Đồng', color: '#c2410c', bg: '#ffedd5' };
    }
  };

  const filteredCustomers = initialCustomers.filter(c => 
    c.tenToChuc.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.maKH.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dienThoai.includes(searchQuery)
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ KHÁCH HÀNG
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã/Tên/Điện thoại" 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleToolbarClick('Thêm')} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xóa</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In</Button>
            <Button size="small" variant="contained" startIcon={<ImportIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Import</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Excel</Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  {['Khu vực', 'Nhóm', 'Mã KH', 'Tên tổ chức', 'Địa chỉ', 'Điện thoại', 'Email', 'Nhân viên', 'Đặt hàng'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} /></Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((row, index) => {
                  const tier = getTierStyle(row.nhom);
                  return (
                    <TableRow key={row.no} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Box onClick={() => handleEdit(row)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                          <Box sx={{ bgcolor: '#f39c12', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><TransferIcon sx={{ fontSize: 14 }} /></Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>{row.khuVuc}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                        <Chip icon={<StarsIcon style={{ color: tier.color, fontSize: '16px' }} />} label={tier.label} size="small" sx={{ bgcolor: tier.bg, color: tier.color, fontWeight: 600, borderRadius: 1.5 }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>{row.maKH}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{row.tenToChuc}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>{row.diaChi}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>{row.dienThoai}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>{row.email}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>{row.nhanVien}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                        <Chip label={row.coTheDatHang === '1' ? 'Có' : 'Không'} size="small" sx={{ bgcolor: row.coTheDatHang === '1' ? '#dcfce7' : '#fee2e2', color: row.coTheDatHang === '1' ? '#166534' : '#b91c1c', fontWeight: 600 }} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* DIALOG THÊM/SỬA */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>
          {editingCustomer ? 'CẬP NHẬT KHÁCH HÀNG' : 'THÊM MỚI KHÁCH HÀNG'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField size="small" label="Mã Khách Hàng" fullWidth value={formData.maKH} onChange={(e) => setFormData({...formData, maKH: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField size="small" label="Tên Khách Hàng / Tổ Chức (*)" fullWidth value={formData.tenToChuc} onChange={(e) => setFormData({...formData, tenToChuc: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField size="small" label="Số Điện Thoại (*)" fullWidth value={formData.dienThoai} onChange={(e) => setFormData({...formData, dienThoai: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField size="small" label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField size="small" label="Địa Chỉ" fullWidth value={formData.diaChi} onChange={(e) => setFormData({...formData, diaChi: e.target.value})} /></Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Nhóm Khách</InputLabel>
                <Select value={formData.nhom} label="Nhóm Khách" onChange={(e) => setFormData({...formData, nhom: e.target.value})}>
                  <MenuItem value="SILVER">Bạc (Silver)</MenuItem>
                  <MenuItem value="GOLD">Vàng (Gold)</MenuItem>
                  <MenuItem value="DIAMOND">Kim Cương (Diamond)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Có thể đặt hàng</InputLabel>
                <Select value={formData.coTheDatHang} label="Có thể đặt hàng" onChange={(e) => setFormData({...formData, coTheDatHang: e.target.value})}>
                  <MenuItem value="1">Được phép</MenuItem>
                  <MenuItem value="0">Không cho phép</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' } }}>Lưu Khách Hàng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};