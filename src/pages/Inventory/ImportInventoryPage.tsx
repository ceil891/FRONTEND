import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, IconButton, MenuItem, Select, FormControl, 
  InputLabel, InputAdornment, Divider, List, ListItem, ListItemText, 
  Stack, ListItemButton, Checkbox, Paper
} from '@mui/material';
import {
  Add as AddIcon, Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, AccountBalanceWallet as DebtIcon, Close as CloseIcon,
  Search as SearchIcon, AddCircle as AddCircleIcon, 
  Remove as RemoveIcon, PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import BusinessIcon from '@mui/icons-material/Business';
import { useToastStore } from '../../store/toastStore';
import { importTicketAPI, supplierAPI, productAPI, storeAPI } from '../../api/client'; // Thêm storeAPI

// --- TYPES ---
interface BackendImportTicket {
  id: number;
  code?: string;
  importDate?: string;
  createdAt?: string;
  supplierName?: string;
  totalAmount?: number;
  paidAmount?: number;
  debtAmount?: number;
  creatorName?: string;
  createdByName?: string;
  status?: string;
}

interface Supplier { id: number; name: string; phone: string; }
interface ProductVariant { 
  id: number; 
  variantName?: string; 
  name?: string; 
  sku: string; 
  costPrice?: number; 
  basePrice?: number; 
}

// --- MAIN COMPONENT ---
export const ImportInventoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [imports, setImports] = useState<BackendImportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); 
  
  // State API
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [stores, setStores] = useState<any[]>([]); // State lưu danh sách cửa hàng
  const [currentStoreId, setCurrentStoreId] = useState<number | string>(''); // State lưu cửa hàng đang chọn
  
  // State Dialogs
  const [openDetail, setOpenDetail] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false); 
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // 1. TẢI DỮ LIỆU BAN ĐẦU
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [importRes, supRes, prodRes, storeRes] = await Promise.all([
        importTicketAPI.getAll(),
        supplierAPI.getAll(),
        productAPI.getAll(),
        storeAPI.getAll() // Lấy danh sách cửa hàng
      ]);
      
      setImports(importRes.data?.data || importRes.data || []);
      setSuppliers(supRes.data?.data || supRes.data || []);
      
      // Xử lý danh sách cửa hàng
      const fetchedStores = storeRes.data?.data || storeRes.data || [];
      setStores(fetchedStores);
      if (fetchedStores.length > 0) {
        setCurrentStoreId(fetchedStores[0].id); // Mặc định chọn cửa hàng đầu tiên
      }

      const rawProducts = prodRes.data?.data || prodRes.data || [];
      const allVariants = rawProducts.flatMap((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          return product.variants.map((v: any) => ({
            ...v,
            variantName: v.variantName || `${product.name} - ${v.colorName || ''} ${v.sizeName || ''}`.trim(),
            costPrice: v.costPrice || product.baseCostPrice || 0 
          }));
        }
        return [];
      });

      setProducts(allVariants); 
    } catch (error: any) {
      showToast('Lỗi khi tải dữ liệu trang', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  // --- LOGIC XỬ LÝ NÚT BẤM TOOLBAR ---

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một phiếu nhập để in.', 'warning');
      return;
    }
    showToast(`Chuẩn bị in ${selectedIds.length} phiếu...`, 'info');
    setTimeout(() => { window.print(); }, 500);
  };

  const handleExportExcel = () => {
     if (selectedIds.length === 0 && imports.length === 0) {
      showToast('Không có dữ liệu để xuất.', 'warning');
      return;
    }
    showToast('Đang tạo file Excel...', 'info');
  };

  const handleOpenPayment = () => {
    const debtTickets = imports.filter(t => (t.debtAmount || 0) > 0);
    if (debtTickets.length === 0) {
      showToast('Hiện không có phiếu nhập nào đang ghi nợ!', 'info');
      return;
    }
    setOpenPaymentDialog(true);
  };

  const handleViewDetail = async (id: number) => {
    try {
      setOpenDetail(true);
      setDetailLoading(true);
      const res = await importTicketAPI.getById(id);
      setSelectedTicket(res.data?.data || res.data);
    } catch (error) {
      showToast('Lỗi khi lấy chi tiết phiếu', 'error');
      setOpenDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelTicket = async (id: number, code?: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy phiếu nhập ${code || id}? Hành động này sẽ hoàn lại tồn kho.`)) {
      try {
        await importTicketAPI.cancel(id);
        showToast('Hủy phiếu nhập thành công', 'success');
        loadInitialData();
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi hủy phiếu', 'error');
      }
    }
  };

  // Tìm kiếm
  const filteredImports = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return imports;
    return imports.filter(p => 
      (p.code || '').toLowerCase().includes(kw) || 
      (p.supplierName || '').toLowerCase().includes(kw)
    );
  }, [imports, searchQuery]);

  // Checkbox Chọn Tất Cả
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredImports.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Checkbox Chọn Lẻ
  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const renderStatusChip = (status?: string) => {
    if (!status) return <Chip label="Chưa rõ" size="small" />;
    const s = status.toUpperCase();
    if (s === 'COMPLETED' || s === 'ĐÃ THANH TOÁN') return <Chip label="Hoàn thành" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} />;
    if (s === 'DEBT' || s === 'GHI NỢ') return <Chip label="Ghi nợ" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none', borderRadius: 1 }} />;
    if (s === 'CANCELLED' || s === 'ĐÃ HỦY') return <Chip label="Đã hủy" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', borderRadius: 1 }} />;
    return <Chip label={status} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', borderRadius: 1 }} />;
  };

  // --- LOGIC FORM LẬP PHIẾU NHẬP MỚI ---
  const initialForm = { supplierId: '', importDate: new Date().toISOString().split('T')[0], paidAmount: 0, items: [] as any[] };
  const [addFormData, setAddFormData] = useState(initialForm);
  const [productSearchKey, setProductSearchKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const calculatedAmounts = useMemo(() => {
    const totalAmount = addFormData.items.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0);
    const paidAmount = Number(addFormData.paidAmount) || 0;
    const debtAmount = Math.max(0, totalAmount - paidAmount);
    return { totalAmount, paidAmount, debtAmount };
  }, [addFormData.items, addFormData.paidAmount]);

  const filteredProducts = useMemo(() => {
    const kw = productSearchKey.trim().toLowerCase();
    if (kw.length < 2) return [];
    return products.filter(p => 
      (p.variantName || '').toLowerCase().includes(kw) || 
      (p.sku || '').toLowerCase().includes(kw)
    );
  }, [productSearchKey, products]);

  const handleAddProductToTicket = (prod: any) => {
    setAddFormData(prev => {
      const existingItem = prev.items.find(item => item.variantId === prod.id);
      if (existingItem) {
        return {
          ...prev,
          items: prev.items.map(item => item.variantId === prod.id ? { ...item, quantity: item.quantity + 1 } : item)
        };
      } else {
        return {
          ...prev,
          items: [...prev.items, { 
            variantId: prod.id, 
            name: prod.variantName || 'Sản phẩm chưa rõ tên', 
            sku: prod.sku, 
            quantity: 1, 
            importPrice: prod.costPrice || 0 
          }]
        };
      }
    });
    setProductSearchKey(''); 
  };

  const handleUpdateItemData = (idx: number, field: string, value: number) => {
    setAddFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  };

  const handleRemoveItem = (idx: number) => {
    setAddFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSaveImportTicket = async () => {
    if (!addFormData.supplierId || addFormData.items.length === 0) {
      showToast('Vui lòng chọn Nhà cung cấp và thêm ít nhất 1 sản phẩm', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        supplierId: parseInt(addFormData.supplierId),
        storeId: currentStoreId, // Gửi kèm storeId đang chọn ở header
        paidAmount: calculatedAmounts.paidAmount,
        details: addFormData.items.map(item => ({
          productVariantId: item.variantId,
          quantity: item.quantity,          
          unitPrice: item.importPrice       
        }))
      };

      await importTicketAPI.create(payload);
      showToast('Lập phiếu nhập thành công', 'success');
      setOpenAddDialog(false);
      setAddFormData(initialForm);
      loadInitialData(); 
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lập phiếu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- COMPONENT RENDER ---
  return (
    <Box className="fade-in">
      {/* HEADER PAGE */}
      <Box sx={{ bgcolor: '#3498db', color: 'white', p: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Kho vận / Nhập hàng</Typography>
        
        {/* Nút Chọn Cửa Hàng Bằng API */}
        <Select
          size="small"
          value={currentStoreId}
          onChange={(e) => setCurrentStoreId(e.target.value)}
          displayEmpty
          sx={{ 
            bgcolor: 'white', 
            color: '#333', 
            fontWeight: 600, 
            borderRadius: '16px', // Bo tròn giống cái Chip
            height: '32px',
            fontSize: '0.85rem',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, // Xóa viền
            '& .MuiSelect-select': { py: 0.5, px: 2 },
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {stores.length === 0 && <MenuItem value="">Đang tải...</MenuItem>}
          {stores.map(store => (
            <MenuItem key={store.id} value={store.id} sx={{ fontSize: '0.85rem' }}>
              {store.name}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ px: 3, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH PHIẾU NHẬP HÀNG
        </Typography>
      </Box>

      <Box sx={{ px: 3 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            
            {/* TOOLBAR */}
            <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
              <TextField 
                size="small" placeholder="Tìm: Mã phiếu / Tên NCC..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 280, bgcolor: 'white', '& .MuiInputBase-root': { borderRadius: '20px'} }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }}
              />
              
              <Button size="small" variant="contained" startIcon={<AddIcon />} 
                onClick={() => setOpenAddDialog(true)}
                sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
                Lập Phiếu Nhập
              </Button>
              
              <Button size="small" variant="contained" startIcon={<DebtIcon />} 
                onClick={handleOpenPayment}
                sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
                Thanh Toán Nợ
              </Button>

              <Button size="small" variant="outlined" startIcon={<PrintIcon />} 
                onClick={handlePrint}
                sx={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none', borderRadius: 1 }}>
                In DS {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </Button>

              <Button size="small" variant="contained" startIcon={<ExcelIcon />} 
                onClick={handleExportExcel}
                sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>
                Xuất Excel
              </Button>
            </Box>

            {/* BẢNG DỮ LIỆU */}
            <TableContainer sx={{ minHeight: 400 }}>
              <Table sx={{ minWidth: 1200 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox 
                        size="small" 
                        checked={filteredImports.length > 0 && selectedIds.length === filteredImports.length}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < filteredImports.length}
                        onChange={handleSelectAll} 
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                    <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                    {['Mã Phiếu', 'Ngày Nhập', 'Nhà Cung Cấp', 'Tổng Tiền', 'Đã Thanh Toán', 'Công Nợ', 'Người Lập', 'Trạng Thái'].map((col) => (
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
                    <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                  ) : filteredImports.length === 0 ? (
                     <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>Không có dữ liệu phiếu nhập</TableCell></TableRow>
                  ) : (
                    filteredImports.map((row, idx) => {
                      const isCancelled = row.status?.toUpperCase() === 'CANCELLED';
                      const isSelected = selectedIds.includes(row.id);

                      return (
                        <TableRow key={row.id} hover selected={isSelected} sx={{ bgcolor: isCancelled ? '#fef2f2' : 'inherit', '&:last-child td': { border: 0 } }}>
                          <TableCell padding="checkbox">
                            <Checkbox size="small" checked={isSelected} onChange={() => handleSelectRow(row.id)} />
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{idx + 1}</TableCell>
                          
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              <Box onClick={() => handleViewDetail(row.id)} sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Xem chi tiết">
                                <ViewIcon sx={{ fontSize: 14 }} />
                              </Box>
                              {!isCancelled && (
                                <Box onClick={() => handleCancelTicket(row.id, row.code)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Hủy phiếu">
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, fontWeight: 600, color: '#0284c7' }}>
                            <span style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{row.code || `PN${row.id}`}</span>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#475569' }}>
                            {row.importDate ? new Date(row.importDate).toLocaleDateString('vi-VN') : '-'}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#0f172a', fontWeight: 600 }}>{row.supplierName || 'NCC Vãng lai'}</TableCell>
                          
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, fontWeight: 700 }}>{formatCurrency(row.totalAmount || 0)}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#16a34a', fontWeight: 600 }}>{formatCurrency(row.paidAmount || 0)}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: (row.debtAmount || 0) > 0 ? '#dc2626' : '#475569', fontWeight: (row.debtAmount || 0) > 0 ? 700 : 500 }}>
                            {formatCurrency(row.debtAmount || 0)}
                          </TableCell>
                          
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#475569' }}>{row.createdByName || '-'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>{renderStatusChip(row.status)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Pagination count={1} size="small" shape="rounded" color="primary" />
               <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {loading ? 'Đang tải...' : `Hiển thị ${filteredImports.length} kết quả`}
               </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* DIALOG LẬP PHIẾU NHẬP MỚI */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00a65a', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          TẠO PHIẾU NHẬP KHO MỚI
          <IconButton size="small" onClick={() => setOpenAddDialog(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: '#f1f5f9' }}>
          <Grid container spacing={2}>
            {/* THÔNG TIN CHUNG */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl fullWidth size="small">
                        <InputLabel>Nhà cung cấp *</InputLabel>
                        <Select label="Nhà cung cấp *" value={addFormData.supplierId} onChange={(e) => setAddFormData({ ...addFormData, supplierId: e.target.value })}>
                          {suppliers.map(s => (
                            <MenuItem key={s.id} value={s.id.toString()}>{s.name} - ({s.phone})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton sx={{ color: '#f39c12' }} title="Thêm nhanh NCC"><PersonAddIcon /></IconButton>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="date" label="Ngày nhập *" value={addFormData.importDate} onChange={(e) => setAddFormData({ ...addFormData, importDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* CHỌN SẢN PHẨM & Ô TÌM KIẾM */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <BusinessIcon color="primary" />
                  <Typography variant="body1" fontWeight={600}>Chi tiết sản phẩm nhập</Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                
                {/* Ô tìm kiếm sản phẩm */}
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <TextField fullWidth size="small" placeholder="🔍 Gõ tên hoặc mã SKU sản phẩm để thêm..." value={productSearchKey} onChange={(e) => setProductSearchKey(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                  
                  {/* Kết quả tìm kiếm (Dropdown) */}
                  {filteredProducts.length > 0 && (
                    <Card variant="outlined" sx={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 9999, maxHeight: 250, overflow: 'auto', bgcolor: 'white', mt: 0.5 }}>
                      <List size="small" disablePadding>
                        {filteredProducts.map(p => (
                          <ListItem key={p.id} disablePadding sx={{ borderBottom: '1px solid #f1f5f9' }}>
                            <ListItemButton onMouseDown={(e) => {
                              e.preventDefault(); 
                              handleAddProductToTicket(p);
                            }}>
                              <ListItemText 
                                primary={<Typography fontWeight={600} fontSize="0.9rem">{p.variantName}</Typography>} 
                                secondary={`SKU: ${p.sku || 'Chưa có'} | Giá tham khảo: ${formatCurrency(p.costPrice || p.basePrice || 0)}`} 
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  )}
                </Box>

                {/* Bảng danh sách sản phẩm đã chọn */}
                <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 600 } }}>
                        <TableCell>Tên Sản Phẩm (SKU)</TableCell>
                        <TableCell align="center" width={150}>Số lượng</TableCell>
                        <TableCell align="right" width={180}>Đơn giá nhập (đ)</TableCell>
                        <TableCell align="right" width={180}>Thành tiền (đ)</TableCell>
                        <TableCell width={50} align="center"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {addFormData.items.length === 0 ? (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><SearchIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} /><Typography color="text.secondary">Chưa chọn sản phẩm nào. Dùng ô tìm kiếm phía trên để thêm.</Typography></TableCell></TableRow>
                      ) : (
                        addFormData.items.map((item, i) => (
                          <TableRow key={i} hover sx={{ '& .MuiInputBase-input': { p: 1, fontSize: '0.85rem' } }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.sku}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                <IconButton size="small" onClick={() => handleUpdateItemData(i, 'quantity', Math.max(1, item.quantity - 1))} sx={{ color: '#dd4b39' }}><RemoveIcon fontSize="small" /></IconButton>
                                <TextField type="number" size="small" value={item.quantity} onChange={(e) => handleUpdateItemData(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} sx={{ width: 60 }} />
                                <IconButton size="small" onClick={() => handleUpdateItemData(i, 'quantity', item.quantity + 1)} sx={{ color: '#00a65a' }}><AddIcon fontSize="small" /></IconButton>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <TextField type="number" size="small" value={item.importPrice} onChange={(e) => handleUpdateItemData(i, 'importPrice', Math.max(0, parseInt(e.target.value) || 0))} sx={{ width: 150 }} InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700}>{formatCurrency(item.quantity * item.importPrice)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleRemoveItem(i)}><CloseIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* TỔNG TIỀN & THANH TOÁN */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <TextField fullWidth size="small" label="Ghi chú phiếu nhập" multiline rows={3} placeholder="Gõ ghi chú nếu có..." />
                  </Card>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#ffffff' }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight={500}>Tổng tiền hàng:</Typography>
                        <Typography variant="h6" fontWeight={700} color="#0284c7">{formatCurrency(calculatedAmounts.totalAmount)}</Typography>
                      </Box>
                      <Divider dashed />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography fontWeight={500} color="#16a34a">Tiền đã thanh toán (đ):</Typography>
                        <TextField type="number" size="small" value={addFormData.paidAmount} onChange={(e) => setAddFormData({ ...addFormData, paidAmount: Math.max(0, parseInt(e.target.value) || 0) })} sx={{ width: 180, '& input': { textAlign: 'right', fontWeight: 700, color: '#16a34a', p: 1 } }} />
                      </Box>
                      <Divider dashed />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight={500} color="#dc2626">Cần trả thêm (Ghi nợ):</Typography>
                        <Typography variant="h6" fontWeight={700} color="#dc2626">{formatCurrency(calculatedAmounts.debtAmount)}</Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f1f5f9', borderTop: '1px solid #ddd' }}>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit" variant="outlined">Hủy bỏ</Button>
          <Button variant="contained" startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleIcon />} 
            onClick={handleSaveImportTicket} disabled={submitting} 
            sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, boxShadow: 'none', minWidth: 150 }}>
            {submitting ? 'Đang lưu...' : 'Lập Phiếu & Nhập Kho'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG XEM CHI TIẾT */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}> Chi Tiết Phiếu Nhập: <span style={{ color: '#0284c7' }}>{selectedTicket?.code || `PN${selectedTicket?.id}`}</span></Typography>
          <IconButton size="small" onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
           {detailLoading ? (
               <Box textAlign="center" py={5}><CircularProgress /></Box>
           ) : selectedTicket ? (
               <Grid container spacing={2}>
                   <Grid item xs={6}><Typography variant="body2"><b>Nhà cung cấp:</b> {selectedTicket.supplierName}</Typography></Grid>
                   <Grid item xs={6}><Typography variant="body2"><b>Ngày nhập:</b> {new Date(selectedTicket.importDate).toLocaleDateString('vi-VN')}</Typography></Grid>
                   <Grid item xs={12}>
                       <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                           <Table size="small">
                               <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                   <TableRow>
                                       <TableCell>Sản phẩm</TableCell>
                                       <TableCell align="center">SL</TableCell>
                                       <TableCell align="right">Đơn giá</TableCell>
                                       <TableCell align="right">Thành tiền</TableCell>
                                   </TableRow>
                               </TableHead>
                               <TableBody>
                                   {selectedTicket.details?.map((d: any, idx: number) => (
                                       <TableRow key={idx}>
                                           <TableCell>{d.variantName} <br/><Typography variant="caption">{d.sku}</Typography></TableCell>
                                           <TableCell align="center">{d.quantity}</TableCell>
                                           <TableCell align="right">{formatCurrency(d.unitPrice)}</TableCell>
                                           <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(d.quantity * d.unitPrice)}</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                       </TableContainer>
                   </Grid>
                   <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mt: 2 }}>
                          <Typography variant="body2">Tổng tiền: <b>{formatCurrency(selectedTicket.totalAmount)}</b></Typography>
                          <Typography variant="body2" color="success.main">Đã trả: <b>{formatCurrency(selectedTicket.paidAmount)}</b></Typography>
                          <Typography variant="body2" color="error.main">Nợ: <b>{formatCurrency(selectedTicket.debtAmount)}</b></Typography>
                      </Box>
                   </Grid>
               </Grid>
           ) : (
               <Typography align="center" color="text.secondary">Không tải được thông tin phiếu.</Typography>
           )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}><Button onClick={() => setOpenDetail(false)} color="inherit">Đóng</Button></DialogActions>
      </Dialog>

      {/* DIALOG THANH TOÁN CÔNG NỢ */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f39c12', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          THANH TOÁN CÔNG NỢ NHÀ CUNG CẤP
          <IconButton size="small" onClick={() => setOpenPaymentDialog(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Chức năng đang trong giai đoạn phát triển. Vui lòng chuyển sang module <b>Tài Chính - Thu/Chi</b> để thực hiện thanh toán chi tiết cho phiếu nhập.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenPaymentDialog(false)} variant="contained" color="primary">Đã hiểu</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};