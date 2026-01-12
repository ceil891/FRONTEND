import React, { useState } from 'react';
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

export const PromotionsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  // Mock data - Thay thế bằng API call
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      code: 'GIAM10',
      name: 'Giảm 10% cho đơn hàng trên 100k',
      description: 'Áp dụng cho tất cả sản phẩm',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 100000,
      maxDiscount: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      code: 'FIXED20K',
      name: 'Giảm 20.000đ',
      description: 'Áp dụng cho đơn hàng trên 50k',
      discountType: 'FIXED',
      discountValue: 20000,
      minPurchase: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

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

  const handleSave = () => {
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

    if (editingPromotion) {
      setPromotions(promotions.map(promo =>
        promo.id === editingPromotion.id
          ? {
              ...promo,
              ...formData,
              startDate: new Date(formData.startDate),
              endDate: new Date(formData.endDate),
              updatedAt: new Date(),
            }
          : promo
      ));
      showToast('Cập nhật khuyến mãi thành công', 'success');
    } else {
      const newPromotion: Promotion = {
        id: Date.now().toString(),
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setPromotions([...promotions, newPromotion]);
      showToast('Thêm khuyến mãi thành công', 'success');
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      setPromotions(promotions.filter(promo => promo.id !== id));
      showToast('Xóa khuyến mãi thành công', 'success');
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
