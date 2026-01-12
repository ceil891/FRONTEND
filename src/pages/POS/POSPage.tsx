import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { Product, OrderDetail, PaymentMethod, Promotion } from '../../types';
import { useToastStore } from '../../store/toastStore';

export const POSPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderDetail[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const { showToast } = useToastStore();

  // Mock products - Thay thế bằng API call
  const mockProducts: Product[] = [
    { id: '1', code: 'SP001', name: 'Coca Cola 330ml', price: 15000, unit: 'Lon', categoryId: 'cat1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', code: 'SP002', name: 'Pepsi 330ml', price: 15000, unit: 'Lon', categoryId: 'cat1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', code: 'SP003', name: 'Bánh mì thịt nướng', price: 25000, unit: 'Cái', categoryId: 'cat2', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  // Mock promotions
  const mockPromotions: Promotion[] = [
    {
      id: '1',
      code: 'GIAM10',
      name: 'Giảm 10% cho đơn hàng trên 100k',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 100000,
      maxDiscount: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      code: 'FIXED20K',
      name: 'Giảm 20.000đ',
      discountType: 'FIXED',
      discountValue: 20000,
      minPurchase: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const applyPromotion = () => {
    if (!promoCode.trim()) {
      showToast('Vui lòng nhập mã khuyến mãi', 'warning');
      return;
    }

    const promotion = mockPromotions.find(
      p => p.code.toUpperCase() === promoCode.toUpperCase() && p.isActive
    );

    if (!promotion) {
      showToast('Mã khuyến mãi không hợp lệ', 'error');
      return;
    }

    const now = new Date();
    if (promotion.startDate > now || promotion.endDate < now) {
      showToast('Mã khuyến mãi đã hết hạn', 'error');
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    if (promotion.minPurchase && subtotal < promotion.minPurchase) {
      showToast(`Đơn hàng tối thiểu ${formatCurrency(promotion.minPurchase)}`, 'warning');
      return;
    }

    setAppliedPromotion(promotion);
    showToast('Áp dụng khuyến mãi thành công!', 'success');
  };

  const removePromotion = () => {
    setAppliedPromotion(null);
    setPromoCode('');
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        id: `cart-${Date.now()}`,
        orderId: '',
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        total: product.price,
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unitPrice - item.discount,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  
  let discount = 0;
  if (appliedPromotion) {
    if (appliedPromotion.discountType === 'PERCENTAGE') {
      discount = (subtotal * appliedPromotion.discountValue) / 100;
      if (appliedPromotion.maxDiscount && discount > appliedPromotion.maxDiscount) {
        discount = appliedPromotion.maxDiscount;
      }
    } else {
      discount = appliedPromotion.discountValue;
    }
  }
  
  const total = subtotal - discount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('Giỏ hàng trống', 'warning');
      return;
    }
    // Xử lý thanh toán - Gọi API
    showToast(`Thanh toán thành công! Tổng tiền: ${formatCurrency(total)}`, 'success');
    setCart([]);
    setAppliedPromotion(null);
    setPromoCode('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const filteredProducts = mockProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Bán Hàng Tại Quầy (POS)
      </Typography>

      <Grid container spacing={3}>
        {/* Product Selection */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Grid container spacing={2}>
                {filteredProducts.map((product) => (
                  <Grid item xs={6} sm={4} md={3} key={product.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        },
                        '&:active': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => addToCart(product)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {product.code}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, my: 1 }}>
                          {product.name}
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {formatCurrency(product.price)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Cart & Checkout */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Giỏ Hàng
              </Typography>

              {cart.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    Giỏ hàng trống
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="right">SL</TableCell>
                          <TableCell align="right">Tổng</TableCell>
                          <TableCell align="right"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2">{item.productName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatCurrency(item.unitPrice)}/đơn vị
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <IconButton size="small" onClick={() => updateQuantity(item.id, -1)}>
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography>{item.quantity}</Typography>
                                <IconButton size="small" onClick={() => updateQuantity(item.id, 1)}>
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.total)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => removeFromCart(item.id)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    {/* Promotion Code */}
                    <Box sx={{ mb: 2 }}>
                      {!appliedPromotion ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Nhập mã khuyến mãi"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                applyPromotion();
                              }
                            }}
                          />
                          <Button variant="outlined" onClick={applyPromotion}>
                            Áp dụng
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {appliedPromotion.name}
                            </Typography>
                            <Typography variant="caption">
                              Mã: {appliedPromotion.code}
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={removePromotion} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tạm tính:</Typography>
                      <Typography>{formatCurrency(subtotal)}</Typography>
                    </Box>
                    {discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="success.main">Giảm giá:</Typography>
                        <Typography color="success.main">-{formatCurrency(discount)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Tổng cộng:
                      </Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                        {formatCurrency(total)}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Phương thức thanh toán:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label="Tiền mặt"
                          onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                          color={paymentMethod === PaymentMethod.CASH ? 'primary' : 'default'}
                        />
                        <Chip
                          label="QR Code"
                          onClick={() => setPaymentMethod(PaymentMethod.QR_CODE)}
                          color={paymentMethod === PaymentMethod.QR_CODE ? 'primary' : 'default'}
                        />
                        <Chip
                          label="Thẻ"
                          onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                          color={paymentMethod === PaymentMethod.CARD ? 'primary' : 'default'}
                        />
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<PaymentIcon />}
                      onClick={handleCheckout}
                      sx={{ 
                        mb: 1,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
                        },
                      }}
                    >
                      Thanh Toán
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => alert('In hóa đơn')}
                      sx={{
                        py: 1.2,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      In Hóa Đơn
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
