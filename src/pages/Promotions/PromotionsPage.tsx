import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as OfferIcon,
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

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    isActive: true,
  });

  const mapBackendToPromotion = (p: BackendPromotion): Promotion => ({
    id: String(p.id),
    code: p.code,
    name: p.name,
    description: p.description || undefined,
    discountType: p.discountType,
    discountValue: p.discountValue,
    minPurchase: p.minPurchase ?? undefined,
    maxDiscount: p.maxDiscount ?? undefined,
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
    isActive: p.active,
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPromotions();
  }, []);

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        code: promotion.code,
        name: promotion.name,
        description: promotion.description || '',
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        minPurchase: promotion.minPurchase || 0,
        maxDiscount: promotion.maxDiscount || 0,
        startDate: format(promotion.startDate, 'yyyy-MM-dd'),
        endDate: format(promotion.endDate, 'yyyy-MM-dd'),
        isActive: promotion.isActive,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
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
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromotion(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Vui lòng điền đầy đủ mã và tên khuyến mãi', 'warning');
      return;
    }
    if (formData.discountValue <= 0) {
      showToast('Giá trị giảm giá phải lớn hơn 0', 'warning');
      return;
    }
    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      showToast('Phần trăm giảm giá không được vượt quá 100%', 'warning');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      showToast('Ngày kết thúc phải sau ngày bắt đầu', 'warning');
      return;
    }

    const payload: Omit<BackendPromotion, 'id' | 'createdAt' | 'updatedAt'> = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      minPurchase: formData.minPurchase || null,
      maxDiscount: formData.maxDiscount || null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      active: formData.isActive,
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
    } catch (err: any) {
      showToast(err?.message || 'Lưu khuyến mãi thất bại', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
    try {
      await promotionAPI.delete(Number(id));
      showToast('Xóa khuyến mãi thành công', 'success');
      await loadPromotions();
    } catch (err: any) {
      showToast(err?.message || 'Xóa khuyến mãi thất bại', 'error');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const isActive = (promo: Promotion) => {
    const now = new Date();
    return promo.isActive && promo.startDate <= now && promo.endDate >= now;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <OfferIcon color="primary" />
          Quản Lý Khuyến Mãi
        </Typography>
        {isSuperAdmin() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              },
            }}
          >
            Thêm Khuyến Mãi
          </Button>
        )}
      </Box>

      <Card>
        <CardContent>
          {loading && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Đang tải danh sách khuyến mãi...
            </Typography>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã KM</TableCell>
                  <TableCell>Tên Chương Trình</TableCell>
                  <TableCell>Loại Giảm</TableCell>
                  <TableCell>Giá Trị</TableCell>
                  <TableCell>Đơn Tối Thiểu</TableCell>
                  <TableCell>Thời Gian</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {promo.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{promo.name}</Typography>
                      {promo.description && (
                        <Typography variant="caption" color="text.secondary">
                          {promo.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={promo.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền'}
                        color={promo.discountType === 'PERCENTAGE' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {promo.discountType === 'PERCENTAGE' ? (
                        <Typography sx={{ fontWeight: 600 }}>
                          {promo.discountValue}%
                          {promo.maxDiscount && ` (Tối đa ${formatCurrency(promo.maxDiscount)})`}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontWeight: 600 }}>
                          {formatCurrency(promo.discountValue)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {promo.minPurchase ? formatCurrency(promo.minPurchase) : 'Không có'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(promo.startDate, 'dd/MM/yyyy')} - {format(promo.endDate, 'dd/MM/yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isActive(promo) ? 'Đang áp dụng' : 'Không áp dụng'}
                        color={isActive(promo) ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {isSuperAdmin() && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(promo)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(promo.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPromotion ? 'Chỉnh Sửa Khuyến Mãi' : 'Thêm Khuyến Mãi Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Mã Khuyến Mãi"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Loại Giảm Giá</InputLabel>
                <Select
                  label="Loại Giảm Giá"
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                >
                  <MenuItem value="PERCENTAGE">Phần trăm (%)</MenuItem>
                  <MenuItem value="FIXED">Số tiền cố định</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Tên Chương Trình"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mô Tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label={formData.discountType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                required
              />
              {formData.discountType === 'PERCENTAGE' && (
                <TextField
                  fullWidth
                  label="Giảm tối đa (VNĐ)"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                />
              )}
            </Box>
            <TextField
              fullWidth
              label="Đơn hàng tối thiểu (VNĐ)"
              type="number"
              value={formData.minPurchase}
              onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Trạng thái:</Typography>
              <Chip
                label={formData.isActive ? 'Hoạt động' : 'Ngừng'}
                color={formData.isActive ? 'success' : 'default'}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {editingPromotion ? 'Cập Nhật' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
