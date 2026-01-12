import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  SwapHoriz as TransferIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Inventory, InventoryTransactionType } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const InventoryPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'import' | 'export' | 'transfer'>('import');
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [formData, setFormData] = useState({
    productId: '',
    fromStoreId: '',
    toStoreId: '',
    quantity: '',
    reason: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock data - Thay thế bằng API call
  const mockInventory: Inventory[] = [
    { id: '1', storeId: 'store-1', productId: 'prod-1', quantity: 150, minStock: 50, maxStock: 500, lastUpdated: new Date() },
    { id: '2', storeId: 'store-1', productId: 'prod-2', quantity: 25, minStock: 50, maxStock: 500, lastUpdated: new Date() },
    { id: '3', storeId: 'store-1', productId: 'prod-3', quantity: 80, minStock: 30, maxStock: 200, lastUpdated: new Date() },
  ];

  const mockProducts = [
    { id: 'prod-1', name: 'Coca Cola 330ml' },
    { id: 'prod-2', name: 'Pepsi 330ml' },
    { id: 'prod-3', name: 'Bánh mì thịt nướng' },
  ];

  const getProductName = (productId: string) => {
    return mockProducts.find(p => p.id === productId)?.name || 'N/A';
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity <= minStock) return { label: 'Sắp hết', color: 'error' as const };
    if (quantity <= minStock * 1.5) return { label: 'Cảnh báo', color: 'warning' as const };
    return { label: 'Bình thường', color: 'success' as const };
  };

  const handleOpenDialog = (type: 'import' | 'export' | 'transfer') => {
    setDialogType(type);
    setFormData({
      productId: '',
      fromStoreId: '',
      toStoreId: '',
      quantity: '',
      reason: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      productId: '',
      fromStoreId: '',
      toStoreId: '',
      quantity: '',
      reason: '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.productId) errors.productId = 'Vui lòng chọn sản phẩm';
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      errors.quantity = 'Số lượng phải lớn hơn 0';
    }
    if (dialogType === 'transfer') {
      if (!formData.fromStoreId) errors.fromStoreId = 'Vui lòng chọn cửa hàng nguồn';
      if (!formData.toStoreId) errors.toStoreId = 'Vui lòng chọn cửa hàng đích';
      if (formData.fromStoreId === formData.toStoreId) {
        errors.toStoreId = 'Cửa hàng đích phải khác cửa hàng nguồn';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }
    showToast(
      dialogType === 'import' ? 'Nhập kho thành công' :
      dialogType === 'export' ? 'Xuất kho thành công' :
      'Điều chuyển kho thành công',
      'success'
    );
    handleCloseDialog();
  };

  const mockStores = [
    { id: 'store-1', name: 'Cửa Hàng 1' },
    { id: 'store-2', name: 'Cửa Hàng 2' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản Lý Kho Hàng
        </Typography>
        {isSuperAdmin() && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('import')}
              sx={{
                background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                boxShadow: '0 3px 10px rgba(46, 125, 50, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)',
                  boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                },
              }}
            >
              Nhập Kho
            </Button>
            <Button
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={() => handleOpenDialog('transfer')}
              sx={{
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                },
              }}
            >
              Điều Chuyển
            </Button>
          </Box>
        )}
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã SP</TableCell>
                  <TableCell>Tên Sản Phẩm</TableCell>
                  <TableCell align="right">Tồn Kho</TableCell>
                  <TableCell align="right">Tối Thiểu</TableCell>
                  <TableCell align="right">Tối Đa</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>Cập Nhật</TableCell>
                  <TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockInventory.map((item) => {
                  const status = getStockStatus(item.quantity, item.minStock);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.productId}</TableCell>
                      <TableCell>{getProductName(item.productId)}</TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600 }}>
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.minStock}</TableCell>
                      <TableCell align="right">{item.maxStock}</TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                          icon={status.color === 'error' ? <WarningIcon /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(item.lastUpdated).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog for Import/Export/Transfer */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'import' && 'Nhập Kho'}
          {dialogType === 'export' && 'Xuất Kho'}
          {dialogType === 'transfer' && 'Điều Chuyển Kho'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required error={!!formErrors.productId}>
              <InputLabel>Sản Phẩm</InputLabel>
              <Select
                label="Sản Phẩm"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              >
                {mockProducts.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.productId && (
                <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                  {formErrors.productId}
                </Typography>
              )}
            </FormControl>
            {dialogType === 'transfer' && (
              <>
                <FormControl fullWidth required error={!!formErrors.fromStoreId}>
                  <InputLabel>Cửa Hàng Nguồn</InputLabel>
                  <Select
                    label="Cửa Hàng Nguồn"
                    value={formData.fromStoreId}
                    onChange={(e) => setFormData({ ...formData, fromStoreId: e.target.value })}
                  >
                    {mockStores.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.fromStoreId && (
                    <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                      {formErrors.fromStoreId}
                    </Typography>
                  )}
                </FormControl>
                <FormControl fullWidth required error={!!formErrors.toStoreId}>
                  <InputLabel>Cửa Hàng Đích</InputLabel>
                  <Select
                    label="Cửa Hàng Đích"
                    value={formData.toStoreId}
                    onChange={(e) => setFormData({ ...formData, toStoreId: e.target.value })}
                  >
                    {mockStores.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.toStoreId && (
                    <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                      {formErrors.toStoreId}
                    </Typography>
                  )}
                </FormControl>
              </>
            )}
            <TextField
              fullWidth
              label="Số Lượng"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              error={!!formErrors.quantity}
              helperText={formErrors.quantity}
              InputProps={{ inputProps: { min: 1 } }}
            />
            <TextField
              fullWidth
              label="Lý Do"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={3}
              placeholder="Nhập lý do nhập/xuất/điều chuyển kho..."
            />
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
              background: dialogType === 'import' 
                ? 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)'
                : dialogType === 'export'
                ? 'linear-gradient(45deg, #ed6c02 30%, #ff9800 90%)'
                : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: dialogType === 'import'
                ? '0 3px 10px rgba(46, 125, 50, 0.3)'
                : dialogType === 'export'
                ? '0 3px 10px rgba(237, 108, 2, 0.3)'
                : '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: dialogType === 'import'
                  ? 'linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)'
                  : dialogType === 'export'
                  ? 'linear-gradient(45deg, #e65100 30%, #ed6c02 90%)'
                  : 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: dialogType === 'import'
                  ? '0 6px 20px rgba(46, 125, 50, 0.4)'
                  : dialogType === 'export'
                  ? '0 6px 20px rgba(237, 108, 2, 0.4)'
                  : '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {dialogType === 'import' ? 'Nhập Kho' : dialogType === 'export' ? 'Xuất Kho' : 'Điều Chuyển'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
