import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon, // Thêm icon cho Xuất Kho
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
    storeId: '', // ✅ Thêm storeId cho Nhập/Xuất
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

  const getStoreName = (storeId: string) => {
    return stores.find(s => s.id === storeId)?.name || 'N/A';
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
      storeId: '', // Reset
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
      storeId: '',
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
    
    // ✅ Phân loại validate theo hành động
    if (dialogType === 'transfer') {
      if (!formData.fromStoreId) errors.fromStoreId = 'Vui lòng chọn cửa hàng nguồn';
      if (!formData.toStoreId) errors.toStoreId = 'Vui lòng chọn cửa hàng đích';
      if (formData.fromStoreId && formData.toStoreId && formData.fromStoreId === formData.toStoreId) {
        errors.toStoreId = 'Cửa hàng đích phải khác cửa hàng nguồn';
      }
    } else {
      if (!formData.storeId) errors.storeId = 'Vui lòng chọn cửa hàng';
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
        // ✅ Khắc phục lỗi hardcode storeId: 1
        storeId: dialogType === 'transfer' ? parseInt(formData.toStoreId) : parseInt(formData.storeId), 
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
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Quản Lý Tồn Kho
        </Typography>
        {isSuperAdmin() && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('import')}
              sx={{
                background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                boxShadow: '0 3px 10px rgba(46, 125, 50, 0.3)',
                '&:hover': { background: 'linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)', transform: 'translateY(-2px)' },
              }}
            >
              Nhập Kho
            </Button>
            
            {/* ✅ THÊM NÚT XUẤT KHO Ở ĐÂY */}
            <Button
              variant="contained"
              startIcon={<RemoveIcon />}
              onClick={() => handleOpenDialog('export')}
              sx={{
                background: 'linear-gradient(45deg, #ed6c02 30%, #ff9800 90%)',
                boxShadow: '0 3px 10px rgba(237, 108, 2, 0.3)',
                '&:hover': { background: 'linear-gradient(45deg, #e65100 30%, #ed6c02 90%)', transform: 'translateY(-2px)' },
              }}
            >
              Xuất Kho
            </Button>

            <Button
              variant="contained"
              startIcon={<TransferIcon />}
              onClick={() => handleOpenDialog('transfer')}
              sx={{
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
                '&:hover': { background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)', transform: 'translateY(-2px)' },
              }}
            >
              Điều Chuyển
            </Button>
          </Box>
        )}
      </Box>

      {loading && inventory.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
      ) : (
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Cửa Hàng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sản Phẩm</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Tồn Kho</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Tối Thiểu</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Tối Đa</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cập Nhật Cuối</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => {
                    const status = getStockStatus(item.quantity, item.minStock);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{getStoreName(item.storeId)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {getProductName(item.productId)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">ID: {item.productId}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: status.color === 'error' ? 'error.main' : '#1e293b' }}>
                            {item.quantity.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{item.minStock}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{item.maxStock || '---'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                            variant={status.color === 'success' ? 'outlined' : 'filled'}
                            icon={status.color === 'error' ? <WarningIcon /> : undefined}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                          {item.lastUpdated.toLocaleDateString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {inventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Chưa có dữ liệu tồn kho.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Dialog for Import/Export/Transfer */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: dialogType === 'import' ? '#2e7d32' : dialogType === 'export' ? '#ed6c02' : '#1976d2' }}>
          {dialogType === 'import' && '📥 NHẬP KHO SẢN PHẨM'}
          {dialogType === 'export' && '📤 XUẤT KHO SẢN PHẨM'}
          {dialogType === 'transfer' && '🔄 ĐIỀU CHUYỂN KHO'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            
            {/* Nếu là Nhập/Xuất -> Chọn 1 cửa hàng. Nếu Điều chuyển -> Chọn Nguồn & Đích */}
            {dialogType !== 'transfer' ? (
              <FormControl fullWidth required error={!!formErrors.storeId}>
                <InputLabel>Cửa Hàng Thực Hiện</InputLabel>
                <Select
                  label="Cửa Hàng Thực Hiện"
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                >
                  {stores.map((s) => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                </Select>
                {formErrors.storeId && <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>{formErrors.storeId}</Typography>}
              </FormControl>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth required error={!!formErrors.fromStoreId}>
                    <InputLabel>Từ Cửa Hàng (Nguồn)</InputLabel>
                    <Select
                      label="Từ Cửa Hàng (Nguồn)"
                      value={formData.fromStoreId}
                      onChange={(e) => setFormData({ ...formData, fromStoreId: e.target.value })}
                    >
                      {stores.map((s) => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                    {formErrors.fromStoreId && <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>{formErrors.fromStoreId}</Typography>}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth required error={!!formErrors.toStoreId}>
                    <InputLabel>Đến Cửa Hàng (Đích)</InputLabel>
                    <Select
                      label="Đến Cửa Hàng (Đích)"
                      value={formData.toStoreId}
                      onChange={(e) => setFormData({ ...formData, toStoreId: e.target.value })}
                    >
                      {stores.map((s) => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                    {formErrors.toStoreId && <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>{formErrors.toStoreId}</Typography>}
                  </FormControl>
                </Grid>
              </Grid>
            )}

            <FormControl fullWidth required error={!!formErrors.productId}>
              <InputLabel>Sản Phẩm</InputLabel>
              <Select
                label="Sản Phẩm"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name} (Mã: {p.id})</MenuItem>
                ))}
              </Select>
              {formErrors.productId && <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>{formErrors.productId}</Typography>}
            </FormControl>

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
              label="Lý Do / Ghi chú"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={3}
              placeholder="Nhập lý do thực hiện giao dịch này..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Hủy Bỏ
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              fontWeight: 700, px: 3,
              background: dialogType === 'import' ? 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)'
                : dialogType === 'export' ? 'linear-gradient(45deg, #ed6c02 30%, #ff9800 90%)'
                : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
            }}
          >
            {dialogType === 'import' ? 'Xác Nhận Nhập Kho' : dialogType === 'export' ? 'Xác Nhận Xuất Kho' : 'Xác Nhận Điều Chuyển'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};