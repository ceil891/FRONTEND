import React, { useState, useEffect } from 'react';
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
  CircularProgress,
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
import { inventoryAPI, productAPI, storeAPI, BackendInventory, BackendSanPham, BackendStore } from '../../api/client';

export const InventoryPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'import' | 'export' | 'transfer'>('import');
  const [loading, setLoading] = useState(true);
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
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadInventory();
    loadProducts();
    loadStores();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll();
      if (response.data.success) {
        const backendInv = response.data.data || [];
        const mappedInv: Inventory[] = backendInv.map((inv: BackendInventory) => ({
          id: inv.id.toString(),
          storeId: inv.storeId.toString(),
          productId: inv.productId.toString(),
          quantity: inv.quantity,
          minStock: inv.minStock,
          maxStock: inv.maxStock || undefined,
          lastUpdated: new Date(inv.lastUpdated),
        }));
        setInventory(mappedInv);
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách tồn kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll();
      if (response.data) {
        const prods = Array.isArray(response.data) ? response.data : [];
        const mappedProds = prods.map((p: BackendSanPham) => ({
          id: p.sanPhamId.toString(),
          name: p.tenSanPham,
        }));
        setProducts(mappedProds);
      }
    } catch (error: any) {
      // Ignore
    }
  };

  const loadStores = async () => {
    try {
      const response = await storeAPI.getAll();
      if (response.data.success) {
        const backendStores = response.data.data || [];
        const mappedStores = backendStores.map((s: BackendStore) => ({
          id: s.id.toString(),
          name: s.name,
        }));
        setStores(mappedStores);
      }
    } catch (error: any) {
      // Ignore
    }
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'N/A';
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

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    try {
      let type: 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'ADJUSTMENT' = 'IMPORT';
      if (dialogType === 'export') type = 'EXPORT';
      else if (dialogType === 'transfer') type = 'TRANSFER';

      const transactionData = {
        storeId: dialogType === 'transfer' ? parseInt(formData.toStoreId) : 1, // TODO: Get from auth
        productId: parseInt(formData.productId),
        type,
        quantity: dialogType === 'export' ? -parseInt(formData.quantity) : parseInt(formData.quantity),
        fromStoreId: dialogType === 'transfer' ? parseInt(formData.fromStoreId) : undefined,
        toStoreId: dialogType === 'transfer' ? parseInt(formData.toStoreId) : undefined,
        reason: formData.reason || undefined,
      };

      const response = await inventoryAPI.createTransaction(transactionData);
      if (response.data.success) {
        showToast(
          dialogType === 'import' ? 'Nhập kho thành công' :
          dialogType === 'export' ? 'Xuất kho thành công' :
          'Điều chuyển kho thành công',
          'success'
        );
        loadInventory();
        handleCloseDialog();
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tạo giao dịch kho', 'error');
    }
  };

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
                {inventory.map((item) => {
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
                {products.map((p) => (
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
                    {stores.map((s) => (
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
                    {stores.map((s) => (
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
