import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  LocalOffer as OfferIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  SmartToy as SmartToyIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { Chatbot } from '../Chatbot/Chatbot';

const drawerWidth = 280;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Bán Hàng (POS)', icon: <ShoppingCartIcon />, path: '/pos', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
  { text: 'Đơn Hàng', icon: <ReceiptIcon />, path: '/orders', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Quản Lý Kho', icon: <InventoryIcon />, path: '/inventory', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Quản Lý Sản Phẩm', icon: <StoreIcon />, path: '/products', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Danh Mục', icon: <CategoryIcon />, path: '/categories', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Khuyến Mãi', icon: <OfferIcon />, path: '/promotions', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Ca Làm Việc', icon: <TimeIcon />, path: '/work-shifts', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Báo Cáo', icon: <AssessmentIcon />, path: '/reports', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'AI Dashboard', icon: <SmartToyIcon />, path: '/ai-dashboard', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Quản Lý Cửa Hàng', icon: <StoreIcon />, path: '/stores', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Quản Lý Người Dùng', icon: <PeopleIcon />, path: '/users', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Lịch Sử Hoạt Động', icon: <HistoryIcon />, path: '/activity-logs', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Thông Báo', icon: <NotificationsIcon />, path: '/notifications', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { text: 'Cài Đặt', icon: <SettingsIcon />, path: '/settings', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
];

export const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false;
    // Super admin có thể truy cập tất cả
    if (user.role === UserRole.SUPER_ADMIN) return true;
    return item.roles.includes(user.role);
  });

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #1565c0 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              p: 1,
            }}
          >
            <SmartToyIcon />
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            Retail Chain AI
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setShowChatbot(!showChatbot)}
            sx={{ ml: 1 }}
          >
            <SmartToyIcon />
          </IconButton>
          <IconButton onClick={handleMenuClick} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.fullName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => navigate('/settings')}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Hồ Sơ & Cài Đặt</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Đăng Xuất</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </Box>
  );
};
