import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, MenuItem,
  FormControl, InputLabel, Select, CircularProgress, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  LocalOffer as OfferIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { format, isAfter, parseISO } from 'date-fns';
import { promotionAPI } from '../../api/client';

export const PromotionsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any | null>(null);
  const { showToast } = useToastStore();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE', 
    isMaxLimit: false, 
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    applyFor: 'ALL', // 🟢 MẶC ĐỊNH ÁP DỤNG CHO TẤT CẢ
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

  useEffect(() => { loadPromotions(); }, []);

  const handleOpenDialog = (promo?: any) => {
    if (promo) {
      setEditingPromotion(promo);
      setFormData({
        code: promo.code,
        name: promo.name,
        description: promo.description || '',
        discountType: promo.discountType,
        isMaxLimit: promo.discountType === 'PERCENTAGE' && (promo.maxDiscount || 0) > 0,
        discountValue: promo.discountValue,
        minPurchase: promo.minPurchase || 0,
        maxDiscount: promo.maxDiscount || 0,
        applyFor: promo.applyFor || 'ALL', // 🟢 LOAD DỮ LIỆU CŨ
        startDate: promo.startDate,
        endDate: promo.endDate,
        isActive: promo.isActive ?? true,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        code: '', name: '', description: '', discountType: 'PERCENTAGE', isMaxLimit: false,
        discountValue: 0, minPurchase: 0, maxDiscount: 0, applyFor: 'ALL',
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

    if (isAfter(parseISO(formData.startDate), parseISO(formData.endDate))) {
      return showToast('Ngày bắt đầu không được sau ngày kết thúc', 'error');
    }

    const payload = {
      ...formData,
      code: formData.code.toUpperCase(),
      maxDiscount: (formData.discountType === 'FIXED' || !formData.isMaxLimit) ? 0 : formData.maxDiscount,
      minPurchase: formData.minPurchase || 0,
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

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  // Helper để hiển thị tên hạng thẻ thân thiện hơn
  const getRankLabel = (rank: string) => {
    switch(rank) {
        case 'BRONZE': return 'Hạng Đồng';
        case 'SILVER': return 'Hạng Bạc';
        case 'GOLD': return 'Hạng Vàng';
        default: return 'Tất cả';
    }
  };

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
                <TableCell sx={{ fontWeight: 600 }}>Đối Tượng</TableCell> {/* 🟢 THÊM CỘT MỚI */}
                <TableCell sx={{ fontWeight: 600 }}>Loại Giảm</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giá Trị</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : promotions.map((promo) => (
                <TableRow key={promo.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>{promo.code}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{promo.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{promo.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={getRankLabel(promo.applyFor)} size="small" variant="filled" color={promo.applyFor === 'ALL' ? 'default' : 'primary'} />
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={promo.discountType === 'PERCENTAGE' ? (promo.maxDiscount > 0 ? '% (Có trần)' : '% (Cố định)') : 'VNĐ'} 
                        size="small" variant="outlined" 
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
                    {promo.maxDiscount > 0 && <Typography variant="caption" display="block" color="error">Tối đa: {formatCurrency(promo.maxDiscount)}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {promo.startDate} đến {promo.endDate}
                  </TableCell>
                  <TableCell>
                    <Chip label={promo.isActive ? 'Đang chạy' : 'Tạm ngưng'} color={promo.isActive ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(promo)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => promo.id && promotionAPI.delete(promo.id).then(() => {showToast('Đã xóa', 'success'); loadPromotions();})}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingPromotion ? 'SỬA KHUYẾN MÃI' : 'TẠO CHƯƠNG TRÌNH KHUYẾN MÃI'}
          <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="Mã KM (*)" size="small" fullWidth value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
            
            <FormControl size="small" fullWidth>
              <InputLabel>Loại hình giảm giá</InputLabel>
              <Select 
                label="Loại hình giảm giá" 
                value={formData.discountType === 'FIXED' ? 'FIXED' : (formData.isMaxLimit ? 'PERCENT_LIMIT' : 'PERCENT_FIXED')} 
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'FIXED') setFormData({...formData, discountType: 'FIXED', isMaxLimit: false, maxDiscount: 0});
                    else if (val === 'PERCENT_FIXED') setFormData({...formData, discountType: 'PERCENTAGE', isMaxLimit: false, maxDiscount: 0});
                    else setFormData({...formData, discountType: 'PERCENTAGE', isMaxLimit: true});
                }}
              >
                <MenuItem value="PERCENT_FIXED">Phần trăm (%) - Không giới hạn</MenuItem>
                <MenuItem value="PERCENT_LIMIT">Phần trăm (%) - Có giới hạn tối đa</MenuItem>
                <MenuItem value="FIXED">Số tiền cố định (VNĐ)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField label="Tên chương trình (*)" size="small" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* 🟢 MỤC CHỌN ĐỐI TƯỢNG ÁP DỤNG */}
            <FormControl size="small" fullWidth>
                <InputLabel>Áp dụng cho đối tượng (*)</InputLabel>
                <Select
                    label="Áp dụng cho đối tượng (*)"
                    value={formData.applyFor}
                    onChange={(e) => setFormData({...formData, applyFor: e.target.value})}
                >
                    <MenuItem value="ALL">Tất cả khách hàng thành viên</MenuItem>
                    <MenuItem value="BRONZE">Thành viên Hạng Đồng trở lên</MenuItem>
                    <MenuItem value="SILVER">Thành viên Hạng Bạc trở lên</MenuItem>
                    <MenuItem value="GOLD">Chỉ thành viên Hạng Vàng</MenuItem>
                </Select>
            </FormControl>

            <TextField label="Đơn tối thiểu (VNĐ)" size="small" type="number" fullWidth value={formData.minPurchase} onChange={(e) => setFormData({...formData, minPurchase: Number(e.target.value)})} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField 
                label={formData.discountType === 'PERCENTAGE' ? "Giá trị giảm (%) *" : "Số tiền giảm (VNĐ) *"} 
                size="small" type="number" value={formData.discountValue} 
                onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})} 
            />
            
            <TextField 
                label="Giảm tối đa (VNĐ)" 
                size="small" type="number" 
                disabled={!formData.isMaxLimit}
                value={formData.maxDiscount} 
                onChange={(e) => setFormData({...formData, maxDiscount: Number(e.target.value)})}
                helperText={!formData.isMaxLimit ? "Không áp dụng cho loại này" : ""}
            />
          </Box>

          <Divider sx={{ my: 1 }}>Thời gian áp dụng</Divider>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField 
                label="Ngày bắt đầu" size="small" type="date" 
                value={formData.startDate} 
                onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                InputLabelProps={{ shrink: true }} 
            />
            <TextField 
                label="Ngày kết thúc" size="small" type="date" 
                value={formData.endDate} 
                error={isAfter(parseISO(formData.startDate), parseISO(formData.endDate))}
                helperText={isAfter(parseISO(formData.startDate), parseISO(formData.endDate)) ? "Ngày kết thúc phải sau ngày bắt đầu" : ""}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                InputLabelProps={{ shrink: true }} 
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Typography variant="body2">Trạng thái hoạt động:</Typography>
             <Chip 
               label={formData.isActive ? "ĐANG BẬT" : "ĐANG TẮT"} 
               color={formData.isActive ? "success" : "default"} 
               onClick={() => setFormData({...formData, isActive: !formData.isActive})}
               sx={{ cursor: 'pointer', fontWeight: 700, width: 120 }}
             />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', px: 4 }}>
            Lưu thông tin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};