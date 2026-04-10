import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField,
  Grid, Button, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, InputLabel, Select, MenuItem, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, 
  Print as PrintIcon, FileDownload as ExcelIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { customerAPI, areaAPI } from '../../api/client';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { showToast } = useToastStore();

  // 🟢 Khai báo đầy đủ các trường khớp với Backend
  const [formData, setFormData] = useState({
    code: '', 
    fullName: '', 
    phone: '', 
    email: '', 
    address: '', 
    areaId: '', 
    canPlaceOrder: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, areaRes] = await Promise.all([customerAPI.getAll(), areaAPI.getAll()]);
      setCustomers(custRes.data?.data || custRes.data || []);
      setAreas(areaRes.data?.data || areaRes.data || []);
    } catch (error: any) { 
      showToast('Lỗi tải dữ liệu', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenDialog = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        code: customer.code, 
        fullName: customer.fullName, 
        phone: customer.phone,
        email: customer.email || '', 
        address: customer.address || '',
        areaId: customer.areaId?.toString() || '', 
        canPlaceOrder: customer.canPlaceOrder ?? true
      });
    } else {
      setEditingCustomer(null);
      setFormData({ code: '', fullName: '', phone: '', email: '', address: '', areaId: '', canPlaceOrder: true });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    // Validate các trường có dấu (*)
    if (!formData.fullName || !formData.phone || !formData.code) {
        return showToast('Vui lòng nhập đầy đủ các trường bắt buộc (*)', 'warning');
    }
    try {
      const payload = { ...formData, areaId: formData.areaId ? parseInt(formData.areaId) : null };
      if (editingCustomer) await customerAPI.update(editingCustomer.id, payload);
      else await customerAPI.create(payload);
      showToast('Thành công!', 'success');
      setOpenDialog(false); 
      loadData();
    } catch (error: any) { 
        showToast(error.response?.data?.message || 'Lỗi khi lưu thông tin', 'error'); 
    }
  };

  const getRankStyle = (rank: string) => {
    const r = rank || "Đồng";
    if (r === 'Vàng') return { label: 'Vàng', color: '#d97706', bg: '#fef3c7' };
    if (r === 'Bạc') return { label: 'Bạc', color: '#475569', bg: '#f1f5f9' };
    return { label: 'Đồng', color: '#c2410c', bg: '#ffedd5' };
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>KHÁCH HÀNG (CRM)</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', borderRadius: 2, textTransform: 'none' }}>Thêm mới</Button>
            <Button variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', borderRadius: 2, textTransform: 'none' }}>In</Button>
            <Button variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', borderRadius: 2, textTransform: 'none' }}>Excel</Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
           <TextField size="small" placeholder="Tìm tên/mã/SĐT..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} sx={{ width: 320 }} />
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Thao Tác</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nhóm/Hạng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã KH</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên Khách Hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Điện Thoại</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Đặt hàng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : customers.filter(c => c.fullName.toLowerCase().includes(searchQuery.toLowerCase())).map((row, index) => {
                const rs = getRankStyle(row.rank);
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(row)}><EditIcon fontSize="small" /></IconButton>
                    </TableCell>
                    <TableCell><Chip label={rs.label} size="small" sx={{ bgcolor: rs.bg, color: rs.color, fontWeight: 700 }} /></TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0ea5e9' }}>{row.code}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.fullName}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell align="center"><Chip label={row.canPlaceOrder ? 'Có' : 'Khóa'} color={row.canPlaceOrder ? 'success' : 'error'} size="small" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 🟢 DIALOG CẬP NHẬT ĐẦY ĐỦ TRƯỜNG VÀ DẤU SAO (*) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', mb: 1 }}>
            {editingCustomer ? 'CẬP NHẬT KHÁCH HÀNG' : 'THÊM MỚI KHÁCH HÀNG'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
                <TextField size="small" label="Mã Khách Hàng (*)" fullWidth value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    placeholder="VD: KH001"
                />
            </Grid>
            <Grid item xs={6}>
                <TextField size="small" label="Họ và Tên (*)" fullWidth value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                />
            </Grid>
            <Grid item xs={12}>
                <TextField size="small" label="Số điện thoại (*)" fullWidth value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
            </Grid>
            <Grid item xs={12}>
                <TextField size="small" label="Địa chỉ Email" fullWidth value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="example@gmail.com"
                />
            </Grid>
            <Grid item xs={12}>
                <TextField size="small" label="Địa chỉ liên hệ" fullWidth value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                />
            </Grid>
            <Grid item xs={7}>
                <FormControl fullWidth size="small">
                    <InputLabel>Khu vực trực thuộc</InputLabel>
                    <Select label="Khu vực trực thuộc" value={formData.areaId} onChange={e => setFormData({...formData, areaId: e.target.value})}>
                        <MenuItem value=""><em>-- Chọn khu vực --</em></MenuItem>
                        {areas.map((a:any) => <MenuItem key={a.id} value={a.id.toString()}>{a.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={5}>
                <FormControl fullWidth size="small">
                    <InputLabel>Quyền đặt hàng</InputLabel>
                    <Select label="Quyền đặt hàng" value={formData.canPlaceOrder ? "true" : "false"} onChange={e => setFormData({...formData, canPlaceOrder: e.target.value === "true"})}>
                        <MenuItem value="true">Cho phép</MenuItem>
                        <MenuItem value="false">Khóa</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', px: 4, fontWeight: 700, borderRadius: 2 }}>
            Lưu thông tin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};