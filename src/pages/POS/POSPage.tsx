import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid, Card, CardContent, TextField, Button, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, InputAdornment,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Divider, Stack
} from '@mui/material';
import {
  Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon, Search as SearchIcon,
  Print as PrintIcon, Payment as PaymentIcon, Storefront as StoreIcon, ArrowBack as ArrowBackIcon,
  AccountCircle as AccountIcon, LocalOffer as PromoIcon
} from '@mui/icons-material';

import { PaymentMethod } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { generateReceiptHTML } from '../../utils/receiptTemplate';
import { useAuthStore } from '../../store/authStore';
import { storeAPI, productAPI, orderAPI, loyaltyAPI, promotionAPI } from '../../api/client'; 

interface BackendStore {
  id: number;
  name: string;
  address?: string;
}

export const POSPage: React.FC = () => {
  const [stores, setStores] = useState<BackendStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<BackendStore | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]); 
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  
  const [customerCash, setCustomerCash] = useState<number | ''>('');
  
  // 🟢 STATE CHỨA DANH SÁCH KHUYẾN MÃI TỪ BACKEND 🟢
  const [promotions, setPromotions] = useState<any[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<any | null>(null);
  
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [openCashDialog, setOpenCashDialog] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [loyaltyConfig, setLoyaltyConfig] = useState({ exchangeRateEarn: 100000, exchangeRateRedeem: 100 });

  const [products, setProducts] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();
  const { user } = useAuthStore();

  const getProductImage = (p: any) => {
    if (!p) return 'https://via.placeholder.com/150?text=No+Image';
    const urls = p.imageUrls || p.hinhAnhUrls || p.images;
    if (Array.isArray(urls) && urls.length > 0) return urls[0];
    if (typeof urls === 'string') {
      if (urls.startsWith('[')) {
        try { return JSON.parse(urls).length > 0 ? JSON.parse(urls)[0] : 'https://via.placeholder.com/150?text=No+Image'; } 
        catch (e) { return 'https://via.placeholder.com/150?text=No+Image'; }
      }
      return urls;
    }
    return p.imageUrl || p.hinhAnhUrl || p.image || 'https://via.placeholder.com/150?text=No+Image';
  };

  const mapBackendToProduct = (sp: any) => {
    return {
      ...sp, id: String(sp.id || sp.sanPhamId), code: sp.code || sp.maSku, name: sp.name || sp.tenSanPham,
      price: Number(sp.baseRetailPrice ?? sp.giaBan ?? sp.price ?? 0), unit: sp.unitName || 'Cái', 
      categoryId: sp.categoryId || (sp.danhMuc ? sp.danhMuc.id : null),
      isActive: sp.status === 'ACTIVE' || sp.hoatDong !== false, variants: sp.variants || [], 
      imageUrls: sp.imageUrls || sp.hinhAnhUrls || [] 
    };
  };

  const mapBackendToPromotion = (p: any) => {
    return {
      id: String(p.id || p.khuyenMaiId),
      code: p.code || p.maKM || p.maKm || '',
      name: p.name || p.tenChuongTrinh || p.code || '',
      discountType: p.discountType || (p.loaiGiam === '%' ? 'PERCENTAGE' : 'FIXED'),
      discountValue: Number(p.discountValue || p.giaTri || 0),
      minPurchase: Number(p.minPurchase || p.donToiThieu || 0),
      maxDiscount: Number(p.maxDiscount || p.giamToiDa || 0),
      isActive: p.status === 'ACTIVE' || p.trangThai === 'Đang chạy' || p.isActive !== false
    };
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [storeRes, prodRes, configRes, promoRes] = await Promise.all([
        storeAPI.getAll().catch(() => ({ data: { data: [] } })),
        productAPI.getAll().catch(() => ({ data: [] })),
        loyaltyAPI.getConfig().catch(() => null),
        promotionAPI.getAll().catch(() => ({ data: [] }))
      ]);
      
      setStores(storeRes.data?.data || []);
      
      if (configRes?.data?.success && configRes.data.data) {
        setLoyaltyConfig({
          exchangeRateEarn: configRes.data.data.exchangeRateEarn || 100000,
          exchangeRateRedeem: configRes.data.data.exchangeRateRedeem || 100
        });
      }

      let listSP: any[] = [];
      const rawProd = prodRes.data;
      if (Array.isArray(rawProd)) listSP = rawProd;
      else if (rawProd && typeof rawProd === 'object') listSP = (rawProd as any).data || (rawProd as any).content || [];
      setProducts(listSP.map(mapBackendToProduct).filter(p => p.isActive));

      let listPromo: any[] = [];
      const rawPromo = promoRes.data;
      if (Array.isArray(rawPromo?.data)) listPromo = rawPromo.data;
      else if (Array.isArray(rawPromo)) listPromo = rawPromo;
      else if (rawPromo?.content) listPromo = rawPromo.content;
      
      setPromotions(listPromo.map(mapBackendToPromotion).filter(p => p.isActive));

    } catch (err) { showToast('Lỗi tải dữ liệu', 'error'); } finally { setLoading(false); }
  };

  useEffect(() => { void loadInitialData(); }, []);

  const handleFindCustomer = async () => {
    if (!customerPhone.trim()) return showToast('Vui lòng nhập SĐT', 'warning');
    setLoading(true);
    try {
      const res = await loyaltyAPI.getMembers(customerPhone);
      const members = res.data?.data || [];
      if (members.length > 0) {
        setSelectedCustomer(members[0]);
        setPointsToUse(0);
        showToast(`Đã áp dụng khách: ${members[0].fullName}`, 'success');
      } else { showToast('Không tìm thấy hội viên!', 'warning'); }
    } catch (error) { showToast('Lỗi tra cứu hội viên', 'error'); } 
    finally { setLoading(false); }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.code.toLowerCase().includes(lowerQuery));
  }, [products, searchQuery]);

  const { subtotal, discount, total } = useMemo(() => {
    const calcSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
    let calcDiscount = 0;
    
    if (appliedPromotion) {
      if (appliedPromotion.discountType === 'PERCENTAGE' || appliedPromotion.discountType === '%') {
        calcDiscount = (calcSubtotal * appliedPromotion.discountValue) / 100;
        if (appliedPromotion.maxDiscount && calcDiscount > appliedPromotion.maxDiscount) calcDiscount = appliedPromotion.maxDiscount;
      } else { calcDiscount = appliedPromotion.discountValue; }
    }
    
    const pointDiscount = (pointsToUse || 0) * loyaltyConfig.exchangeRateRedeem;
    calcDiscount += pointDiscount;

    if (appliedPromotion && appliedPromotion.minPurchase && calcSubtotal < appliedPromotion.minPurchase) {
      setAppliedPromotion(null);
    }

    return { subtotal: calcSubtotal, discount: calcDiscount, total: Math.max(0, calcSubtotal - calcDiscount) };
  }, [cart, appliedPromotion, pointsToUse, loyaltyConfig]);

  const handleProductClick = (product: any) => {
    const variants = product.variants || [];
    if (variants.length === 0) return showToast('Sản phẩm chưa có biến thể!', 'error');
    if (variants.length === 1) {
      if (variants[0].quantity <= 0) return showToast('Sản phẩm này đã hết hàng!', 'error');
      addVariantToCart(product, variants[0]);
    }
    else { setCurrentProduct(product); setVariantDialogOpen(true); }
  };

  const addVariantToCart = (product: any, variant: any) => {
    if (variant.quantity <= 0) return showToast('Sản phẩm này đã hết hàng!', 'error');

    const existingItem = cart.find(item => item.variantId === variant.id);
    if (existingItem) {
      if (existingItem.quantity + 1 > variant.quantity) {
        return showToast(`Chỉ còn ${variant.quantity} sản phẩm trong kho!`, 'warning');
      }
      setCart(cart.map(item => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice } : item));
    } else {
      const attrName = [variant.colorName, variant.sizeName].filter(Boolean).join(' - ') || variant.sku;
      const finalName = `${product.name} (${attrName})`;
      const finalPrice = variant.sellPrice || product.price;
      setCart([...cart, { id: `cart-v${variant.id}`, productId: product.id, variantId: variant.id, productName: finalName, quantity: 1, unitPrice: finalPrice, discount: 0, total: finalPrice, maxStock: variant.quantity }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        let newQuantity = item.quantity + delta;
        if (newQuantity < 1) newQuantity = 1;
        if (newQuantity > item.maxStock) {
          showToast(`Kho chỉ còn ${item.maxStock} sản phẩm!`, 'warning');
          newQuantity = item.maxStock;
        }
        return { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice - item.discount };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

  const handleCheckoutClick = () => {
    if (cart.length === 0) return showToast('Giỏ hàng trống', 'warning');
    
    if (paymentMethod === PaymentMethod.CASH) {
      if (customerCash === '' || Number(customerCash) < total) {
        return showToast('Vui lòng nhập đủ số tiền khách đưa!', 'error');
      }
      setOpenCashDialog(true); 
    } else {
      setOpenQRDialog(true); 
    }
  };

  const submitOrderToDatabase = async () => {
    if (!selectedStore) return showToast('Chưa chọn cửa hàng', 'error');
    if (!user || !user.id) return showToast('Lỗi: Chưa đăng nhập', 'error');

    try {
      setLoading(true);
      const orderPayload = {
        orderType: 'RETAIL', 
        paymentMethod: paymentMethod === PaymentMethod.QR_CODE ? 'BANK_TRANSFER' : paymentMethod,
        shippingFee: 0, customerId: selectedCustomer?.id || null, discount: discount, storeId: selectedStore.id, 
        promotionId: appliedPromotion ? Number(appliedPromotion.id) : null,
        items: cart.map(item => ({ productVariantId: Number(item.variantId), quantity: item.quantity }))
      };

      await orderAPI.create(orderPayload as any); 

      try {
        const formData = new URLSearchParams();
        formData.append('thoiGian', new Date().toLocaleString('vi-VN'));
        formData.append('cuaHang', selectedStore.name || 'Cửa hàng');
        formData.append('thuNgan', user?.fullName || 'Admin');
        formData.append('tongTien', total.toString());
        formData.append('hinhThuc', paymentMethod === PaymentMethod.QR_CODE ? 'Chuyển khoản' : 'Tiền mặt');
        formData.append('sanPham', cart.map(item => `${item.productName} (x${item.quantity})`).join(', '));
        if (selectedCustomer) formData.append('khachHang', selectedCustomer.fullName);
        await fetch('https://script.google.com/macros/s/AKfycbzl5yAluSPScYslJtEbmoFP8X5v30M1ocxtQE_yq6K9k3utG7XsaVafssSFWo4kUPBElg/exec', { method: 'POST', body: formData, mode: 'no-cors' });
      } catch (sheetErr) { console.error(sheetErr); }

      showToast(`Thanh toán thành công!`, 'success');
      
      setCart([]); setAppliedPromotion(null); setOpenQRDialog(false); setOpenCashDialog(false);
      setSelectedCustomer(null); setPointsToUse(0); setCustomerPhone(''); setCustomerCash('');
    } catch (err: any) { showToast('Lỗi khi thanh toán: ' + (err.response?.data?.message || err.message), 'error'); } 
    finally { setLoading(false); }
  };

  const handlePrintReceipt = () => {
    if (cart.length === 0) return showToast('Chưa có sản phẩm để in', 'warning');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return showToast('Vui lòng cho phép popup để in', 'error');
    const htmlContent = generateReceiptHTML(cart, subtotal, discount, total, selectedStore);
    printWindow.document.open(); printWindow.document.write(htmlContent); printWindow.document.close();
    printWindow.focus(); setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  if (!selectedStore) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 64px)' }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>Chọn Cửa Hàng Bán Hàng</Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>Vui lòng chọn cửa hàng bạn đang làm việc để ghi nhận doanh thu chính xác.</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={3} justifyContent="center" maxWidth="lg" mx="auto">
            {stores.map((store) => (
              <Grid item xs={12} sm={6} md={4} key={store.id}>
                <Card onClick={() => setSelectedStore(store)} sx={{ cursor: 'pointer', borderRadius: 3, border: '2px solid transparent', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)', borderColor: 'primary.main', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } }}>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}><StoreIcon sx={{ fontSize: 40, color: '#0ea5e9' }} /></Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>{store.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{store.address || 'Chưa cập nhật địa chỉ'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 64px)', overflow: 'hidden', bgcolor: '#f8fafc' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: '#fff', p: 1.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => setSelectedStore(null)} sx={{ bgcolor: '#f1f5f9' }}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>POS Bán Hàng</Typography>
            <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}><StoreIcon fontSize="inherit" /> {selectedStore.name}</Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">Thu ngân: <strong>{user?.fullName || 'Admin'}</strong></Typography>
      </Box>

      <Grid container spacing={2} sx={{ height: 'calc(100% - 70px)' }}>
        <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <TextField fullWidth size="small" placeholder="Tìm kiếm sản phẩm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                {loading && products.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                ) : (
                  <Grid container spacing={2}>
                    {filteredProducts.map((product) => {
                      const imageUrl = getProductImage(product);
                      return (
                      <Grid item xs={6} sm={4} md={4} key={product.id}>
                        <Card onClick={() => handleProductClick(product)} sx={{ cursor: 'pointer', transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: 'none', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' } }}>
                          <Box component="img" src={imageUrl} sx={{ height: 110, width: '100%', objectFit: 'cover', borderBottom: '1px solid #f1f5f9' }} />
                          <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pb: '12px !important' }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>{product.code}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</Typography>
                            </Box>
                            <Typography variant="subtitle1" sx={{ color: '#dc2626', fontWeight: 700, mt: 1 }}>{formatCurrency(product.price)}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )})}
                  </Grid>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', pb: '16px !important' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, borderBottom: '2px solid #f1f5f9', pb: 1.5, color: '#0f172a' }}>Giỏ Hàng</Typography>

              <Box sx={{ flex: 1, overflowY: 'auto', mx: -2, px: 2 }}>
                {cart.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary" sx={{ fontWeight: 500 }}>Giỏ hàng trống</Typography></Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id} sx={{ '& td': { borderBottom: '1px dashed #e2e8f0', py: 1.5 } }}>
                            <TableCell sx={{ pl: 0, width: '45%' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.2, mb: 0.5 }}>{item.productName}</Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>{formatCurrency(item.unitPrice)}</Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ width: '30%', px: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 0.5, py: 0.25 }}>
                                <IconButton size="small" onClick={() => updateQuantity(item.id, -1)} sx={{ p: 0.25 }}><RemoveIcon sx={{ fontSize: 16 }} /></IconButton>
                                <Typography sx={{ minWidth: 20, textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>{item.quantity}</Typography>
                                <IconButton size="small" onClick={() => updateQuantity(item.id, 1)} sx={{ p: 0.25 }}><AddIcon sx={{ fontSize: 16 }} /></IconButton>
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#dc2626', width: '25%', pr: 0 }}>
                              {formatCurrency(item.total)}
                              <IconButton size="small" onClick={() => removeFromCart(item.id)} sx={{ color: '#ef4444', ml: 0.5, p: 0.5 }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid #f1f5f9' }}>
                <Box sx={{ mb: 2 }}>
                  {!selectedCustomer ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField size="small" fullWidth placeholder="Tìm SĐT khách hàng..." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleFindCustomer()} InputProps={{ startAdornment: <InputAdornment position="start"><AccountIcon fontSize="small" /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, height: '40px' } }} />
                      <Button variant="outlined" onClick={handleFindCustomer} sx={{ borderRadius: 1.5, fontWeight: 600, height: '40px' }}>Tìm</Button>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 1.5, border: '1px solid #bae6fd' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0369a1' }}>👤 {selectedCustomer.fullName}</Typography>
                        <IconButton size="small" onClick={() => { setSelectedCustomer(null); setPointsToUse(0); setCustomerPhone(''); }} sx={{ p: 0 }}><DeleteIcon fontSize="small" color="error" /></IconButton>
                      </Box>
                      {selectedCustomer.currentPoints > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                          <TextField size="small" type="number" label="Dùng điểm" value={pointsToUse || ''} onChange={e => { let val = Number(e.target.value); if (val > selectedCustomer.currentPoints) val = selectedCustomer.currentPoints; if (val < 0) val = 0; setPointsToUse(val); }} sx={{ width: 120, '& .MuiInputBase-root': { height: '35px' } }} />
                          <Typography variant="body2" color="error.main" fontWeight={600}>-{formatCurrency(pointsToUse * loyaltyConfig.exchangeRateRedeem)}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Select 
                    fullWidth size="small" displayEmpty 
                    value={appliedPromotion ? appliedPromotion.id : ''}
                    onChange={(e) => {
                      const promo = promotions.find(p => p.id === e.target.value);
                      setAppliedPromotion(promo || null);
                      if (promo) showToast(`Đã áp mã: ${promo.name}`, 'success');
                    }}
                    startAdornment={<InputAdornment position="start"><PromoIcon fontSize="small" color="primary" /></InputAdornment>}
                    sx={{ borderRadius: 1.5, bgcolor: '#f8fafc', fontSize: '14px', '& .MuiSelect-select': { py: 1 } }}
                  >
                    <MenuItem value=""><em>-- Áp dụng mã khuyến mãi --</em></MenuItem>
                    {promotions.map(promo => (
                      <MenuItem key={promo.id} value={promo.id} disabled={subtotal < (promo.minPurchase || 0)}>
                        Mã {promo.code} ({promo.discountType === 'PERCENTAGE' ? `Giảm ${promo.discountValue}%` : `Giảm ${formatCurrency(promo.discountValue)}`})
                        {subtotal < (promo.minPurchase || 0) && ` - Cần mua thêm ${formatCurrency((promo.minPurchase || 0) - subtotal)}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Tạm tính:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</Typography>
                </Box>
                {discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 500 }}>Giảm giá:</Typography>
                    <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 600 }}>-{formatCurrency(discount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, mt: 1, alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>Khách phải trả:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(total)}</Typography>
                </Box>

                {paymentMethod === PaymentMethod.CASH && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Tiền khách đưa:</Typography>
                    <TextField 
                      size="small" type="text" placeholder="Nhập số tiền..." value={customerCash} 
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\D/g, '');
                        setCustomerCash(cleanValue === '' ? '' : Number(cleanValue));
                      }} 
                      sx={{ width: 140, '& .MuiInputBase-root': { height: '32px' }, input: { textAlign: 'right', fontWeight: 'bold' } }} 
                    />
                  </Box>
                )}

                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Chip label="Tiền mặt" onClick={() => setPaymentMethod(PaymentMethod.CASH)} color={paymentMethod === PaymentMethod.CASH ? 'primary' : 'default'} variant={paymentMethod === PaymentMethod.CASH ? 'filled' : 'outlined'} sx={{ flex: 1, fontWeight: 600, borderRadius: 1.5, py: 2.5 }} />
                  <Chip label="Chuyển khoản" onClick={() => setPaymentMethod(PaymentMethod.QR_CODE)} color={paymentMethod === PaymentMethod.QR_CODE ? 'primary' : 'default'} variant={paymentMethod === PaymentMethod.QR_CODE ? 'filled' : 'outlined'} sx={{ flex: 1, fontWeight: 600, borderRadius: 1.5, py: 2.5 }} />
                </Box>

                <Button fullWidth variant="contained" size="large" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />} disabled={loading} onClick={handleCheckoutClick} sx={{ mb: 1.5, py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2 }}>
                  {loading ? 'ĐANG XỬ LÝ...' : 'THANH TOÁN'}
                </Button>

                <Button fullWidth variant="outlined" size="large" startIcon={<PrintIcon />} onClick={handlePrintReceipt} sx={{ py: 1.2, fontWeight: 700, borderRadius: 2, borderWidth: '2px !important', color: '#475569', borderColor: '#cbd5e1' }}>
                  IN HÓA ĐƠN
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* POPUP CHỌN PHÂN LOẠI */}
      <Dialog open={variantDialogOpen} onClose={() => setVariantDialogOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #e2e8f0', pb: 2 }}>Chọn phân loại: {currentProduct?.name}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {currentProduct?.variants?.map((v: any) => (
              <Grid item xs={12} sm={6} key={v.id}>
                <Button fullWidth variant="outlined" onClick={() => { addVariantToCart(currentProduct, v); setVariantDialogOpen(false); }}
                  disabled={v.quantity <= 0}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5, borderRadius: 2, height: '100%', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f0f9ff', borderColor: '#0ea5e9' } }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="700" color={v.quantity <= 0 ? 'text.disabled' : '#0f172a'} mb={0.5}>{[v.colorName, v.sizeName].filter(Boolean).join(' - ') || v.sku}</Typography>
                    <Typography variant="body2" color={v.quantity <= 0 ? 'text.disabled' : '#dc2626'} fontWeight="bold">{formatCurrency(v.sellPrice || currentProduct?.price)}</Typography>
                    <Typography variant="caption" color={v.quantity <= 0 ? 'error' : 'text.secondary'}>{v.quantity <= 0 ? 'Hết hàng' : `Tồn kho: ${v.quantity}`}</Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}><Button onClick={() => setVariantDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Hủy</Button></DialogActions>
      </Dialog>

      {/* POPUP XÁC NHẬN THANH TOÁN TIỀN MẶT */}
      <Dialog open={openCashDialog} onClose={() => setOpenCashDialog(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', pb: 2 }}>Xác Nhận Thanh Toán</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} mt={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" fontWeight={500}>Khách phải trả:</Typography>
              <Typography fontWeight={800} color="#dc2626" fontSize="1.1rem">{formatCurrency(total)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" fontWeight={500}>Tiền khách đưa:</Typography>
              <Typography fontWeight={700}>{formatCurrency(Number(customerCash))}</Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f0fdf4', p: 1.5, borderRadius: 2, border: '1px solid #bbf7d0' }}>
              <Typography fontWeight={700} color="#166534">Tiền thừa trả khách:</Typography>
              <Typography fontWeight={800} color="#16a34a" fontSize="1.1rem">{formatCurrency(Number(customerCash) - total)}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', justifyContent: 'center', gap: 2 }}>
          <Button variant="outlined" onClick={() => setOpenCashDialog(false)} color="inherit" sx={{ fontWeight: 600, width: 120, borderRadius: 2 }}>Quay lại</Button>
          <Button variant="contained" onClick={submitOrderToDatabase} color="primary" disabled={loading} sx={{ fontWeight: 700, width: 120, borderRadius: 2 }}>{loading ? 'Đang xử lý...' : 'Xác Nhận'}</Button>
        </DialogActions>
      </Dialog>

      {/* POPUP QUÉT QR */}
      <Dialog open={openQRDialog} onClose={() => !loading && setOpenQRDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main', pb: 1 }}>Thanh Toán Chuyển Khoản</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>Số tiền: <strong style={{ color: '#dc2626', fontSize: '1.2rem' }}>{formatCurrency(total)}</strong></Typography>
          <Box component="img" src={`https://img.vietqr.io/image/970405-3517205272726-compact2.png?amount=${total}&addInfo=ThanhToanPOS&accountName=NGUYEN%20LUU%20HUNG`} alt="QR Code" sx={{ width: 250, height: 250, border: '2px solid #e2e8f0', borderRadius: 2, p: 1 }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2, pt: 0 }}>
          <Button variant="outlined" color="error" onClick={() => setOpenQRDialog(false)} disabled={loading}>Hủy</Button>
          <Button variant="contained" color="success" onClick={submitOrderToDatabase} disabled={loading}>{loading ? 'Đang lưu...' : 'Đã Nhận Tiền'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};