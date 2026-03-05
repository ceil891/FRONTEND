import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, TextField, Button, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, InputAdornment,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import {
  Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon, Search as SearchIcon,
  Print as PrintIcon, Payment as PaymentIcon, Storefront as StoreIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Product, OrderDetail, PaymentMethod, Promotion } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { productAPI, orderAPI, storeAPI, BackendStore } from '../../api/client';
import { generateReceiptHTML } from '../../utils/receiptTemplate';
import { useAuthStore } from '../../store/authStore';

export const POSPage: React.FC = () => {
  // --- STATE QUẢN LÝ CỬA HÀNG ---
  const [stores, setStores] = useState<BackendStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<BackendStore | null>(null);

  // --- STATE POS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderDetail[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  
  // ✅ THÊM STATE ĐỂ ĐÓNG/MỞ POPUP QR
  const [openQRDialog, setOpenQRDialog] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();
  const { user } = useAuthStore();

  const mapBackendToProduct = (sp: any): Product => {
    return {
      id: String(sp.sanPhamId),
      code: sp.maSku,
      name: sp.tenSanPham,
      price: Number(sp.giaBan ?? 0),
      unit: 'Cái', 
      categoryId: sp.danhMuc ? sp.danhMuc.id : null,
      isActive: !!sp.hoatDong,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...({ 
          donViId: sp.donViId || 1,
          hinhAnhUrls: sp.hinhAnhUrls || []
      }) 
    };
  };

  // Tải dữ liệu Cửa hàng và Sản phẩm khi vừa vào trang
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [storeRes, prodRes] = await Promise.all([
        storeAPI.getAll(),
        productAPI.getAll()
      ]);
      
      const listStores = storeRes.data?.data || [];
      setStores(listStores);

      let listSP: any[] = [];
      const rawProd = prodRes.data;
      if (Array.isArray(rawProd)) listSP = rawProd;
      else if (rawProd && typeof rawProd === 'object') listSP = (rawProd as any).data || (rawProd as any).content || [];

      const activeProducts = listSP.map(mapBackendToProduct).filter(p => p.isActive);
      setProducts(activeProducts);

    } catch (err) {
      showToast('Lỗi tải dữ liệu hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  const mockPromotions: Promotion[] = [
    { id: '1', code: 'GIAM10', name: 'Giảm 10%', discountType: 'PERCENTAGE', discountValue: 10, minPurchase: 100000, maxDiscount: 50000, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  const applyPromotion = () => {
    if (!promoCode.trim()) return showToast('Vui lòng nhập mã', 'warning');
    const promotion = mockPromotions.find(p => p.code.toUpperCase() === promoCode.toUpperCase() && p.isActive);
    if (!promotion) return showToast('Mã không hợp lệ', 'error');
    
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    if (promotion.minPurchase && subtotal < promotion.minPurchase) {
      return showToast(`Đơn hàng tối thiểu ${formatCurrency(promotion.minPurchase)}`, 'warning');
    }
    setAppliedPromotion(promotion);
    showToast('Đã áp dụng mã!', 'success');
  };

  const removePromotion = () => { setAppliedPromotion(null); setPromoCode(''); };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice } : item
      ));
    } else {
      setCart([...cart, { id: `cart-${Date.now()}`, orderId: '', productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, discount: 0, total: product.price }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice - item.discount };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  let discount = 0;
  if (appliedPromotion) {
    if (appliedPromotion.discountType === 'PERCENTAGE') {
      discount = (subtotal * appliedPromotion.discountValue) / 100;
      if (appliedPromotion.maxDiscount && discount > appliedPromotion.maxDiscount) discount = appliedPromotion.maxDiscount;
    } else {
      discount = appliedPromotion.discountValue;
    }
  }
  const total = subtotal - discount;

  // ✅ HÀM GỌI API ĐỂ LƯU VÀO DATABASE VÀ GOOGLE SHEETS
  const submitOrderToDatabase = async () => {
    if (!selectedStore) return showToast('Chưa chọn cửa hàng', 'error');
    if (!user || !user.id) return showToast('Lỗi: Chưa đăng nhập', 'error');

    try {
      setLoading(true);
      const orderPayload = {
        cuaHangId: selectedStore.id, 
        nhanVienId: user.id, 
        khachHangId: null, 
        ghiChu: paymentMethod === PaymentMethod.QR_CODE ? "Thanh toán chuyển khoản" : "Bán tại quầy POS",
        tamTinh: subtotal,
        chietKhau: discount,
        shippingFee: 0,
        tongPhaiThanhToan: total,
        trangThai: 'COMPLETED', 
        items: cart.map(item => ({
          bienTheId: Number(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0
        }))
      };

      // 1. Lưu vào Database MySQL (Java Spring Boot)
      await orderAPI.create(orderPayload as any); 

      // 2. Bắn dữ liệu lên Google Sheets (Chạy ngầm không đợi chờ)
   try {
        const formData = new URLSearchParams();
        formData.append('thoiGian', new Date().toLocaleString('vi-VN'));
        formData.append('cuaHang', selectedStore.name || 'Cửa hàng');
        formData.append('thuNgan', user?.fullName || 'Admin');
        formData.append('tongTien', total.toString());
        formData.append('hinhThuc', paymentMethod === PaymentMethod.QR_CODE ? 'Chuyển khoản' : 'Tiền mặt');
        formData.append('sanPham', cart.map(item => `${item.productName} (x${item.quantity})`).join(', '));

       await fetch('https://script.google.com/macros/s/AKfycbzl5yAluSPScYslJtEbmoFP8X5v30M1ocxtQE_yq6K9k3utG7XsaVafssSFWo4kUPBElg/exec', { 
          method: 'POST',
          body: formData,
          mode: 'no-cors' // Cực kỳ quan trọng
        });
        
        console.log("Đã gửi lệnh lưu lên Google Sheets!");
      } catch (sheetErr) {
        console.error("Lỗi khi bắn dữ liệu lên Sheets:", sheetErr);
      }

      showToast(`Thanh toán thành công!`, 'success');
      setCart([]); 
      setAppliedPromotion(null);
      setPromoCode('');
      setOpenQRDialog(false); // Thành công thì đóng popup mã QR
    } catch (err: any) {
      showToast('Lỗi khi thanh toán: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ HÀM XỬ LÝ KHI BẤM NÚT "THANH TOÁN" MÀU XANH BÊN CỘT PHẢI
  const handleCheckoutClick = () => {
    if (cart.length === 0) return showToast('Giỏ hàng trống', 'warning');
    
    if (paymentMethod === PaymentMethod.QR_CODE) {
      setOpenQRDialog(true); // Bật popup mã QR lên
    } else {
      submitOrderToDatabase(); // Trả tiền mặt thì lưu vào DB luôn
    }
  };

  const handlePrintReceipt = () => {
    if (cart.length === 0) return showToast('Chưa có sản phẩm để in', 'warning');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return showToast('Vui lòng cho phép popup để in', 'error');
    const htmlContent = generateReceiptHTML(cart, subtotal, discount, total);
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================
  // GIAO DIỆN 1: MÀN HÌNH CHỌN CỬA HÀNG
  // ==========================================
  if (!selectedStore) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 64px)' }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
          Chọn Cửa Hàng Bán Hàng
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>
          Vui lòng chọn cửa hàng bạn đang làm việc để hệ thống ghi nhận doanh thu chính xác.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={3} justifyContent="center" maxWidth="lg" mx="auto">
            {stores.map((store) => (
              <Grid item xs={12} sm={6} md={4} key={store.id}>
                <Card 
                  onClick={() => setSelectedStore(store)}
                  sx={{ 
                    cursor: 'pointer', borderRadius: 3, border: '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      borderColor: 'primary.main',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                      <StoreIcon sx={{ fontSize: 40, color: '#0ea5e9' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                      {store.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {store.address || 'Chưa cập nhật địa chỉ'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {stores.length === 0 && (
              <Typography color="error" variant="h6" sx={{ mt: 5 }}>
                Chưa có cửa hàng nào trong hệ thống! Vui lòng tạo cửa hàng trước.
              </Typography>
            )}
          </Grid>
        )}
      </Box>
    );
  }

  // ==========================================
  // GIAO DIỆN 2: MÀN HÌNH POS BÁN HÀNG
  // ==========================================
  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 64px)', overflow: 'hidden', bgcolor: '#f8fafc' }}>
      
      {/* HEADER CỦA MÀN HÌNH POS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: '#fff', p: 1.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => setSelectedStore(null)} sx={{ bgcolor: '#f1f5f9' }} title="Đổi cửa hàng">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
              POS Bán Hàng
            </Typography>
            <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <StoreIcon fontSize="inherit" /> {selectedStore.name}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Thu ngân: <strong>{user?.fullName || 'Admin'}</strong>
        </Typography>
      </Box>

      {/* NỘI DUNG POS */}
      <Grid container spacing={2} sx={{ height: 'calc(100% - 70px)' }}>
        {/* Cột Trái: Danh sách Sản phẩm */}
        <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <TextField
                fullWidth size="small" placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SKU..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                {loading && products.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {filteredProducts.map((product) => {
                      const pExtra = product as any;
                      const imageUrl = pExtra.hinhAnhUrls?.[0] || 'https://via.placeholder.com/150?text=No+Image';
                      
                      return (
                      <Grid item xs={6} sm={4} md={3} key={product.id}>
                        <Card
                          sx={{
                            cursor: 'pointer', transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column',
                            border: '1px solid #e2e8f0', boxShadow: 'none',
                            '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }
                          }}
                          onClick={() => addToCart(product)}
                        >
                          <Box component="img" src={imageUrl} sx={{ height: 110, width: '100%', objectFit: 'cover', borderBottom: '1px solid #f1f5f9' }} />
                          <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pb: '12px !important' }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>{product.code}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {product.name}
                              </Typography>
                            </Box>
                            <Typography variant="subtitle1" sx={{ color: '#dc2626', fontWeight: 700, mt: 1 }}>
                              {formatCurrency(product.price)}
                            </Typography>
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

        {/* Cột Phải: Giỏ hàng & Thanh toán */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', pb: '16px !important' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, borderBottom: '2px solid #f1f5f9', pb: 1.5, color: '#0f172a' }}>
                Giỏ Hàng
              </Typography>

              <Box sx={{ flex: 1, overflowY: 'auto', mx: -2, px: 2 }}>
                {cart.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Giỏ hàng trống</Typography>
                    <Typography variant="caption" color="text.disabled">Hãy chọn sản phẩm bên trái</Typography>
                  </Box>
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
            {!appliedPromotion ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField 
                        fullWidth 
                        size="small" 
                        placeholder="Mã giảm giá (VD: GIAM10)" 
                        value={promoCode} 
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())} 
                        onKeyPress={(e) => { if (e.key === 'Enter') applyPromotion(); }} 
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            borderRadius: 1.5, 
                            height: '42px' // Ép chiều cao cố định
                          } 
                        }} 
                      />
                      <Button 
                        variant="outlined" 
                        onClick={applyPromotion} 
                        sx={{ 
                          borderRadius: 1.5, 
                          fontWeight: 600, 
                          height: '42px', // Chiều cao bằng chính xác ô text
                          minWidth: '100px' // Nút không bị ép rúm ró
                        }}
                      >
                        Áp dụng
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#dcfce7', borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>{appliedPromotion.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 500 }}>{appliedPromotion.code}</Typography>
                      </Box>
                      <IconButton size="small" onClick={removePromotion} sx={{ color: '#dc2626' }}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  )}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5, mt: 1.5, alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>Khách phải trả:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(total)}</Typography>
                </Box>

                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Chip label="Tiền mặt" onClick={() => setPaymentMethod(PaymentMethod.CASH)} color={paymentMethod === PaymentMethod.CASH ? 'primary' : 'default'} variant={paymentMethod === PaymentMethod.CASH ? 'filled' : 'outlined'} sx={{ flex: 1, fontWeight: 600, borderRadius: 1.5, py: 2.5 }} />
                  <Chip label="Chuyển khoản" onClick={() => setPaymentMethod(PaymentMethod.QR_CODE)} color={paymentMethod === PaymentMethod.QR_CODE ? 'primary' : 'default'} variant={paymentMethod === PaymentMethod.QR_CODE ? 'filled' : 'outlined'} sx={{ flex: 1, fontWeight: 600, borderRadius: 1.5, py: 2.5 }} />
                </Box>

                {/* ✅ GỌI HÀM KIỂM TRA MỞ POPUP HAY LƯU LUÔN */}
                <Button fullWidth variant="contained" size="large" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />} disabled={loading} onClick={handleCheckoutClick} sx={{ mb: 1, py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)' } }}>
                  {loading ? 'ĐANG XỬ LÝ...' : 'THANH TOÁN'}
                </Button>
                
                <Button fullWidth variant="outlined" size="large" startIcon={<PrintIcon />} onClick={handlePrintReceipt} sx={{ py: 1.2, fontWeight: 700, borderRadius: 2, borderWidth: '2px !important', color: '#475569', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f8fafc', color: '#0f172a', borderColor: '#94a3b8' } }}>
                  IN HÓA ĐƠN
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================= DIALOG MÃ QR CHUYỂN KHOẢN ================= */}
      {/* Nằm ngoài cùng để popup trôi nổi lên trên cùng */}
      <Dialog open={openQRDialog} onClose={() => !loading && setOpenQRDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main', pb: 1 }}>
          Thanh Toán Chuyển Khoản
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
            Vui lòng quét mã QR dưới đây. <br/>
            Số tiền: <strong style={{ color: '#dc2626', fontSize: '1.2rem' }}>{formatCurrency(total)}</strong>
          </Typography>
          
          {/* 💡 Sửa STK và Bank ID của bạn ở đây nhé */}
          <Box 
            component="img"
            src={`https://img.vietqr.io/image/970405-3517205272726-compact2.png?amount=${total}&addInfo=ThanhToanPOS&accountName=NGUYEN%20LUU%20HUNG`}
            alt="QR Code"
            sx={{ width: 250, height: 250, border: '2px solid #e2e8f0', borderRadius: 2, p: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2, pt: 0 }}>
          <Button variant="outlined" color="error" onClick={() => setOpenQRDialog(false)} disabled={loading}>
            Hủy Giao Dịch
          </Button>
          {/* 💡 Khi bấm Xác nhận, gọi thẳng hàm lưu Database */}
          <Button variant="contained" color="success" onClick={submitOrderToDatabase} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Đã Nhận Tiền'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};