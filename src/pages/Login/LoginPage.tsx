import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton } from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff, Store as StoreIcon } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { UserRole, User } from '../../types';
import { authAPI } from '../../api/client';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      // 1. "Gọi" login giả
      const response = await authAPI.login(formData.email, formData.password);

      // 2. Tự định nghĩa User dựa trên Email (Logic Demo)
      const role = 
          formData.email.includes('admin') ? UserRole.ADMIN :
          formData.email.includes('manager') ? UserRole.MANAGER : 
          UserRole.STAFF;

      const mockUser: User = {
        id: 'mock-id-1',
        email: formData.email,
        fullName: 'Người dùng Demo',
        role: role,
        storeId: 'store-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 3. Lưu vào Store (Zustand)
      login({
        token: response.data.accessToken,
        user: mockUser,
        expiresIn: 86400,
      });

      // 4. Điều hướng theo quyền
      if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    } catch (err) {
      setError('Lỗi đăng nhập hệ thống demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 450, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <StoreIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>Đăng Nhập</Typography>
              <Typography variant="body2" color="text.secondary">Chế độ Demo (Không cần Backend)</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal" required
                InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon /></InputAdornment>) }}
              />
              <TextField
                fullWidth label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                margin="normal" required
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><LockIcon /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Vào Hệ Thống'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};