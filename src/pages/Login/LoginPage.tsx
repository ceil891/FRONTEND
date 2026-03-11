import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Card, CardContent, TextField, Button,
  Typography, Alert, InputAdornment, IconButton,
} from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff, Store as StoreIcon } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { LoginRequest, LoginResponse, UserRole, User } from '../../types';
import { authAPI } from '../../api/client';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Gọi backend thật để lấy JWT token và thông tin User
      const backendResponse = await authAPI.login(formData.email, formData.password);

      if (!backendResponse.success || !backendResponse.data?.accessToken) {
        throw new Error(backendResponse.message || 'Đăng nhập thất bại.');
      }

      // 2. Lấy dữ liệu THẬT do Spring Boot trả về
      const { accessToken, role, fullName } = backendResponse.data;

      // 3. Khởi tạo đối tượng User với thông tin thực tế
      const realUser: User = {
        id: '1', // Tạm thời để '1', sau này nếu Backend trả về Employee ID thì bạn cập nhật lại
        email: formData.email,
        fullName: fullName, // Lấy tên thật từ DB
        phone: '',
        role: role as UserRole, // Map role thật từ DB (VD: ADMIN, MANAGER, CASHIER)
        storeId: 'store-1', 
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const loginResponse: LoginResponse = {
        token: accessToken,
        user: realUser,
        expiresIn: 24 * 60 * 60, // backend config: 24h
      };

      // 4. Lưu vào Store (Zustand)
      login(loginResponse);

      // 5. Điều hướng tự động theo Role của DB
      if (role === UserRole.SUPER_ADMIN || role === 'SUPER_ADMIN' || 
          role === UserRole.ADMIN || role === 'ADMIN' || 
          role === UserRole.MANAGER || role === 'MANAGER') {
        navigate('/dashboard');
      } else {
        // Phân quyền cho CASHIER / STAFF chỉ được vào trang Bán Hàng (POS)
        navigate('/pos');
      }
      
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <StoreIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>Đăng Nhập</Typography>
              <Typography variant="body2" color="text.secondary">Hệ thống Quản lý Chuỗi Cửa hàng Bán lẻ</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email" type="email" margin="normal" required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon /></InputAdornment>) }}
              />
              <TextField
                fullWidth label="Mật khẩu" type={showPassword ? 'text' : 'password'} margin="normal" required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><LockIcon /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};