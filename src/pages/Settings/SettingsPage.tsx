import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    aiRecommendations: true,
  });

  const handleSaveProfile = () => {
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }
    showToast('Cập nhật thông tin thành công', 'success');
  };

  const handleChangePassword = () => {
    if (!formData.currentPassword || !formData.newPassword) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('Mật khẩu mới không khớp', 'error');
      return;
    }
    if (formData.newPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'warning');
      return;
    }
    showToast('Đổi mật khẩu thành công', 'success');
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Cài Đặt
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Thông Tin Cá Nhân
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
                  src={user?.avatar}
                >
                  {user?.fullName.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton color="primary" component="label">
                  <PhotoCameraIcon />
                  <input hidden accept="image/*" type="file" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Họ và Tên"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Số Điện Thoại"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  fullWidth
                >
                  Lưu Thông Tin
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Password Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon color="primary" />
                Đổi Mật Khẩu
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Mật Khẩu Hiện Tại"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Mật Khẩu Mới"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Xác Nhận Mật Khẩu Mới"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <Button
                  variant="contained"
                  startIcon={<LockIcon />}
                  onClick={handleChangePassword}
                  fullWidth
                >
                  Đổi Mật Khẩu
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Cài Đặt Thông Báo
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    />
                  }
                  label="Thông báo qua Email"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    />
                  }
                  label="Thông báo qua SMS"
                />
                <Divider />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.lowStockAlerts}
                      onChange={(e) => setSettings({ ...settings, lowStockAlerts: e.target.checked })}
                    />
                  }
                  label="Cảnh báo tồn kho thấp"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.aiRecommendations}
                      onChange={(e) => setSettings({ ...settings, aiRecommendations: e.target.checked })}
                    />
                  }
                  label="Nhận đề xuất từ AI-Agent"
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => showToast('Lưu cài đặt thành công', 'success')}
                  sx={{ mt: 2 }}
                >
                  Lưu Cài Đặt
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
