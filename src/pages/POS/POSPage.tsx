import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid, Card, TextField, Button, Typography, Box, IconButton, InputAdornment,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Divider, Select, MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon, Search as SearchIcon,
  Storefront as StoreIcon, LocalOffer as PromoIcon
} from '@mui/icons-material';
import { PaymentMethod } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { storeAPI, productAPI, orderAPI, loyaltyAPI, promotionAPI } from '../../api/client';

export const POSPage: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]); // 🟢 Khôi phục danh sách KM
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null); // 🟢 Mã KM đang chọn
  
  const [customerCash, setCustomerCash] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [openCashDialog, setOpenCashDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  
  const { showToast } = useToastStore();
  const { user } = useAuthStore();

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, pRes, promoRes] = await Promise.all([
        storeAPI.getAll(), 
        productAPI.getAll(),
        promotionAPI.getAll() // 🟢 Load danh sách khuyến mãi
      ]);
      setStores(sRes.data?.data || []);
      setProducts((pRes.data || []).filter((p: any) => p.status === 'ACTIVE'));
      setPromotions((promoRes.data?.data || promoRes.data || []).filter((p:any) => p.isActive));
    } catch (e) { showToast('Lỗi tải dữ liệu', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // 🟢 HÀM TÌM KHÁCH HÀNG
  const handleFindCustomer = async () => {
    if (!customerPhone) return;
    try {
      const res = await loyaltyAPI.getMembers(customerPhone);
      const members = res.data?.data || [];
      if (members.length > 0) {
        setSelectedCustomer(members[0]);
        setPointsToUse(0);
        showToast('Đã nhận diện khách hàng', 'success');
      } else { showToast('Không tìm thấy khách!', 'warning'); }
    } catch (e) { showToast('Lỗi tra cứu', 'error'); }
  };

  // 🟢 LOGIC TÍNH TIỀN (QUAN TRỌNG)
  const { subtotal, promoDiscount, pointDiscount, total } = useMemo(() => {
    const st = cart.reduce((sum, i) => sum + i.total, 0);
    
    // 1. Tính giảm giá từ Promotion
    let pd = 0;
    if (appliedPromotion && st >= (appliedPromotion.minPurchase || 0)) {
      if (appliedPromotion.discountType === 'PERCENTAGE') {
        pd = (st * appliedPromotion.discountValue) / 100;
        if (appliedPromotion.maxDiscount > 0 && pd > appliedPromotion.maxDiscount) pd = appliedPromotion.maxDiscount;
      } else {
        pd = appliedPromotion.discountValue;
      }
    }

    // 2. Tính giảm giá từ Điểm (1 điểm = 100đ)
    const pnd = (pointsToUse || 0) * 100;

    return { 
      subtotal: st, 
      promoDiscount: pd, 
      pointDiscount: pnd, 
      total: Math.max(0, st - pd - pnd) 
    };
  }, [cart, appliedPromotion, pointsToUse]);

  const addProduct = (p: any) => {
    const variant = p.variants?.[0];
    if (!variant || variant.quantity <= 0) return showToast('Hết hàng!', 'error');
    const exist = cart.find(i => i.variantId === variant.id);
    if (exist) {
      setCart(cart.map(i => i.variantId === variant.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      setCart([...cart, { variantId: variant.id, productName: p.name, quantity: 1, unitPrice: variant.sellPrice || p.baseRetailPrice, total: variant.sellPrice || p.baseRetailPrice }]);
    }
  };

  const submitOrder = async () => {
    try {
      setLoading(true);
      const payload = {
        orderType: 'RETAIL', 
        storeId: selectedStore.id,
        customerId: selectedCustomer?.id || null,
        promotionId: appliedPromotion?.id || null,
        paymentMethod: paymentMethod === PaymentMethod.CASH ? 'CASH' : 'BANK_TRANSFER',
        amountPaid: paymentMethod === PaymentMethod.CASH ? Number(customerCash) : total,
        usedPoints: pointsToUse, // 🟢 Gửi điểm tiêu lên cho Backend xử lý
        discount: promoDiscount, // 🟢 Gửi tiền KM lên cho Backend xử lý
        items: cart.map(i => ({ productVariantId: i.variantId, quantity: i.quantity }))
      };
      await orderAPI.create(payload as any);
      showToast('Thanh toán thành công!', 'success');
      setCart([]); setAppliedPromotion(null); setSelectedCustomer(null); setPointsToUse(0);
      setOpenCashDialog(false); setOpenQRDialog(false); setCustomerCash('');
    } catch (e:any) { showToast(e.response?.data?.message || 'Lỗi thanh toán', 'error'); }
    finally { setLoading(false); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

  if (!selectedStore) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={4}>CHỌN CỬA HÀNG ĐỂ BÁN HÀNG</Typography>
      <Grid container spacing={2} justifyContent="center">
        {stores.map(s => (
          <Grid item xs={12} sm={4} key={s.id}><Card onClick={() => setSelectedStore(s)} sx={{ p: 3, cursor: 'pointer', '&:hover': { border: '1px solid #1976d2' } }}><StoreIcon color="primary" sx={{ fontSize: 40, mb: 1 }} /><Typography fontWeight={700}>{s.name}</Typography></Card></Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 1, height: 'calc(100vh - 70px)', bgcolor: '#f1f5f9' }}>
      <Grid container spacing={1} sx={{ height: '100%' }}>
        <Grid item xs={7} sx={{ height: '100%' }}>
          <Card sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
            <TextField fullWidth size="small" placeholder="Tìm sản phẩm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ mb: 2 }} />
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <Grid container spacing={1}>
                {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                  <Grid item xs={4} key={p.id}>
                    <Card onClick={() => addProduct(p)} sx={{ p: 1, cursor: 'pointer', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" fontWeight={700} noWrap>{p.name}</Typography>
                      <Typography variant="body2" color="error" fontWeight={800}>{formatCurrency(p.baseRetailPrice)}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={5} sx={{ height: '100%' }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5, bgcolor: '#1e293b', color: '#fff' }}><Typography variant="subtitle2" fontWeight={700}>GIỎ HÀNG - {selectedStore.name}</Typography></Box>
            
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              {cart.map(item => (
                <Box key={item.variantId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 1, borderBottom: '1px dashed #e2e8f0' }}>
                  <Typography variant="body2" fontWeight={700} sx={{ width: '50%' }}>{item.productName}</Typography>
                  <Typography variant="body2" fontWeight={800} color="error">{formatCurrency(item.total)}</Typography>
                  <IconButton size="small" color="error" onClick={() => setCart(cart.filter(i => i.variantId !== item.variantId))}><DeleteIcon fontSize="inherit" /></IconButton>
                </Box>
              ))}
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              {/* 🟢 KHÁCH HÀNG & TÍCH ĐIỂM */}
              {!selectedCustomer ? (
                <Stack direction="row" spacing={1} mb={1.5}>
                  <TextField size="small" fullWidth placeholder="SĐT Khách hàng..." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  <Button variant="outlined" onClick={handleFindCustomer}>Tìm</Button>
                </Stack>
              ) : (
                <Box sx={{ p: 1, bgcolor: '#f0f9ff', borderRadius: 2, mb: 1.5, border: '1px solid #bae6fd' }}>
                  <Typography variant="body2" fontWeight={700} color="primary">👤 {selectedCustomer.fullName}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Typography variant="caption">Điểm: {selectedCustomer.currentPoints}</Typography>
                    <TextField size="small" label="Dùng điểm" type="number" sx={{ width: 100, bgcolor: 'white' }} value={pointsToUse || ''} onChange={e => setPointsToUse(Math.min(selectedCustomer.currentPoints, Number(e.target.value)))} />
                  </Stack>
                </Box>
              )}

              {/* 🟢 KHUYẾN MÃI (PROMOTION) */}
              <Select fullWidth size="small" displayEmpty value={appliedPromotion?.id || ''} onChange={e => setAppliedPromotion(promotions.find(p => p.id === e.target.value))} sx={{ mb: 1.5, bgcolor: '#fff' }}>
                <MenuItem value="">-- Áp dụng mã giảm giá --</MenuItem>
                {promotions.map(p => (
                  <MenuItem key={p.id} value={p.id} disabled={subtotal < p.minPurchase}>
                    {p.code} - {p.name} (Đơn từ {formatCurrency(p.minPurchase)})
                  </MenuItem>
                ))}
              </Select>

              <Divider sx={{ my: 1 }} />

              <Stack spacing={0.5} mb={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Tạm tính:</Typography><Typography variant="body2">{formatCurrency(subtotal)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}><Typography variant="body2">Khuyến mãi:</Typography><Typography variant="body2">-{formatCurrency(promoDiscount)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'blue' }}><Typography variant="body2">Dùng điểm:</Typography><Typography variant="body2">-{formatCurrency(pointDiscount)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" fontWeight={900}>TỔNG CỘNG:</Typography><Typography variant="h6" fontWeight={900} color="error">{formatCurrency(total)}</Typography></Box>
              </Stack>

              <Stack direction="row" spacing={1} mb={1}>
                <Button fullWidth variant={paymentMethod === PaymentMethod.CASH ? 'contained' : 'outlined'} onClick={() => setPaymentMethod(PaymentMethod.CASH)}>Tiền mặt</Button>
                <Button fullWidth variant={paymentMethod === PaymentMethod.QR_CODE ? 'contained' : 'outlined'} onClick={() => setPaymentMethod(PaymentMethod.QR_CODE)}>QR</Button>
              </Stack>

              {paymentMethod === PaymentMethod.CASH && (
                <TextField fullWidth label="Tiền khách đưa" size="small" type="number" value={customerCash} onChange={e => setCustomerCash(Number(e.target.value))} sx={{ mb: 1.5, bgcolor: '#fff' }} />
              )}

              <Button fullWidth variant="contained" color="success" size="large" sx={{ fontWeight: 900 }} onClick={() => paymentMethod === PaymentMethod.CASH ? setOpenCashDialog(true) : setOpenQRDialog(true)}>THANH TOÁN</Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* DIALOG XÁC NHẬN (GIỮ NGUYÊN GIAO DIỆN ĐẸP) */}
      <Dialog open={openCashDialog} onClose={() => setOpenCashDialog(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Xác Nhận Thanh Toán</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Tổng hóa đơn:</Typography><Typography fontWeight={800}>{formatCurrency(total)}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Khách đưa:</Typography><Typography fontWeight={800}>{formatCurrency(Number(customerCash))}</Typography></Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f0fdf4', p: 1.5, borderRadius: 2 }}><Typography fontWeight={700} color="#166534">Tiền thừa:</Typography><Typography fontWeight={900} color="#16a34a" fontSize="1.2rem">{formatCurrency(Number(customerCash) - total)}</Typography></Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}><Button variant="contained" onClick={submitOrder} fullWidth sx={{ borderRadius: 2, py: 1.5 }}>Hoàn Tất</Button></DialogActions>
      </Dialog>

      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Quét Mã QR</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="error" mb={2} fontWeight={800}>{formatCurrency(total)}</Typography>
          <Box component="img" src={`https://img.vietqr.io/image/970405-3517205272726-compact2.png?amount=${total}&addInfo=POS&accountName=NGUYEN%20LUU%20HUNG`} sx={{ width: '100%', maxWidth: 250, border: '1px solid #eee', p: 1, borderRadius: 2 }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}><Button variant="contained" color="success" onClick={submitOrder} fullWidth sx={{ mx: 2 }}>Đã nhận tiền</Button></DialogActions>
      </Dialog>
    </Box>
  );
};