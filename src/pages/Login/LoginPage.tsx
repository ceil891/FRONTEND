import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { LoginRequest, LoginResponse, UserRole, User } from '../../types';
import { authAPI } from '../../api/client';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
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
      // Gọi backend thật để lấy JWT token
      const backendResponse = await authAPI.login(formData.email, formData.password);

      if (!backendResponse.success || !backendResponse.data?.accessToken) {
        throw new Error(backendResponse.message || 'Đăng nhập thất bại.');
      }

      // Tạm thời vẫn dùng user mock (vì backend login chỉ trả token)
      const mockUser: User = {
        id: '1',
        email: formData.email,
        fullName: 'Người dùng hệ thống',
        phone: '',
        role:
          formData.email.includes('super') ? UserRole.SUPER_ADMIN :
          formData.email.includes('admin') ? UserRole.ADMIN :
          formData.email.includes('manager') ? UserRole.MANAGER :
          UserRole.STAFF,
        storeId: 'store-1',
        isActive: true,
        avatar: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const loginResponse: LoginResponse = {
        token: backendResponse.data.accessToken,
        user: mockUser,
        expiresIn: 24 * 60 * 60, // backend config: 24h
      };

      login(loginResponse);

      const role = mockUser.role;
      if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.MANAGER) {
        navigate('/dashboard');
      } else {
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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <StoreIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                Đăng Nhập
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hệ thống Quản lý Chuỗi Cửa hàng Bán lẻ AI-Agent
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Demo: super@example.com / admin@example.com / manager@example.com / staff@example.com
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
