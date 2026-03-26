import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Autocomplete, 
  Paper, Checkbox, InputAdornment
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, 
  Save as SaveIcon, Close as CloseIcon, Search as SearchIcon,
  LocalShipping as ShippingIcon, CheckCircle as ConfirmIcon,
  Print as PrintIcon, FileDownload as ExcelIcon
} from '@mui/icons-material';
import { transferTicketAPI, productAPI, storeAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore'; 

export const TransferInventoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  // --- STATES DỮ LIỆU ---
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Form State
  const [formRequest, setFormRequest] = useState({
    fromStoreId: null as number | null,
    toStoreId: null as number | null,
    details: [] as any[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketRes, prodRes, storeRes] = await Promise.all([
        transferTicketAPI.getAll(),
        productAPI.getAll(),
        storeAPI.getAll()
      ]);
      
      if (ticketRes?.data?.success) setTickets(ticketRes.data.data || []);
      if (storeRes?.data?.success) setStores(storeRes.data.data || []);
      
      // 🟢 FIX LỖI TÌM SẢN PHẨM VÀ DỌN DẸP TÊN SẢN PHẨM CHO ĐẸP 🟢
      const rawProducts = prodRes?.data?.data || prodRes?.data || [];
      const allVariants: any[] = [];
      
      rawProducts.forEach((p: any) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            // Lọc bỏ các thuộc tính rỗng để không bị dư dấu gạch ngang
            const attributes = v.variantName || [v.colorName, v.sizeName].filter(Boolean).join(' - ');
            const finalName = [p.name, attributes].filter(Boolean).join(' - ');

            allVariants.push({
              id: v.id,
              variantName: finalName,
              sku: v.sku || p.sku || 'Chưa có SKU',
            });
          });
        } else {
          allVariants.push({
            id: p.id,
            variantName: p.name || 'Sản phẩm không tên',
            sku: p.sku || 'Chưa có SKU',
          });
        }
      });
      setProducts(allVariants); 

    } catch (error) {
      showToast('Lỗi tải dữ liệu chuyển kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC XỬ LÝ NÚT CHUYỂN KHO ---
  const handleProcess = async () => {
    if (selectedIds.length === 0) return showToast("Vui lòng tích chọn phiếu trước!", "warning");
    const id = selectedIds[0];
    if (window.confirm("Xác nhận xuất hàng khỏi kho nguồn?")) {
      try {
        const res = await transferTicketAPI.process(id);
        if (res.data.success) {
          showToast("Đã xuất hàng thành công!", "success");
          fetchData();
          setSelectedIds([]);
        }
      } catch (error: any) { showToast(error.message || 'Lỗi xử lý', "error"); }
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return showToast("Vui lòng tích chọn phiếu trước!", "warning");
    const id = selectedIds[0];
    if (window.confirm("Xác nhận đã nhận đủ hàng về kho nhập?")) {
      try {
        const res = await transferTicketAPI.confirm(id);
        if (res.data.success) {
          showToast("Nhận hàng thành công!", "success");
          fetchData();
          setSelectedIds([]);
        }
      } catch (error: any) { showToast(error.message || 'Lỗi xử lý', "error"); }
    }
  };

  const handleSaveTransfer = async () => {
    if (!formRequest.fromStoreId || !formRequest.toStoreId) return showToast("Vui lòng chọn đủ kho!", "warning");
    if (formRequest.fromStoreId === formRequest.toStoreId) return showToast("Kho nguồn và đích không được trùng nhau!", "error");
    if (formRequest.details.length === 0) return showToast("Chưa có sản phẩm nào!", "warning");

    try {
      const payload = {
        ...formRequest,
        createdById: user?.id || 1 
      };
      const res = await transferTicketAPI.create(payload);
      if (res.data.success) {
        showToast("Lập phiếu chuyển kho thành công!", "success");
        setOpenCreate(false);
        setFormRequest({ fromStoreId: null, toStoreId: null, details: [] });
        fetchData();
      }
    } catch (error: any) { showToast(error.message || 'Lỗi tạo phiếu', "error"); }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f7fe', minHeight: '100vh' }} className="fade-in">
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, textTransform: 'uppercase', color: '#333' }}>Điều Chuyển Kho Nội Bộ</Typography>

      {/* TOOLBAR */}
      <Card sx={{ borderRadius: '15px', mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField 
            size="small" placeholder="Tìm mã phiếu/tên kho..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action"/></InputAdornment> }}
            sx={{ width: 280, '& .MuiInputBase-root': { borderRadius: '20px', bgcolor: 'white' } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', borderRadius: '20px', textTransform: 'none' }} onClick={() => setOpenCreate(true)}>Lập Phiếu</Button>
          <Button variant="contained" startIcon={<ShippingIcon />} sx={{ bgcolor: '#f39c12', borderRadius: '20px', textTransform: 'none' }} onClick={handleProcess}>Xuất Hàng Đi</Button>
          <Button variant="contained" startIcon={<ConfirmIcon />} sx={{ bgcolor: '#48c9b0', borderRadius: '20px', textTransform: 'none' }} onClick={handleConfirm}>Nhận Hàng</Button>
          <Button variant="outlined" startIcon={<PrintIcon />} sx={{ borderRadius: '20px', textTransform: 'none', color: '#475569', borderColor: '#cbd5e1' }} onClick={() => window.print()}>In Phiếu</Button>
          <Button variant="outlined" startIcon={<ExcelIcon />} sx={{ borderRadius: '20px', textTransform: 'none', color: '#2980b9', borderColor: '#2980b9' }}>Xuất Excel</Button>
        </Box>
      </Card>

      {/* BẢNG DỮ LIỆU */}
      <TableContainer component={Paper} sx={{ borderRadius: '15px', border: '1px solid #eee', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox size="small" onChange={(e) => e.target.checked ? setSelectedIds(tickets.map(t => t.id)) : setSelectedIds([])}/>
              </TableCell>
              <TableCell sx={{fontWeight: 700}}>Mã Phiếu</TableCell>
              <TableCell sx={{fontWeight: 700}}>Từ Kho (Xuất)</TableCell>
              <TableCell sx={{fontWeight: 700}}>Đến Kho (Nhận)</TableCell>
              
              {/* CỘT SẢN PHẨM MỚI */}
              <TableCell sx={{fontWeight: 700}}>Sản Phẩm (SL)</TableCell>
              
              <TableCell align="center" sx={{fontWeight: 700}}>Tổng SL</TableCell>
              <TableCell sx={{fontWeight: 700}}>Người Lập</TableCell>
              <TableCell sx={{fontWeight: 700}}>Trạng Thái</TableCell>
              <TableCell align="center" sx={{fontWeight: 700}}>Xem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
            ) : tickets.length === 0 ? (
               <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: '#999' }}>Chưa có phiếu chuyển kho nào</TableCell></TableRow>
            ) : tickets.filter(t => (t.code || '').toLowerCase().includes(searchQuery.toLowerCase())).map((row) => (
              <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{row.code}</TableCell>
                <TableCell sx={{ color: '#dc2626', fontWeight: 600 }}>{row.fromStoreName}</TableCell>
                <TableCell sx={{ color: '#16a34a', fontWeight: 600 }}>{row.toStoreName}</TableCell>
                
                {/* ĐỔ DỮ LIỆU SẢN PHẨM VÀO ĐÂY */}
                <TableCell>
                  {row.details && row.details.length > 0 ? (
                    row.details.map((d: any, i: number) => (
                      <Typography key={i} variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                        • {d.variantName || d.productName}: <strong style={{ color: '#0284c7' }}>x{d.quantity || d.transferQuantity}</strong>
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">Bấm xem chi tiết &rarr;</Typography>
                  )}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 700 }}>{row.totalQuantity}</TableCell>
                <TableCell>{row.createdByName || row.creatorName || row.employeeName || user?.fullName || 'System Admin'}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.status === 'COMPLETED' ? 'Đã Nhận' : row.status === 'PROCESSING' ? 'Đang Chuyển' : 'Mới Tạo'} 
                    size="small" 
                    sx={{ 
                      bgcolor: row.status === 'COMPLETED' ? '#dcfce7' : row.status === 'PROCESSING' ? '#fef08a' : '#f1f5f9',
                      color: row.status === 'COMPLETED' ? '#166534' : row.status === 'PROCESSING' ? '#a16207' : '#475569',
                      fontWeight: 600, border: 'none', borderRadius: 1 
                    }} 
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => { setSelectedTicket(row); setOpenDetail(true); }} color="info"><ViewIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- MODAL LẬP PHIẾU CHUYỂN KHO --- */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#3498db', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          LẬP PHIẾU CHUYỂN KHO NỘI BỘ
          <IconButton size="small" onClick={() => setOpenCreate(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f1f5f9' }}>
          <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
            <Grid item xs={6}>
              <Autocomplete 
                options={stores} getOptionLabel={(o) => o.name} 
                onChange={(_, v) => setFormRequest({...formRequest, fromStoreId: v?.id || null})} 
                renderInput={(p) => <TextField {...p} label="Kho gửi hàng (Nguồn) *" size="small" sx={{ bgcolor: 'white' }} />}
              />
            </Grid>
            <Grid item xs={6}>
              <Autocomplete 
                options={stores} getOptionLabel={(o) => o.name} 
                onChange={(_, v) => setFormRequest({...formRequest, toStoreId: v?.id || null})} 
                renderInput={(p) => <TextField {...p} label="Kho nhận hàng (Đích) *" size="small" sx={{ bgcolor: 'white' }} />}
              />
            </Grid>
            
            {/* 🟢 TÌM KIẾM SẢN PHẨM BẰNG AUTOCOMPLETE */}
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.sku} - ${option.variantName}`}
                filterOptions={(options, state) => {
                  const keyword = state.inputValue.toLowerCase();
                  return options.filter(opt => 
                    (opt.variantName || '').toLowerCase().includes(keyword) || 
                    (opt.sku || '').toLowerCase().includes(keyword)
                  );
                }}
                onChange={(_, newValue) => {
                  if (!newValue) return;
                  setFormRequest(prev => {
                    const exists = prev.details.find(d => d.productVariantId === newValue.id);
                    if (exists) {
                      showToast(`Đã tăng số lượng: ${newValue.variantName}`, 'info');
                      return { ...prev, details: prev.details.map(d => d.productVariantId === newValue.id ? { ...d, quantity: d.quantity + 1 } : d) };
                    }
                    return { ...prev, details: [...prev.details, { productVariantId: newValue.id, variantName: newValue.variantName, sku: newValue.sku, quantity: 1 }] };
                  });
                }}
                value={null} // Auto reset input sau khi chọn
                blurOnSelect
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="🔍 Gõ tên hoặc mã SKU sản phẩm để thêm..." 
                    size="small" 
                    sx={{ bgcolor: 'white' }} 
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                     <Box>
                       <Typography fontWeight={700}>{option.variantName}</Typography>
                       <Typography variant="caption" color="textSecondary">SKU: {option.sku}</Typography>
                     </Box>
                  </li>
                )}
              />
            </Grid>
          </Grid>
          
          <Card variant="outlined" sx={{ p: 2, minHeight: 200 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>DANH SÁCH SẢN PHẨM SẼ CHUYỂN</Typography>
            {formRequest.details.length === 0 ? (
              <Typography align="center" color="text.secondary" sx={{ py: 3 }}>Chưa chọn sản phẩm nào</Typography>
            ) : (
              formRequest.details.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.variantName}</Typography>
                    <Typography variant="caption" color="text.secondary">SKU: {item.sku}</Typography>
                  </Box>
                  <TextField type="number" size="small" label="Số lượng"
                    value={item.quantity} 
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      const newD = [...formRequest.details]; newD[idx].quantity = val;
                      setFormRequest({...formRequest, details: newD});
                    }} 
                    sx={{ width: 100, bgcolor: 'white' }} 
                  />
                  <IconButton onClick={() => setFormRequest({...formRequest, details: formRequest.details.filter((_, i) => i !== idx)})} color="error"><CloseIcon fontSize="small" /></IconButton>
                </Box>
              ))
            )}
          </Card>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSaveTransfer} startIcon={<SaveIcon />} sx={{ bgcolor: '#00a65a', textTransform: 'none', fontWeight: 600 }}>Lưu Phiếu Chuyển</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL XEM CHI TIẾT PHIẾU CHUYỂN KHO --- */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#3498db', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          CHI TIẾT PHIẾU CHUYỂN KHO: {selectedTicket?.code}
          <IconButton size="small" onClick={() => setOpenDetail(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3, bgcolor: '#f8fafc' }}>
          {selectedTicket ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ mb: 1 }}><b>Từ Kho (Nguồn):</b> <span style={{ color: '#dc2626', fontWeight: 600 }}>{selectedTicket.fromStoreName}</span></Typography>
                <Typography variant="body2"><b>Đến Kho (Đích):</b> <span style={{ color: '#16a34a', fontWeight: 600 }}>{selectedTicket.toStoreName}</span></Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ mb: 1 }}><b>Người lập phiếu:</b> {selectedTicket.createdByName || selectedTicket.creatorName || selectedTicket.employeeName || 'System Admin'}</Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <b>Trạng thái:</b> 
                  <Chip 
                    label={selectedTicket.status === 'COMPLETED' ? 'Đã Nhận' : selectedTicket.status === 'PROCESSING' ? 'Đang Chuyển' : 'Mới Tạo'} 
                    size="small" 
                    sx={{ 
                      bgcolor: selectedTicket.status === 'COMPLETED' ? '#dcfce7' : selectedTicket.status === 'PROCESSING' ? '#fef08a' : '#f1f5f9',
                      color: selectedTicket.status === 'COMPLETED' ? '#166534' : selectedTicket.status === 'PROCESSING' ? '#a16207' : '#475569',
                      fontWeight: 600, borderRadius: 1 
                    }} 
                  />
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#333' }}>Tên Sản Phẩm / Phân Loại</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#333' }}>Số Lượng Chuyển</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTicket.details && selectedTicket.details.length > 0 ? (
                        selectedTicket.details.map((d: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">{d.variantName || d.productName || 'Sản phẩm'}</Typography>
                              <Typography variant="caption" color="text.secondary">SKU: {d.sku || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={d.quantity || d.transferQuantity || 0} size="small" sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1' }} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>Phiếu này không có chi tiết sản phẩm.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : (
            <Typography align="center" color="text.secondary">Không tải được thông tin phiếu.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#cbd5e1' }}>In Phiếu</Button>
          <Button onClick={() => setOpenDetail(false)} variant="contained" sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#94a3b8', '&:hover': { bgcolor: '#64748b' } }}>Đóng Lại</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};