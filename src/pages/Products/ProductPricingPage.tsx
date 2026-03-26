import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, CircularProgress, IconButton, Stack, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid // 🟢 THÊM IMPORT CHO MODAL SỬA GIÁ
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon, FileUpload as ImportIcon,
  Edit as EditIcon, CheckCircleOutline as CheckCircleIcon, Refresh as RefreshIcon,
  Save as SaveIcon // 🟢 THÊM ICON LƯU
} from '@mui/icons-material';

// IMPORT API THỰC TẾ
import { productPricingAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const ProductPricingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pricings, setPricings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { showToast } = useToastStore();

  // --- STATE QUẢN LÝ MODAL SỬA GIÁ ---
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({
    variantId: null, storeId: null, baseCostPrice: 0, baseRetailPrice: 0, wholesalePrice: 0, status: '',
    sku: '', productName: '', storeName: '' // Chỉ để hiển thị
  });

  // --- LẤY DỮ LIỆU TỪ BACKEND ---
  const fetchPricings = useCallback(async (query: string = '') => {
    setLoading(true);
    try {
      const res = query ? await productPricingAPI.search(query) : await productPricingAPI.getAll();
      const data = res.data?.data || res.data || [];
      setPricings(Array.isArray(data) ? data : []);
      setSelectedIds([]); 
    } catch (error: any) {
      showToast('Lỗi tải dữ liệu bảng giá', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchPricings(); }, [fetchPricings]);

  // --- XỬ LÝ CHECKBOX ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(pricings.map(p => p.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // --- MỞ MODAL SỬA GIÁ ---
  const handleOpenEdit = (row: any) => {
    setEditFormData({
      variantId: row.variantId,
      storeId: row.storeId,
      baseCostPrice: row.baseCostPrice || 0,
      baseRetailPrice: row.baseRetailPrice || 0,
      wholesalePrice: row.wholesalePrice || 0,
      status: row.status,
      sku: row.sku,
      productName: row.productName,
      storeName: row.storeName
    });
    setOpenEditModal(true);
  };

  // --- LƯU GIÁ ĐÃ SỬA XUỐNG DB ---
  const handleSaveEdit = async () => {
    try {
      await productPricingAPI.setup({
        variantId: editFormData.variantId,
        storeId: editFormData.storeId,
        baseCostPrice: Number(editFormData.baseCostPrice),
        baseRetailPrice: Number(editFormData.baseRetailPrice),
        wholesalePrice: Number(editFormData.wholesalePrice),
        status: editFormData.status
      });
      showToast('Cập nhật giá thành công!', 'success');
      setOpenEditModal(false);
      fetchPricings(searchQuery); // Load lại bảng
    } catch (error: any) {
      showToast('Có lỗi xảy ra khi lưu giá', 'error');
    }
  };

  // --- XỬ LÝ DUYỆT VÀ XÓA ---
  const handleApprove = async (id?: number) => {
    const idsToApprove = id ? [id] : selectedIds;
    if (idsToApprove.length === 0) return showToast('Vui lòng chọn bảng giá để duyệt', 'warning');
    try {
      await Promise.all(idsToApprove.map(appId => productPricingAPI.approve(appId)));
      showToast(`Đã duyệt thành công ${idsToApprove.length} bảng giá`, 'success');
      fetchPricings(searchQuery);
    } catch (error: any) { showToast('Lỗi khi duyệt giá', 'error'); }
  };

  const handleDelete = async (id?: number) => {
    const idsToDelete = id ? [id] : selectedIds;
    if (idsToDelete.length === 0) return showToast('Vui lòng chọn bảng giá cần xóa', 'warning');
    if (!window.confirm(`Bạn có chắc muốn xóa ${idsToDelete.length} bảng giá?`)) return;
    try {
      await Promise.all(idsToDelete.map(delId => productPricingAPI.delete(delId)));
      showToast(`Đã xóa ${idsToDelete.length} bảng giá`, 'success');
      fetchPricings(searchQuery);
    } catch (error: any) { showToast('Có lỗi xảy ra khi xóa', 'error'); }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>BẢNG GIÁ THEO CỬA HÀNG</Typography>
        <Button startIcon={<RefreshIcon />} onClick={() => fetchPricings(searchQuery)} size="small" variant="outlined">Làm mới</Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã hàng/Tên hàng/Chi nhánh..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPricings(searchQuery)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            <Button size="small" variant="contained" onClick={() => showToast('Tạo mới đang xây dựng', 'info')} startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', textTransform: 'none', boxShadow: 'none' }}>Thiết Lập Giá</Button>
            <Button size="small" variant="contained" onClick={() => handleApprove()} startIcon={<CheckCircleIcon />} sx={{ bgcolor: '#39cccc', textTransform: 'none', boxShadow: 'none' }}>Duyệt Giá</Button>
            <Button size="small" variant="contained" onClick={() => showToast('Đang xây dựng', 'info')} startIcon={<ImportIcon />} sx={{ bgcolor: '#f39c12', textTransform: 'none', boxShadow: 'none' }}>Import</Button>
            <Button size="small" variant="contained" onClick={() => handleDelete()} startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', textTransform: 'none', boxShadow: 'none' }}>Xóa</Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center">
                    <Checkbox size="small" checked={pricings.length > 0 && selectedIds.length === pricings.length} indeterminate={selectedIds.length > 0 && selectedIds.length < pricings.length} onChange={handleSelectAll} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 100, p: 1, fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  {['Mã Hàng', 'Tên Hàng Hóa', 'Cửa Hàng', 'Giá Vốn', 'Giá Bán Lẻ', 'Giá Bán Buôn', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontWeight: 600, color: '#475569' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>{col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} /></Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 10 }}><CircularProgress size={30}/></TableCell></TableRow>
                ) : pricings.length === 0 ? (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5 }}>Không có dữ liệu</TableCell></TableRow>
                ) : pricings.map((row, index) => (
                  <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, color: '#64748b' }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center">
                      <Checkbox size="small" checked={selectedIds.includes(row.id)} onChange={() => handleSelectOne(row.id)} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {/* 🟢 NÚT SỬA ĐÃ GẮN SỰ KIỆN MỞ MODAL 🟢 */}
                        <Tooltip title="Sửa"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)} sx={{ bgcolor: '#eff6ff' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        {row.status !== 'Đang áp dụng' && row.status !== 'ACTIVE' && (
                          <Tooltip title="Duyệt"><IconButton size="small" color="success" sx={{ bgcolor: '#f0fdf4' }} onClick={() => handleApprove(row.id)}><CheckCircleIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        <Tooltip title="Xóa"><IconButton size="small" color="error" sx={{ bgcolor: '#fef2f2' }} onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#64748b', p: 1.5 }}>{row.sku}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#0f172a', fontWeight: 600, p: 1.5 }}>{row.productName}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#0284c7', fontWeight: 600, p: 1.5 }}>{row.storeName}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#475569', p: 1.5 }}>{formatCurrency(row.baseCostPrice)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#16a34a', p: 1.5 }}>{formatCurrency(row.baseRetailPrice)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#d97706', p: 1.5 }}>{formatCurrency(row.wholesalePrice)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip label={row.status === 'ACTIVE' ? 'Đang áp dụng' : (row.status || 'Chờ duyệt')} size="small" sx={{ bgcolor: row.status === 'Đang áp dụng' || row.status === 'ACTIVE' ? '#dcfce7' : '#fef08a', color: row.status === 'Đang áp dụng' || row.status === 'ACTIVE' ? '#166534' : '#854d0e', fontWeight: 600, borderRadius: 1 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" color="primary" />
             <Typography variant="body2" color="text.secondary">Đã chọn {selectedIds.length} / {pricings.length}</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 🟢 MODAL CẬP NHẬT GIÁ TỪNG SẢN PHẨM 🟢 */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Cập Nhật Bảng Giá</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* Thông tin readonly để User biết đang sửa cái gì */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Sản phẩm: <strong style={{color: '#0f172a'}}>{editFormData.productName} ({editFormData.sku})</strong></Typography>
            <Typography variant="subtitle2" color="text.secondary">Cửa hàng áp dụng: <strong style={{color: '#0284c7'}}>{editFormData.storeName}</strong></Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                label="Giá Vốn (Cost Price)" type="number" fullWidth 
                value={editFormData.baseCostPrice} 
                onChange={(e) => setEditFormData({...editFormData, baseCostPrice: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Giá Bán Lẻ (Retail Price)" type="number" fullWidth 
                value={editFormData.baseRetailPrice} 
                onChange={(e) => setEditFormData({...editFormData, baseRetailPrice: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Giá Bán Buôn (Wholesale)" type="number" fullWidth 
                value={editFormData.wholesalePrice} 
                onChange={(e) => setEditFormData({...editFormData, wholesalePrice: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenEditModal(false)} color="inherit">Hủy bỏ</Button>
          <Button onClick={handleSaveEdit} variant="contained" startIcon={<SaveIcon />} sx={{ bgcolor: '#0ea5e9' }}>Lưu Thay Đổi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};