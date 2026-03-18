import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid, CircularProgress, IconButton
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileUpload as ImportIcon, FileDownload as ExcelIcon, 
  FilterAlt as FilterIcon, Edit as EditIcon, SwapHoriz as TransferIcon,
  Stars as StarsIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { customerAPI, areaAPI } from '../../api/client'; // Import API thật

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { showToast } = useToastStore();

  // State Form chuẩn theo CustomerRequest bên Java
  const [formData, setFormData] = useState({
    code: '', fullName: '', phone: '', email: '', address: '', 
    areaId: '', canPlaceOrder: true, tier: 'SILVER'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, areaRes] = await Promise.all([
        customerAPI.getAll(),
        areaAPI.getAll()
      ]);
      
      const cData = custRes.data as any;
      setCustomers(Array.isArray(cData) ? cData : (cData?.data || []));
      
      const aData = areaRes.data as any;
      setAreas(Array.isArray(aData) ? aData : (aData?.data || []));
    } catch (error: any) {
      showToast(error.message || 'Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        code: customer.code || '',
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        areaId: customer.areaId?.toString() || '',
        canPlaceOrder: customer.canPlaceOrder ?? true,
        tier: customer.tier || 'SILVER'
      });
    } else {
      setEditingCustomer(null);
      setFormData({ code: '', fullName: '', phone: '', email: '', address: '', areaId: '', canPlaceOrder: true, tier: 'SILVER' });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.phone || !formData.code) {
      return showToast('Mã, Tên và SĐT là bắt buộc', 'warning');
    }

    try {
      const payload = {
        ...formData,
        areaId: formData.areaId ? parseInt(formData.areaId) : null
      };

      if (editingCustomer) {
        await customerAPI.update(editingCustomer.id, payload);
        showToast('Cập nhật khách hàng thành công!', 'success');
      } else {
        await customerAPI.create(payload);
        showToast('Thêm khách hàng thành công!', 'success');
      }
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lưu khách hàng', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Xác nhận xóa khách hàng này?')) {
      try {
        await customerAPI.delete(id);
        showToast('Đã xóa thành công', 'success');
        loadData();
      } catch (error) {
        showToast('Không thể xóa khách hàng này', 'error');
      }
    }
  };

  const getTierStyle = (tier: string) => {
    switch(tier) {
      case 'DIAMOND': return { label: 'Kim Cương', color: '#2563eb', bg: '#eff6ff' };
      case 'GOLD': return { label: 'Vàng', color: '#d97706', bg: '#fef3c7' };
      default: return { label: 'Bạc', color: '#475569', bg: '#f1f5f9' };
    }
  };

  const filtered = customers.filter(c => 
    (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ KHÁCH HÀNG (CRM)
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm tên/mã/SĐT..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1 }}
            />
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a' }}>Thêm</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be' }}>In</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7' }}>Excel</Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nhóm</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mã KH</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên Khách Hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Khu Vực</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Điện Thoại</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Đặt hàng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : filtered.map((row, index) => {
                  const tier = getTierStyle(row.tier || 'SILVER');
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(row)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip icon={<StarsIcon style={{ color: tier.color, fontSize: '14px' }} />} label={tier.label} size="small" sx={{ bgcolor: tier.bg, color: tier.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{row.code}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.fullName}</TableCell>
                      <TableCell>{row.areaName || 'Chưa xếp'}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>
                        <Chip label={row.canPlaceOrder ? 'Có' : 'Khóa'} size="small" color={row.canPlaceOrder ? 'success' : 'error'} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* DIALOG FORM */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingCustomer ? 'CẬP NHẬT KHÁCH HÀNG' : 'THÊM KHÁCH HÀNG'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField size="small" label="Mã Khách Hàng (*)" fullWidth value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} /></Grid>
            <Grid item xs={6}><TextField size="small" label="Họ Tên / Tổ Chức (*)" fullWidth value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField size="small" label="Số Điện Thoại (*)" fullWidth value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField size="small" label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField size="small" label="Địa Chỉ" fullWidth value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Trực thuộc Khu Vực</InputLabel>
                <Select value={formData.areaId} label="Trực thuộc Khu Vực" onChange={(e) => setFormData({...formData, areaId: e.target.value})}>
                  {areas.map(a => <MenuItem key={a.id} value={a.id.toString()}>{a.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Quyền đặt hàng</InputLabel>
                <Select value={formData.canPlaceOrder ? "1" : "0"} label="Quyền đặt hàng" onChange={(e) => setFormData({...formData, canPlaceOrder: e.target.value === "1"})}>
                  <MenuItem value="1">Cho phép</MenuItem>
                  <MenuItem value="0">Khóa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a' }}>Lưu thông tin</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};