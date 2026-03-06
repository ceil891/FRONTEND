import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Checkbox, FormControlLabel, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, FormControl, Select, MenuItem, InputLabel, Divider
} from '@mui/material';
import { Save as SaveIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

// 1. DỮ LIỆU MẪU: CÀI ĐẶT TỔNG QUAN (Global Settings)
const initialGlobalSettings = {
  viewImportPrice: true,
  viewExportPriceInDM: false,
  copySet: false,
  viewInvoiceByStaff: false,
  manageCustomerByStaff: false,
  editPriceWholesale: true,
  editDateImportExport: false,
  editDateReceiptPayment: true,
};

const initialDashboardSettings = {
  invoice: true,
  revenue: true,
  actualReceipt: true,
  profitLoss: true,
  chart: true,
  history: true,
  editMarketPriceApp: true,
};

// 2. DỮ LIỆU MẪU: BẢNG PHÂN QUYỀN MENU
type ActionType = 'view' | 'add' | 'edit' | 'delete' | 'print' | 'status' | 'import' | 'export';

const initialMenuPermissions = [
  { id: 1, name: 'POS - Bán lẻ', isParent: true, actions: { view: true, add: true, edit: true, delete: true, print: true, status: true, import: true, export: true } },
  { id: 2, name: 'Nhập - Xuất', isParent: true, actions: { view: true, add: false, edit: false, delete: false, print: true, status: false, import: false, export: false } },
  { id: 3, name: '--> Xuất bán', isParent: false, actions: { view: true, add: true, edit: true, delete: true, print: true, status: true, import: true, export: true } },
  { id: 4, name: '--> Nhập hàng', isParent: false, actions: { view: true, add: true, edit: false, delete: false, print: true, status: true, import: true, export: true } },
  { id: 5, name: 'Khách hàng (CRM)', isParent: true, actions: { view: true, add: true, edit: true, delete: false, print: true, status: true, import: true, export: true } },
  { id: 6, name: 'Tài chính - Kế toán', isParent: true, actions: { view: true, add: true, edit: true, delete: false, print: true, status: true, import: true, export: true } },
  { id: 7, name: '--> Phiếu thu', isParent: false, actions: { view: true, add: true, edit: true, delete: false, print: true, status: true, import: true, export: true } },
  { id: 8, name: '--> Phiếu chi', isParent: false, actions: { view: true, add: true, edit: true, delete: false, print: true, status: true, import: true, export: true } },
];

export const RolePermissionPage: React.FC = () => {
  const { showToast } = useToastStore();
  const [selectedRole, setSelectedRole] = useState('ACCOUNTANT');
  
  const [globalSettings, setGlobalSettings] = useState(initialGlobalSettings);
  const [dashboardSettings, setDashboardSettings] = useState(initialDashboardSettings);
  const [menuPermissions, setMenuPermissions] = useState(initialMenuPermissions);

  // Xử lý tick chọn 1 ô cụ thể
  const handleActionToggle = (id: number, action: ActionType) => {
    setMenuPermissions(prev => prev.map(menu => {
      if (menu.id === id) {
        return { ...menu, actions: { ...menu.actions, [action]: !menu.actions[action] } };
      }
      return menu;
    }));
  };

  // Xử lý tick chọn TOÀN BỘ 1 hàng (Tiện ích "Check All" cho người dùng)
  const handleRowToggleAll = (id: number, currentStatus: boolean) => {
    setMenuPermissions(prev => prev.map(menu => {
      if (menu.id === id) {
        const newStatus = !currentStatus;
        return { 
          ...menu, 
          actions: { view: newStatus, add: newStatus, edit: newStatus, delete: newStatus, print: newStatus, status: newStatus, import: newStatus, export: newStatus } 
        };
      }
      return menu;
    }));
  };

  const handleSave = () => {
    showToast(`Đã lưu thiết lập phân quyền cho nhóm [${selectedRole}] thành công!`, 'success');
  };

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" fontSize="large" /> PHÂN QUYỀN DÙNG MENU
        </Typography>

        {/* BỘ CHỌN NHÓM QUYỀN VÀ NÚT LƯU */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 250, bgcolor: 'white' }}>
            <InputLabel>Chọn nhóm quyền cần sửa</InputLabel>
            <Select value={selectedRole} label="Chọn nhóm quyền cần sửa" onChange={(e) => setSelectedRole(e.target.value)}>
              <MenuItem value="ADMIN">Quản trị viên (Admin)</MenuItem>
              <MenuItem value="MANAGER">Quản lý cửa hàng (Manager)</MenuItem>
              <MenuItem value="ACCOUNTANT">Kế toán (Accountant)</MenuItem>
              <MenuItem value="CASHIER">Thu ngân (Cashier)</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, px: 3, boxShadow: 'none', height: 40 }}>
            Lưu Cấu Hình
          </Button>
        </Box>
      </Box>

      {/* BLOCK 1: THIẾT LẬP TỔNG QUAN (CÁC QUYỀN ĐẶC BIỆT) */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none', mb: 3 }}>
        <CardContent>
          <Typography variant="body1" fontWeight={700} color="#1976d2" sx={{ mb: 2 }}>
            1. CÀI ĐẶT QUYỀN ĐẶC BIỆT
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.viewImportPrice} onChange={(e) => setGlobalSettings({...globalSettings, viewImportPrice: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Được xem giá nhập</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.viewExportPriceInDM} onChange={(e) => setGlobalSettings({...globalSettings, viewExportPriceInDM: e.target.checked})} />} label={<Typography variant="body2">Xem giá xuất trong DM</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.copySet} onChange={(e) => setGlobalSettings({...globalSettings, copySet: e.target.checked})} />} label={<Typography variant="body2">Sao chép bộ</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.viewInvoiceByStaff} onChange={(e) => setGlobalSettings({...globalSettings, viewInvoiceByStaff: e.target.checked})} />} label={<Typography variant="body2">Xem Hóa đơn theo Nhân viên</Typography>} /></Grid>
            
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.manageCustomerByStaff} onChange={(e) => setGlobalSettings({...globalSettings, manageCustomerByStaff: e.target.checked})} />} label={<Typography variant="body2">Quản lý Khách hàng theo Nhân viên</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.editPriceWholesale} onChange={(e) => setGlobalSettings({...globalSettings, editPriceWholesale: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Sửa giá khi Xuất bán buôn</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.editDateImportExport} onChange={(e) => setGlobalSettings({...globalSettings, editDateImportExport: e.target.checked})} />} label={<Typography variant="body2">Được sửa ngày phiếu Nhập/Xuất</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={3}><FormControlLabel control={<Checkbox size="small" checked={globalSettings.editDateReceiptPayment} onChange={(e) => setGlobalSettings({...globalSettings, editDateReceiptPayment: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Được sửa ngày phiếu Thu/Chi</Typography>} /></Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body1" fontWeight={700} color="#00a65a" sx={{ mb: 2 }}>
            2. QUYỀN XEM THÔNG TIN TRANG CHỦ (DASHBOARD)
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={4} md={2}><FormControlLabel control={<Checkbox size="small" checked={dashboardSettings.invoice} onChange={(e) => setDashboardSettings({...dashboardSettings, invoice: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Số hóa đơn</Typography>} /></Grid>
            <Grid item xs={12} sm={4} md={2}><FormControlLabel control={<Checkbox size="small" checked={dashboardSettings.revenue} onChange={(e) => setDashboardSettings({...dashboardSettings, revenue: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Doanh thu</Typography>} /></Grid>
            <Grid item xs={12} sm={4} md={2}><FormControlLabel control={<Checkbox size="small" checked={dashboardSettings.actualReceipt} onChange={(e) => setDashboardSettings({...dashboardSettings, actualReceipt: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Thực thu</Typography>} /></Grid>
            <Grid item xs={12} sm={4} md={2}><FormControlLabel control={<Checkbox size="small" checked={dashboardSettings.profitLoss} onChange={(e) => setDashboardSettings({...dashboardSettings, profitLoss: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Lãi lỗ</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={2}><FormControlLabel control={<Checkbox size="small" checked={dashboardSettings.chart} onChange={(e) => setDashboardSettings({...dashboardSettings, chart: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Biểu đồ Doanh thu</Typography>} /></Grid>
            <Grid item xs={12} sm={6} md={2}><FormControlLabel control={<Checkbox size="small" checked={dashboardSettings.history} onChange={(e) => setDashboardSettings({...dashboardSettings, history: e.target.checked})} />} label={<Typography variant="body2" fontWeight={600}>Lịch sử thao tác</Typography>} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* BLOCK 2: BẢNG MA TRẬN PHÂN QUYỀN MENU */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#fdfdfd' }}>
            <Typography variant="body1" fontWeight={700} color="#d97706">
              3. CHI TIẾT QUYỀN THEO TỪNG MENU
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f4f4f4' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #ddd', width: 40, p: 1.5, fontWeight: 600, color: '#333' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #ddd', width: 40, p: 0 }} align="center"><Checkbox size="small" disabled /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #ddd', fontWeight: 600, color: '#333' }}>Chức năng Menu</TableCell>
                  
                  {['Xem', 'Thêm', 'Sửa', 'Xóa', 'In', 'Status', 'Import', 'Export'].map(action => (
                    <TableCell key={action} sx={{ borderBottom: '2px solid #ddd', fontWeight: 600, color: '#333' }} align="center">{action}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {menuPermissions.map((row, index) => {
                  const isAllChecked = Object.values(row.actions).every(val => val === true);
                  
                  return (
                    <TableRow key={row.id} hover sx={{ bgcolor: row.isParent ? '#f8fafc' : 'inherit' }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', p: 1.5 }}>{index + 1}</TableCell>
                      
                      {/* Cột 2: Checkbox Check All 1 Hàng */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center">
                        <Checkbox size="small" checked={isAllChecked} onChange={() => handleRowToggleAll(row.id, isAllChecked)} />
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: row.isParent ? '#0f172a' : '#475569' }}>
                        <Typography variant="body2" sx={{ fontWeight: row.isParent ? 700 : 500, pl: row.isParent ? 0 : 3 }}>
                          {row.name}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.view} onChange={() => handleActionToggle(row.id, 'view')} /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.add} onChange={() => handleActionToggle(row.id, 'add')} /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.edit} onChange={() => handleActionToggle(row.id, 'edit')} /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.delete} onChange={() => handleActionToggle(row.id, 'delete')} /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.print} onChange={() => handleActionToggle(row.id, 'print')} /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.status} onChange={() => handleActionToggle(row.id, 'status')} /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.import} onChange={() => handleActionToggle(row.id, 'import')} /></TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }} align="center"><Checkbox size="small" checked={row.actions.export} onChange={() => handleActionToggle(row.id, 'export')} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};