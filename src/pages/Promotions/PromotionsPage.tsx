import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, MenuItem,
  FormControl, InputLabel, Select, CircularProgress, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  LocalOffer as OfferIcon, FilterAlt as FilterIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { promotionAPI } from '../../api/client';

export const PromotionsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any | null>(null);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    isActive: true,
  });

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const resp = await promotionAPI.getAll();
      const responseData = resp.data as any;
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setPromotions(items);
    } catch (err: any) {
      showToast(err?.message || 'Không tải được danh sách khuyến mãi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleOpenDialog = (promo?: any) => {
    if (promo) {
      setEditingPromotion(promo);
      setFormData({
        code: promo.code,
        name: promo.name,
        description: promo.description || '',
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minPurchase: promo.minPurchase || 0,
        maxDiscount: promo.maxDiscount || 0,
        startDate: promo.startDate, // Java LocalDate format yyyy-MM-dd
        endDate: promo.endDate,
        isActive: promo.isActive ?? true,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        code: '', name: '', description: '', discountType: 'PERCENTAGE',
        discountValue: 0, minPurchase: 0, maxDiscount: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || formData.discountValue <= 0) {
      return showToast('Vui lòng nhập đầy đủ thông tin hợp lệ', 'warning');
    }

    // Payload khớp chính xác với PromotionRequest.java
    const payload = {
      ...formData,
      code: formData.code.toUpperCase(),
      minPurchase: formData.minPurchase || null,
      maxDiscount: formData.maxDiscount || null,
    };

    try {
      if (editingPromotion) {
        await promotionAPI.update(editingPromotion.id, payload);
        showToast('Cập nhật thành công', 'success');
      } else {
        await promotionAPI.create(payload);
        showToast('Thêm mới thành công', 'success');
      }
      loadPromotions();
      setOpenDialog(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lưu thất bại', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa chương trình khuyến mãi này?')) return;
    try {
      await promotionAPI.delete(id);
      showToast('Đã xóa thành công', 'success');
      loadPromotions();
    } catch (err: any) {
      showToast('Không thể xóa', 'error');
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <OfferIcon color="primary" /> QUẢN LÝ KHUYẾN MÃI
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a' }}>
          Thêm Khuyến Mãi
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Mã KM</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tên Chương Trình</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Loại Giảm</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giá Trị</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : promotions.map((promo) => (
                <TableRow key={promo.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>{promo.code}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{promo.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{promo.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={promo.discountType === 'PERCENTAGE' ? '%' : 'VNĐ'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {promo.startDate} đến {promo.endDate}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={promo.isActive ? 'Đang chạy' : 'Tạm ngưng'} 
                      color={promo.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(promo)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(promo.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog Thêm/Sửa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingPromotion ? 'SỬA KHUYẾN MÃI' : 'THÊM MỚI'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="Mã KM (*)" size="small" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
            <FormControl size="small">
              <InputLabel>Loại giảm giá</InputLabel>
              <Select label="Loại giảm giá" value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})}>
                <MenuItem value="PERCENTAGE">Phần trăm (%)</MenuItem>
                <MenuItem value="FIXED">Số tiền cố định (VNĐ)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField label="Tên chương trình (*)" size="small" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <TextField label="Giá trị giảm (*)" size="small" type="number" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})} />
            <TextField label="Giảm tối đa (VNĐ)" size="small" type="number" value={formData.maxDiscount} onChange={(e) => setFormData({...formData, maxDiscount: Number(e.target.value)})} />
            <TextField label="Đơn tối thiểu (VNĐ)" size="small" type="number" value={formData.minPurchase} onChange={(e) => setFormData({...formData, minPurchase: Number(e.target.value)})} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Ngày bắt đầu" size="small" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} InputLabelProps={{ shrink: true }} />
            <TextField label="Ngày kết thúc" size="small" type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Typography variant="body2">Kích hoạt chương trình:</Typography>
             <Chip 
               label={formData.isActive ? "BẬT" : "TẮT"} 
               color={formData.isActive ? "success" : "default"} 
               onClick={() => setFormData({...formData, isActive: !formData.isActive})}
               sx={{ cursor: 'pointer', fontWeight: 700 }}
             />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a' }}>Lưu thông tin</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};