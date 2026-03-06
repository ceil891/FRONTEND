import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, MenuItem,
  FormControl, InputLabel, Select, Checkbox, Pagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { Promotion } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { format } from 'date-fns';
import { promotionAPI, BackendPromotion } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export const PromotionsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '', name: '', description: '', discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0, minPurchase: 0, maxDiscount: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    isActive: true,
  });

  // ================= LOGIC API (GIỮ NGUYÊN 100%) =================
  const mapBackendToPromotion = (p: BackendPromotion): Promotion => ({
    id: String(p.id), code: p.code, name: p.name, description: p.description || undefined,
    discountType: p.discountType, discountValue: p.discountValue,
    minPurchase: p.minPurchase ?? undefined, maxDiscount: p.maxDiscount ?? undefined,
    startDate: new Date(p.startDate), endDate: new Date(p.endDate), isActive: p.active,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  });

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const resp = await promotionAPI.getAll();
      setPromotions((resp.data ?? []).map(mapBackendToPromotion));
    } catch (err: any) {
      showToast(err?.message || 'Không tải được danh sách khuyến mãi', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadPromotions(); }, []);

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        code: promotion.code, name: promotion.name, description: promotion.description || '',
        discountType: promotion.discountType, discountValue: promotion.discountValue,
        minPurchase: promotion.minPurchase || 0, maxDiscount: promotion.maxDiscount || 0,
        startDate: format(promotion.startDate, 'yyyy-MM-dd'), endDate: format(promotion.endDate, 'yyyy-MM-dd'),
        isActive: promotion.isActive,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        code: '', name: '', description: '', discountType: 'PERCENTAGE', discountValue: 0, minPurchase: 0, maxDiscount: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromotion(null);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) { showToast('Vui lòng điền đầy đủ mã và tên', 'warning'); return; }
    if (formData.discountValue <= 0) { showToast('Giá trị giảm giá phải lớn hơn 0', 'warning'); return; }
    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) { showToast('Phần trăm giảm không được vượt quá 100%', 'warning'); return; }
    if (new Date(formData.endDate) < new Date(formData.startDate)) { showToast('Ngày kết thúc phải sau ngày bắt đầu', 'warning'); return; }

    const payload: Omit<BackendPromotion, 'id' | 'createdAt' | 'updatedAt'> = {
      code: formData.code, name: formData.name, description: formData.description || null,
      discountType: formData.discountType, discountValue: formData.discountValue,
      minPurchase: formData.minPurchase || null, maxDiscount: formData.maxDiscount || null,
      startDate: formData.startDate, endDate: formData.endDate, active: formData.isActive,
    };

    try {
      if (editingPromotion) {
        await promotionAPI.update(Number(editingPromotion.id), payload);
        showToast('Cập nhật khuyến mãi thành công', 'success');
      } else {
        await promotionAPI.create(payload);
        showToast('Thêm khuyến mãi thành công', 'success');
      }
      await loadPromotions();
      handleCloseDialog();
    } catch (err: any) { showToast(err?.message || 'Lưu khuyến mãi thất bại', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
    try {
      await promotionAPI.delete(Number(id));
      showToast('Xóa khuyến mãi thành công', 'success');
      await loadPromotions();
    } catch (err: any) { showToast(err?.message || 'Xóa khuyến mãi thất bại', 'error'); }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const isActive = (promo: Promotion) => {
    const now = new Date();
    return promo.isActive && promo.startDate <= now && promo.endDate >= now;
  };

  // ================= GIAO DIỆN CHUẨN RIC =================
  const filteredPromotions = promotions.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH KHUYẾN MÃI
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã KM/Tên chương trình..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            {isSuperAdmin() && (
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm Mới</Button>
            )}
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Danh Sách</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
            {isSuperAdmin() && (
              <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xóa</Button>
            )}
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1300 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {['Mã KM', 'Tên Chương Trình', 'Loại Giảm', 'Giá Trị Giảm', 'Đơn Tối Thiểu', 'Thời Gian Áp Dụng', 'Trạng Thái'].map((col) => (
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
                   <TableRow>
                     <TableCell colSpan={10} align="center" sx={{ py: 5 }}>Đang tải dữ liệu...</TableCell>
                   </TableRow>
                ) : filteredPromotions.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>Không tìm thấy khuyến mãi nào</TableCell>
                   </TableRow>
                ) : (
                  filteredPromotions.map((row, index) => (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      
                      {/* Cột Thao tác */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          {isSuperAdmin() ? (
                            <>
                              <Box onClick={() => handleOpenDialog(row)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                              <Box onClick={() => handleDelete(row.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><DeleteIcon sx={{ fontSize: 14 }} /></Box>
                            </>
                          ) : <Typography variant="caption" color="text.secondary">---</Typography>}
                        </Box>
                      </TableCell>
                      
                      {/* Dữ liệu */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>
                        {row.code}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Typography variant="body2" fontWeight={600} color="#0f172a">{row.name}</Typography>
                        {row.description && <Typography variant="caption" color="text.secondary">{row.description}</Typography>}
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip 
                          label={row.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền mặt'} 
                          size="small" 
                          sx={{ bgcolor: row.discountType === 'PERCENTAGE' ? '#e0f2fe' : '#fef3c7', color: row.discountType === 'PERCENTAGE' ? '#0369a1' : '#b45309', fontWeight: 600, borderRadius: 1 }} 
                        />
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', p: 1.5 }}>
                        {row.discountType === 'PERCENTAGE' ? `${row.discountValue}%` : formatCurrency(row.discountValue)}
                        {row.discountType === 'PERCENTAGE' && row.maxDiscount ? <Typography variant="caption" sx={{ display: 'block', color: '#475569', fontWeight: 500 }}>(Tối đa: {formatCurrency(row.maxDiscount)})</Typography> : ''}
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>
                        {row.minPurchase ? formatCurrency(row.minPurchase) : 'Mọi đơn hàng'}
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                        {format(row.startDate, 'dd/MM/yyyy')} - {format(row.endDate, 'dd/MM/yyyy')}
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        {isActive(row) ? 
                          <Chip label="Đang áp dụng" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                          <Chip label="Hết hạn / Khóa" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
               {filteredPromotions.length > 0 ? `1 - ${filteredPromotions.length} of ${filteredPromotions.length} items` : 'No items to display'}
             </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG FORM (GIỮ NGUYÊN CODE CŨ CHỈ CHỈNH BORDER) ================= */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editingPromotion ? 'CHỈNH SỬA KHUYẾN MÃI' : 'THÊM KHUYẾN MÃI MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Mã Khuyến Mãi (*)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required />
              <FormControl fullWidth size="small">
                <InputLabel>Loại Giảm Giá</InputLabel>
                <Select label="Loại Giảm Giá" value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}>
                  <MenuItem value="PERCENTAGE">Phần trăm (%)</MenuItem>
                  <MenuItem value="FIXED">Số tiền mặt (VNĐ)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField fullWidth size="small" label="Tên Chương Trình (*)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <TextField fullWidth size="small" label="Mô Tả Điều Kiện" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline rows={2} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label={formData.discountType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })} required />
              {formData.discountType === 'PERCENTAGE' && (
                <TextField fullWidth size="small" label="Giảm tối đa (VNĐ)" type="number" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })} />
              )}
            </Box>
            <TextField fullWidth size="small" label="Đơn hàng tối thiểu (VNĐ)" type="number" value={formData.minPurchase} onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Ngày bắt đầu" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth size="small" label="Ngày kết thúc" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight={600}>Trạng thái:</Typography>
              <Chip label={formData.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'} color={formData.isActive ? 'success' : 'default'} onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} sx={{ cursor: 'pointer', fontWeight: 600 }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
            {editingPromotion ? 'Lưu Cập Nhật' : 'Lưu Khuyến Mãi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};