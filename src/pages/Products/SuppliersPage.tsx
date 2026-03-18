import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, Edit as EditIcon,
  AccountBalanceWallet as DebtIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// IMPORT API VÀ TYPES
import { supplierAPI } from '../../api/client';
import { BackendSupplier } from '../../types/api.types';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<BackendSupplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State quản lý Popup Form
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BackendSupplier | null>(null);
  const [formData, setFormData] = useState({ 
    supplierCode: '', supplierName: '', contactName: '', 
    phone: '', email: '', address: '', isActive: true 
  });

  const { showToast } = useToastStore();
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  // 1. Hàm Load danh sách "bao lô" mọi định dạng từ Backend
  const fetchSuppliers = async () => {
    try {
      const res = await supplierAPI.getAll();
      
      const responseData = res.data as any;
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
      setSuppliers(items);
    } catch (error: any) {
      showToast(error.message || 'Lỗi tải danh sách Nhà cung cấp', 'error');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 2. Lọc tìm kiếm (Đã sửa tên biến cho khớp Backend)
  const filteredSuppliers = suppliers.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone || '').includes(searchQuery)
  );

  // 3. Mở Form (Đã sửa luồng đọc dữ liệu đổ vào form)
  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        supplierCode: item.code || '', 
        supplierName: item.name || '', 
        contactName: item.contactPerson || '',
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        isActive: item.status === 'ACTIVE' 
      });
    } else {
      setEditingItem(null);
      setFormData({ supplierCode: '', supplierName: '', contactName: '', phone: '', email: '', address: '', isActive: true });
    }
    setOpenDialog(true);
  };

  // 4. Lưu Form
  const handleSave = async () => {
    if (!formData.supplierName.trim()) return showToast('Vui lòng nhập Tên Nhà cung cấp', 'warning');
    
    // ĐÃ SỬA: "Dịch" tên biến từ form sang đúng tên mà Java Spring Boot cần
    const payload = {
      code: formData.supplierCode,            // Gửi 'code' thay vì 'supplierCode'
      name: formData.supplierName,            // Gửi 'name' thay vì 'supplierName'
      contactPerson: formData.contactName,    // Gửi 'contactPerson' thay vì 'contactName'
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      status: formData.isActive ? 'ACTIVE' : 'INACTIVE'
    };

    try {
      if (editingItem) {
        await supplierAPI.update(editingItem.id, payload);
        showToast('Cập nhật thành công', 'success');
      } else {
        await supplierAPI.create(payload);
        showToast('Thêm mới thành công', 'success');
      }
      setOpenDialog(false);
      fetchSuppliers();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lưu Nhà cung cấp', 'error');
    }
  };

  // 5. Xóa Form
  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn khóa Nhà cung cấp này?')) {
      try {
        await supplierAPI.delete(id);
        showToast('Đã khóa thành công', 'success');
        fetchSuppliers();
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi khóa Nhà cung cấp', 'error');
      }
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH NHÀ CUNG CẤP
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã NCC/Tên/SĐT..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button onClick={() => handleOpenDialog()} size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm NCC</Button>
            <Button size="small" variant="contained" startIcon={<DebtIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thanh Toán Công Nợ</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Print</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1300 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>ID</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 90, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Mã NCC</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Tên Nhà Cung Cấp</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Người Liên Hệ</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Điện Thoại</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Email</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Công Nợ</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>Trạng Thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.id}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(row)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                    
                    {/* ĐÃ SỬA: Map đúng tên biến của Backend để hiện dữ liệu */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{row.code}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>{row.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.contactPerson}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.phone}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.email}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: (row.debtAmount || 0) > 0 ? '#dc2626' : '#475569', p: 1.5 }}>
                      {formatCurrency(row.debtAmount || 0)}
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip 
                        label={row.status === 'ACTIVE' ? 'Đang giao dịch' : 'Ngừng'} 
                        size="small" 
                        sx={{ bgcolor: row.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: row.status === 'ACTIVE' ? '#166534' : '#64748b', fontWeight: 600, border: 'none', borderRadius: 1 }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Tổng: {filteredSuppliers.length} bản ghi</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* DIALOG THÊM / SỬA */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>{editingItem ? 'SỬA NHÀ CUNG CẤP' : 'THÊM NHÀ CUNG CẤP'}</DialogTitle>
        <DialogContent sx={{ pt: '20px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField size="small" label="Mã NCC (Tự tạo nếu trống)" value={formData.supplierCode} onChange={e => setFormData({...formData, supplierCode: e.target.value})} />
            <TextField size="small" label="Tên Nhà cung cấp (*)" value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} required />
            <TextField size="small" label="Người liên hệ" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
            <TextField size="small" label="Điện thoại (10 số)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </Box>
          <TextField fullWidth size="small" label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <TextField fullWidth size="small" label="Địa chỉ" multiline rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, boxShadow: 'none' }}>Lưu thông tin</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};