import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, CircularProgress,
  Checkbox, Pagination, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Map as MapIcon, LocationCity as CityIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

// Dữ liệu mẫu (Thành có thể thay bằng API tương tự các trang khác)
const mockAreas = [
  { id: 1, code: 'MB', name: 'Miền Bắc', description: 'Khu vực các tỉnh phía Bắc', storeCount: 12, isActive: true },
  { id: 2, code: 'MT', name: 'Miền Trung', description: 'Khu vực các tỉnh miền Trung & Tây Nguyên', storeCount: 5, isActive: true },
  { id: 3, code: 'MN', name: 'Miền Nam', description: 'Khu vực TP.HCM và các tỉnh lân cận', storeCount: 20, isActive: true },
  { id: 4, code: 'HT', name: 'Hệ thống online', description: 'Khu vực quản lý đơn hàng thương mại điện tử', storeCount: 1, isActive: false },
];

export const AreasPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    code: '', name: '', description: '', isActive: true,
  });

  const handleOpenDialog = (area?: any) => {
    if (area) {
      setEditingArea(area);
      setFormData({ code: area.code, name: area.name, description: area.description, isActive: area.isActive });
    } else {
      setEditingArea(null);
      setFormData({ code: '', name: '', description: '', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) return showToast('Vui lòng nhập mã và tên khu vực', 'warning');
    showToast(editingArea ? 'Cập nhật khu vực thành công' : 'Thêm khu vực mới thành công', 'success');
    setOpenDialog(false);
  };

  const filteredAreas = mockAreas.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ KHU VỰC / VÙNG MIỀN
        </Typography>
      </Box>

      {/* BẢNG CHUẨN RIC */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã/Tên khu vực..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            {isSuperAdmin() && (
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm Khu Vực</Button>
            )}
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Phân nhóm cửa hàng theo vùng địa lý để báo cáo doanh thu</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Sửa</TableCell>
                  
                  {['Mã Khu Vực', 'Tên Khu Vực', 'Mô Tả', 'Số Cửa Hàng', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : filteredAreas.map((area, index) => (
                  <TableRow key={area.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box onClick={() => handleOpenDialog(area)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'inline-flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{area.code}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', p: 1.5 }}>{area.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{area.description}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }} align="center">
                        <Chip label={`${area.storeCount} chi nhánh`} size="small" variant="outlined" sx={{ fontWeight: 600, color: '#0284c7', borderColor: '#0284c7' }} />
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip 
                        label={area.isActive ? 'Đang áp dụng' : 'Ngưng dùng'} 
                        size="small" 
                        sx={{ 
                          bgcolor: area.isActive ? '#dcfce7' : '#f1f5f9', 
                          color: area.isActive ? '#166534' : '#64748b', 
                          fontWeight: 600, borderRadius: 1 
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{filteredAreas.length} items</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* DIALOG FORM */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editingArea ? 'CẬP NHẬT KHU VỰC' : 'THÊM KHU VỰC MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField fullWidth size="small" label="Mã Khu Vực (*)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
            <TextField fullWidth size="small" label="Tên Khu Vực (*)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextField fullWidth size="small" label="Mô Tả" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight={600}>Trạng thái sử dụng:</Typography>
              <Chip 
                label={formData.isActive ? 'Đang hoạt động' : 'Tạm khóa'} 
                color={formData.isActive ? 'success' : 'default'} 
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} 
                sx={{ cursor: 'pointer', fontWeight: 600 }} 
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Lưu Khu Vực</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};