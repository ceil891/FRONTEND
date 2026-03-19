import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Autocomplete, 
  Paper, InputAdornment, Tooltip, Select, MenuItem, Pagination, Checkbox
} from '@mui/material';
import {
  Add as AddIcon, CheckCircle as BalanceIcon, Delete as DeleteIcon,
  Visibility as ViewIcon, Save as SaveIcon, Search as SearchIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, Close as CloseIcon
} from '@mui/icons-material';
import { inventoryCheckAPI, productAPI, storeAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const InventoryCheckPage: React.FC = () => {
  // --- STATES ---
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);

  // Data hỗ trợ
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<number | string>('');
  
  const showToast = useToastStore((state) => state.showToast) || ((msg: string, type: string) => console.log(type, msg));

  const [formRequest, setFormRequest] = useState({
    storeId: null as number | null,
    checkerId: 1, 
    details: [] as any[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [checkRes, prodRes, storeRes] = await Promise.all([
        inventoryCheckAPI.getAll(),
        productAPI.getAll(),
        storeAPI.getAll()
      ]);
      
      if (checkRes?.data?.success) setChecks(checkRes.data.data || []);
      
      // 🟢 CẢI THIỆN LẤY DANH SÁCH BIẾN THỂ SẢN PHẨM 🟢
      const rawProducts = prodRes?.data?.data || prodRes?.data || [];
      const allVariants: any[] = [];
      
      rawProducts.forEach((p: any) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            allVariants.push({
              id: v.id,
              productVariantId: v.id,
              variantName: `${p.name} - ${v.variantName}`,
              sku: v.sku || 'Chưa có SKU',
              quantity: v.quantity || 0,
            });
          });
        }
      });
      setProducts(allVariants);
      // ------------------------------------------------

      const fetchedStores = storeRes?.data?.data || storeRes?.data || [];
      setStores(fetchedStores);
      if (fetchedStores.length > 0 && !currentStoreId) {
        setCurrentStoreId(fetchedStores[0].id);
      }
    } catch (error) { 
      showToast('Lỗi tải dữ liệu kiểm kho', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBalanceAction = async () => {
    if (selectedIds.length === 0) {
      return showToast("Vui lòng tích chọn 1 phiếu ở bảng bên dưới trước khi Cân Bằng!", "warning");
    }
    
    const targetId = selectedIds[0];
    const ticket = checks.find(c => c.id === targetId);
    
    if (ticket?.status === 'Đã cân bằng') {
      return showToast("Phiếu này đã được cân bằng trước đó!", "warning");
    }

    if (window.confirm(`Xác nhận cân bằng kho cho phiếu ${ticket?.code}? Thao tác này sẽ cập nhật số lượng tồn kho thực tế.`)) {
      try {
        const res = await inventoryCheckAPI.balance(targetId);
        if (res?.data?.success) {
          showToast("Cân bằng kho thành công!", "success");
          setSelectedIds([]);
          fetchData();
        }
      } catch (error: any) { 
        showToast(error?.message || "Lỗi khi cân bằng kho", "error"); 
      }
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) return showToast("Vui lòng tích chọn phiếu cần in ở bảng bên dưới!", "warning");
    showToast(`Đang chuẩn bị bản in cho ${selectedIds.length} phiếu...`, "info");
    setTimeout(() => { window.print(); }, 500);
  };

  const handleExportExcel = () => {
    showToast("Đang xuất dữ liệu kiểm kho ra file Excel...", "info");
  };

  const handleDeleteCheck = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu kiểm kho này?")) {
      try {
        const res = await inventoryCheckAPI.delete(id);
        if (res?.data?.success) {
          showToast("Đã xóa phiếu thành công!", "success");
          fetchData();
        }
      } catch (error: any) { 
        showToast(error?.message || "Lỗi khi xóa phiếu", "error"); 
      }
    }
  };

  const handleAddProduct = (product: any) => {
    if (!product || formRequest.details.some(d => d.productVariantId === product.id)) return;
    setFormRequest({
      ...formRequest,
      details: [...formRequest.details, {
        productVariantId: product.id,
        variantName: product.variantName,
        sku: product.sku,
        systemQuantity: product.quantity,
        actualQuantity: product.quantity
      }]
    });
  };

  const handleSaveCheck = async () => {
    if (!formRequest.storeId) return showToast("Vui lòng chọn kho kiểm!", "warning");
    if (formRequest.details.length === 0) return showToast("Vui lòng thêm ít nhất 1 sản phẩm!", "warning");
    
    try {
      const res = await inventoryCheckAPI.create(formRequest);
      if (res?.data?.success) {
        showToast("Lập phiếu kiểm thành công!", "success");
        setOpenCreate(false);
        setFormRequest({ storeId: null, checkerId: 1, details: [] });
        fetchData();
      }
    } catch (error: any) { 
      showToast(error?.message || "Lỗi khi lưu phiếu", "error"); 
    }
  };

  const formatCurrency = (val: number) => {
    if (!val) return "0 đ";
    return new Intl.NumberFormat('vi-VN').format(val) + " đ";
  };

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh', pb: 5 }}>
      <Box sx={{ bgcolor: '#3498db', color: 'white', p: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Kho vận / Kiểm kho</Typography>
        <Select
          size="small" value={currentStoreId} onChange={(e) => setCurrentStoreId(e.target.value)} displayEmpty
          sx={{ 
            bgcolor: 'white', color: '#333', fontWeight: 600, borderRadius: '16px', height: '32px', fontSize: '0.85rem',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiSelect-select': { py: 0.5, px: 2 }, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {stores.length === 0 && <MenuItem value="">Đang tải...</MenuItem>}
          {stores.map(store => <MenuItem key={store.id} value={store.id} sx={{ fontSize: '0.85rem' }}>{store.name}</MenuItem>)}
        </Select>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>PHIẾU KIỂM KHO</Typography>

        <Card sx={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 2, display: 'flex', gap: 1.5, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm mã phiếu/Người kiểm..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, '& .MuiInputBase-root': { borderRadius: '20px', bgcolor: '#ffffff' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }}
            />
            <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', textTransform: 'none', boxShadow: 'none', borderRadius: '20px', px: 2 }} onClick={() => setOpenCreate(true)}>Lập Phiếu Kiểm</Button>
            <Button variant="contained" startIcon={<BalanceIcon />} sx={{ bgcolor: '#f39c12', textTransform: 'none', boxShadow: 'none', borderRadius: '20px', px: 2 }} onClick={handleBalanceAction}>Cân Bằng Kho</Button>
            <Button variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', textTransform: 'none', boxShadow: 'none', borderRadius: '20px', px: 2 }} onClick={handlePrint}>In Phiếu</Button>
            <Button variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', textTransform: 'none', boxShadow: 'none', borderRadius: '20px', px: 2 }} onClick={handleExportExcel}>Xuất Excel</Button>
          </Box>

          <Box sx={{ px: 2, py: 1.5, bgcolor: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>Chọn 1 phiếu chưa cân bằng bên dưới để thao tác Cân Bằng Kho</Typography>
          </Box>

          <TableContainer>
            {loading ? <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box> : (
              <Table size="small">
                <TableHead sx={{ bgcolor: '#ffffff' }}>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ borderBottom: '2px solid #f1f5f9' }}>
                      <Checkbox size="small" onChange={(e) => e.target.checked ? setSelectedIds(checks.map(c => c.id)) : setSelectedIds([])}/>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>No.</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Thao Tác</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Mã Phiếu</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Ngày Kiểm</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Cửa Hàng / Kho</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Tổng SL Lệch</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Tổng Giá Trị Lệch</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Người Kiểm</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #f1f5f9' }}>Trạng Thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {checks.filter(c => 
                    (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (c.checkerName || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((row, index) => (
                    <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                      <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                        <Checkbox size="small" checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                         <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Box onClick={() => { setSelectedCheck(row); setOpenDetail(true); }} sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Xem chi tiết">
                              <ViewIcon sx={{ fontSize: 14 }} />
                            </Box>
                            {row.status !== 'Đã cân bằng' && (
                                <Box onClick={() => handleDeleteCheck(row.id)} sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Xóa phiếu">
                                  <DeleteIcon sx={{ fontSize: 14 }} />
                                </Box>
                            )}
                         </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0284c7', borderBottom: '1px solid #f1f5f9', py: 1.5 }}>{row.code}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{row.checkDate ? new Date(row.checkDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{row.storeName || '-'}</TableCell>
                      <TableCell sx={{ color: (row.totalDiscrepancyQty || 0) < 0 ? '#dc2626' : '#16a34a', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>
                        {(row.totalDiscrepancyQty || 0) > 0 ? `+${row.totalDiscrepancyQty}` : (row.totalDiscrepancyQty || 0)}
                      </TableCell>
                      <TableCell sx={{ color: (row.totalDiscrepancyValue || 0) < 0 ? '#dc2626' : '#16a34a', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>
                        {(row.totalDiscrepancyValue || 0) > 0 ? `+${formatCurrency(row.totalDiscrepancyValue)}` : formatCurrency(row.totalDiscrepancyValue || 0)}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{row.checkerName || '-'}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                        <Chip label={row.status || 'Đang xử lý'} size="small" sx={{ 
                          bgcolor: row.status === 'Đã cân bằng' ? '#dcfce7' : '#fef9c3',
                          color: row.status === 'Đã cân bằng' ? '#166534' : '#854d0e',
                          fontWeight: 600, borderRadius: 1, border: 'none'
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {checks.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{py:5, color: '#999'}}>Không có phiếu kiểm kho nào</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          
          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pagination count={1} size="small" shape="rounded" color="primary" />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                 {loading ? 'Đang tải...' : `Hiển thị ${checks.length} kết quả`}
              </Typography>
          </Box>
        </Card>
      </Box>

      {/* --- MODAL CHI TIẾT --- */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <Typography variant="h6" fontWeight={700}>Thông tin phiếu kiểm: <span style={{color: '#0284c7'}}>{selectedCheck?.code}</span></Typography>
          <IconButton size="small" onClick={() => setOpenDetail(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography variant="body2"><b>Kho kiểm:</b> {selectedCheck?.storeName}</Typography></Grid>
            <Grid item xs={6}><Typography variant="body2"><b>Người kiểm:</b> {selectedCheck?.checkerName}</Typography></Grid>
          </Grid>
          <TableContainer component={Paper} variant="outlined" sx={{ border: '1px solid #eee', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Sản phẩm</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tồn máy</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Thực tế</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Lệch</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Giá trị lệch</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedCheck?.details?.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.variantName} <br/> <Typography variant="caption" color="textSecondary">{d.sku}</Typography></TableCell>
                    <TableCell align="right">{d.systemQuantity || 0}</TableCell>
                    <TableCell align="right">{d.actualQuantity || 0}</TableCell>
                    <TableCell align="right" sx={{ color: (d.discrepancy || 0) < 0 ? 'red' : 'green', fontWeight: 600 }}>{d.discrepancy || 0}</TableCell>
                    <TableCell align="right" sx={{ color: (d.discrepancyValue || 0) < 0 ? 'red' : 'green', fontWeight: 600 }}>{formatCurrency(d.discrepancyValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
          {selectedCheck?.status !== 'Đã cân bằng' && (
            <Button variant="contained" color="warning" startIcon={<BalanceIcon />} onClick={() => { setOpenDetail(false); setSelectedIds([selectedCheck.id]); handleBalanceAction(); }} sx={{ boxShadow: 'none' }}>Cân bằng kho ngay</Button>
          )}
          <Button onClick={() => setOpenDetail(false)} color="inherit">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL TẠO MỚI --- */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#3498db', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>LẬP PHIẾU KIỂM KHO MỚI</Typography>
          <IconButton size="small" sx={{color: 'white'}} onClick={() => setOpenCreate(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>Gợi ý: Chọn kho trước khi tìm sản phẩm để đảm bảo số liệu tồn kho chính xác.</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Autocomplete 
                      options={stores} getOptionLabel={(opt) => opt.name || ''} 
                      onChange={(_, val) => setFormRequest({...formRequest, storeId: val?.id || null})} 
                      renderInput={(params) => <TextField {...params} label="Kho kiểm *" size="small" sx={{ bgcolor: 'white' }}/>}
                    />
                </Grid>
                <Grid item xs={6}>
                    {/* 🟢 CẢI THIỆN Ô TÌM KIẾM SẢN PHẨM Ở ĐÂY 🟢 */}
                    <Autocomplete 
                      options={products} 
                      getOptionLabel={(opt) => `[${opt.sku}] ${opt.variantName}`} 
                      filterOptions={(options, state) => {
                        const keyword = state.inputValue.toLowerCase();
                        return options.filter(opt => 
                          (opt.sku || '').toLowerCase().includes(keyword) || 
                          (opt.variantName || '').toLowerCase().includes(keyword)
                        );
                      }}
                      onChange={(_, val) => handleAddProduct(val)} 
                      clearOnBlur={false} 
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Nhập Tên hoặc mã SKU sản phẩm..." 
                          size="small" 
                          sx={{ bgcolor: 'white' }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{option.variantName}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              SKU: {option.sku} | Tồn máy: {option.quantity}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                </Grid>
            </Grid>
            
            <TableContainer component={Paper} variant="outlined" sx={{ border: '1px solid #eee', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Sản phẩm</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Tồn máy</TableCell>
                    <TableCell align="center" width={120} sx={{ fontWeight: 600 }}>Thực tế</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Lệch</TableCell>
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formRequest.details.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: '#999' }}>Vui lòng tìm và chọn sản phẩm ở ô bên trên</TableCell></TableRow>
                  ) : (
                    formRequest.details.map((item) => (
                      <TableRow key={item.productVariantId} sx={{ bgcolor: 'white' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.variantName}</Typography>
                          <Typography variant="caption" color="textSecondary">{item.sku}</Typography>
                        </TableCell>
                        <TableCell align="right">{item.systemQuantity || 0}</TableCell>
                        <TableCell align="center">
                          <TextField 
                            type="number" size="small" value={item.actualQuantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setFormRequest({
                                ...formRequest,
                                details: formRequest.details.map(d => d.productVariantId === item.productVariantId ? {...d, actualQuantity: val} : d)
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: (item.actualQuantity - (item.systemQuantity || 0)) < 0 ? 'red' : 'green', fontWeight: 600 }}>
                          {item.actualQuantity - (item.systemQuantity || 0)}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => setFormRequest({...formRequest, details: formRequest.details.filter(d => d.productVariantId !== item.productVariantId)})}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #ddd' }}>
            <Button onClick={() => setOpenCreate(false)} color="inherit" variant="outlined" sx={{ textTransform: 'none' }}>Hủy bỏ</Button>
            <Button variant="contained" sx={{ bgcolor: '#00a65a', textTransform: 'none', boxShadow: 'none' }} onClick={handleSaveCheck} startIcon={<SaveIcon />}>Lưu phiếu kiểm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};