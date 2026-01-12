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
import { LoginRequest, UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock login - Thay thế bằng API call thực tế
    try {
      // Simulate API call
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: formData.email,
          fullName: 'Nguyễn Văn A',
          phone: '0901234567',
          role: formData.email.includes('super') ? UserRole.SUPER_ADMIN :
                formData.email.includes('admin') ? UserRole.ADMIN : 
                formData.email.includes('manager') ? UserRole.MANAGER : UserRole.STAFF,
          storeId: 'store-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        expiresIn: 3600,
      };

      login(mockResponse);

      // Redirect based on role
      const role = mockResponse.user.role;
      if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
        navigate('/dashboard');
      } else if (role === UserRole.MANAGER) {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
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
              >
                Đăng Nhập
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
