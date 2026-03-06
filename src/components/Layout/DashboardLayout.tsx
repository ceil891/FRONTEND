import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu,
  MenuItem, Collapse, Select, FormControl // ✅ Thêm Select, FormControl
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon, Inventory as InventoryIcon, Assessment as AssessmentIcon,
  Store as StoreIcon, Category as CategoryIcon, LocalOffer as OfferIcon,
  AccessTime as TimeIcon, People as PeopleIcon, Settings as SettingsIcon,
  Notifications as NotificationsIcon, SmartToy as SmartToyIcon, Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon, History as HistoryIcon, ExpandLess, ExpandMore,
  AccountBalanceWallet as WalletIcon, LocalShipping as ShippingIcon,
  Storefront as StorefrontIcon,
  AccountBalance as AccountBalanceIcon,
  Map as MapIcon,
  Security as SecurityIcon
} from '@mui/icons-material';  
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { Chatbot } from '../Chatbot/Chatbot';

const drawerWidth = 280;

interface MenuItemCustom {
  text: string;
  icon: React.ReactNode;
  path?: string;
  roles: UserRole[];
  children?: MenuItemCustom[];
}

export const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  
  // ✅ FIX 1: Khởi tạo openMenus rỗng
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  
  // ✅ FIX 2: State cho Store Switcher
  const [currentStore, setCurrentStore] = useState('store1');

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // DANH SÁCH MENU
  const menuItems: MenuItemCustom[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Bán Hàng (POS)', icon: <ShoppingCartIcon />, path: '/pos', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
    { 
      text: 'Quản lý Đơn Hàng', icon: <ReceiptIcon />, roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Đơn bán lẻ', icon: <ReceiptIcon />, path: '/orders/retail', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Đơn online', icon: <ShippingIcon />, path: '/orders/online', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Đơn bị hủy', icon: <HistoryIcon />, path: '/orders/cancelled', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Lịch sử giao dịch', icon: <HistoryIcon />, path: '/orders/history', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] }
      ]
    },
    { 
      text: 'Kho vận', icon: <InventoryIcon />, roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Nhập hàng', icon: <InventoryIcon />, path: '/inventory/import', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Xuất hàng', icon: <InventoryIcon />, path: '/inventory/export', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Kiểm kho', icon: <AssessmentIcon />, path: '/inventory/check', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Chuyển kho nội bộ', icon: <StoreIcon />, path: '/inventory/transfer', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Trả hàng nhà cung cấp', icon: <PeopleIcon />, path: '/inventory/return-supplier', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Khách trả hàng', icon: <ReceiptIcon />, path: '/inventory/return-customer', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] }
      ]
    },
    { 
      text: 'Sản phẩm', icon: <CategoryIcon />, roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Quản lý sản phẩm', icon: <StoreIcon />, path: '/products', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Danh mục', icon: <CategoryIcon />, path: '/categories', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Giá theo cửa hàng', icon: <OfferIcon />, path: '/product-pricing', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Nhà cung cấp', icon: <PeopleIcon />, path: '/suppliers', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] }
      ]
    },
    { 
      text: 'Khách hàng (CRM)', icon: <PeopleIcon />, roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Danh sách khách hàng', icon: <PeopleIcon />, path: '/customers', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Khuyến mãi', icon: <OfferIcon />, path: '/promotions', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Tích điểm & Thành viên', icon: <AccountCircleIcon />, path: '/loyalty', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] }
      ]
    },
    { 
      text: 'Tài chính', icon: <WalletIcon />, roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Phiếu thu', icon: <ReceiptIcon />, path: '/finance/receipt', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Phiếu chi', icon: <ReceiptIcon />, path: '/finance/payment', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Công nợ nhà cung cấp', icon: <PeopleIcon />, path: '/finance/supplier-debt', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
                { text: 'Sổ quỹ tiền mặt', icon: <PeopleIcon />, path: '/finance/cash-book', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Sỗ quỹ tài khoản ngân hàng', icon: <ReceiptIcon />, path: '/finance/bank-book', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] }

      ]
    },
    
    { 
      text: 'Nhân sự', icon: <PeopleIcon />, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Quản lý nhân viên', icon: <PeopleIcon />, path: '/employees', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Ca làm việc', icon: <TimeIcon />, path: '/work-shifts', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Hiệu suất bán hàng', icon: <AssessmentIcon />, path: '/employees/performance', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }
      ]
    },
    { 
      text: 'Báo cáo & Phân tích', icon: <AssessmentIcon />, roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Doanh thu theo cửa hàng', icon: <AssessmentIcon />, path: '/reports/store-revenue', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'So sánh hiệu suất cửa hàng', icon: <AssessmentIcon />, path: '/reports/store-performance', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Top sản phẩm', icon: <AssessmentIcon />, path: '/reports/top-products', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Tồn kho toàn hệ thống', icon: <AssessmentIcon />, path: '/reports/system-inventory', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Lãi lỗ chi nhánh', icon: <AssessmentIcon />, path: '/reports/profit-loss', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] }
      ]
    },
    { 
      text: 'Hệ thống', icon: <SettingsIcon />, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      children: [
        { text: 'Quản lý cửa hàng', icon: <StoreIcon />, path: '/stores', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Quản lý người dùng', icon: <PeopleIcon />, path: '/users', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Quản lý khu vực', icon: <HistoryIcon />, path: '/activity-logs', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
{ text: 'Phân quyền', icon: <SecurityIcon />, path: '/system/roles', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },        { text: 'Lịch sử hoạt động', icon: <HistoryIcon />, path: '/activity-logs', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        { text: 'Cài đặt hệ thống', icon: <SettingsIcon />, path: '/settings', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }

      ]
    },
    { text: 'AI Dashboard', icon: <SmartToyIcon />, path: '/ai-dashboard', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] }
  ];

  // ✅ FIX 1: Tự động mở menu cha khi load hoặc đổi route
  useEffect(() => {
    const newOpenMenus: { [key: string]: boolean } = {};
    menuItems.forEach(item => {
      if (item.children?.some(child => child.path === location.pathname)) {
        newOpenMenus[item.text] = true;
      }
    });
    setOpenMenus(prev => ({ ...prev, ...newOpenMenus }));
  }, [location.pathname]);

  const handleToggle = (menuText: string) => {
    setOpenMenus(prev => ({ ...prev, [menuText]: !prev[menuText] }));
  };

  const handleLogout = () => { 
    setAnchorEl(null);
    logout(); 
    navigate('/login'); 
  };

  // ✅ FIX 5: Hàm đệ quy tìm Title siêu chuẩn
  const findTitle = (items: MenuItemCustom[]): string | null => {
    for (const item of items) {
      if (item.path === location.pathname) return item.text;
      if (item.children) {
        const childTitle = findTitle(item.children);
        if (childTitle) return `${item.text} / ${childTitle}`;
      }
    }
    return null;
  };

  const getCurrentPageTitle = () => {
    return findTitle(menuItems) || 'Hệ thống Retail Chain AI';
  };

  const renderMenuItems = (items: MenuItemCustom[], depth = 0) => {
    return items.map((item) => {
      // ✅ FIX 3: Logic Check Role chuẩn xác, rõ ràng
      if (!user) return null;
      if (user.role !== UserRole.SUPER_ADMIN && !item.roles.includes(user.role)) {
        return null;
      }

      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openMenus[item.text] || false;
      const isSelected = location.pathname === item.path || (hasChildren && item.children?.some(c => c.path === location.pathname));

      return (
        <React.Fragment key={item.text}>
          {/* ✅ BONUS: Thêm spacing (mt: 1.5) giữa các module chính nhìn thanh thoát hơn */}
          <ListItem disablePadding sx={{ display: 'block', mt: depth === 0 ? 1 : 0 }}>
            <ListItemButton
              selected={isSelected} // ✅ FIX 4: Đã đổi thành isSelected cho menu cha
              onClick={() => hasChildren ? handleToggle(item.text) : item.path && navigate(item.path)}
              sx={{ 
                pl: depth * 2.5 + 2, 
                py: 1.2,
                bgcolor: isSelected && hasChildren ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                borderRight: location.pathname === item.path ? '4px solid #1976d2' : 'none'
              }}
            >
              <ListItemIcon sx={{ color: isSelected ? 'primary.main' : 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontWeight: isSelected ? 600 : 500, fontSize: depth === 0 ? '0.95rem' : '0.9rem' }} 
              />
              {hasChildren ? (isOpen ? <ExpandLess color="action" /> : <ExpandMore color="action" />) : null}
            </ListItemButton>
          </ListItem>
          
          {hasChildren && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                {renderMenuItems(item.children!, depth + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>RETAIL AI</Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflowY: 'auto', flexGrow: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '3px' } }}>
        <List sx={{ pt: 1, pb: 4 }}>
          {renderMenuItems(menuItems)}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` }, 
          bgcolor: '#ffffff', 
          color: '#1e293b',   
          borderBottom: '1px solid #e2e8f0',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {getCurrentPageTitle()}
          </Typography>

          {/* ✅ FIX 2: THÊM STORE SWITCHER CỰC XỊN Ở ĐÂY */}
          <FormControl size="small" sx={{ mr: 3, minWidth: 200, display: { xs: 'none', md: 'flex' } }}>
            <Select
              value={currentStore}
              onChange={(e) => setCurrentStore(e.target.value)}
              displayEmpty
              sx={{ 
                bgcolor: '#f8fafc', 
                borderRadius: 2,
                fontWeight: 600,
                color: '#0f172a',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
              }}
              renderValue={(value) => {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorefrontIcon fontSize="small" color="primary" />
                    {value === 'store1' ? 'Cửa hàng Hà Nội' : value === 'store2' ? 'Cửa hàng Hồ Chí Minh' : 'Chọn cửa hàng'}
                  </Box>
                );
              }}
            >
              <MenuItem value="store1">Cửa hàng Hà Nội</MenuItem>
              <MenuItem value="store2">Cửa hàng Hồ Chí Minh</MenuItem>
            </Select>
          </FormControl>

          <IconButton color="primary" onClick={() => setShowChatbot(!showChatbot)} sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', mr: 2 }}>
            <SmartToyIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #e2e8f0', pl: 2 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', mr: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {user?.fullName || 'Tài khoản'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {user?.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Nhân viên'}
              </Typography>
            </Box>
            
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '1.1rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)' }}>
                {user?.fullName?.charAt(0).toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{ sx: { width: 220, mt: 1.5, borderRadius: 2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ py: 1.5 }}>
                <AccountCircleIcon sx={{ mr: 1.5, color: 'text.secondary' }} /> Tới trang cá nhân
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main', fontWeight: 600, py: 1.5 }}>
                <LogoutIcon sx={{ mr: 1.5 }} /> Đăng xuất hệ thống
              </MenuItem>
            </Menu>
          </Box>

        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' } }}>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
        <Toolbar /> 
        <Outlet />
      </Box>

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </Box>
  );
};