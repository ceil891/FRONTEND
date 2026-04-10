import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select, Chip, CircularProgress, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, AccessTime as TimeIcon,
  ExitToApp as LogoutIcon, History as HistoryIcon
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore'; 
import { format } from 'date-fns';
import { workShiftAPI, storeAPI, userAPI } from '../../api/client';

export const WorkShiftsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { showToast } = useToastStore();
  const { user, isSuperAdmin } = useAuthStore(); 

  const [shifts, setShifts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    storeId: '',
    employeeId: '',
    shiftDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm'),
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftRes, storeRes, userRes] = await Promise.all([
        workShiftAPI.getAll(),
        storeAPI.getAll(),
        userAPI.getAll()
      ]);

      setShifts((shiftRes.data as any)?.data || shiftRes.data || []);
      setStores((storeRes.data as any)?.data || storeRes.data || []);
      setUsers((userRes.data as any)?.data || userRes.data || []);
    } catch (err: any) {
      showToast('Lỗi khi tải dữ liệu hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = () => {
    setFormData({
      storeId: user?.storeId ? user.storeId.toString() : '',
      employeeId: user?.id ? user.id.toString() : '',
      shiftDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: format(new Date(), 'HH:mm'),
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleCheckIn = async () => {
    if (!formData.storeId || !formData.employeeId) {
      return showToast('Vui lòng chọn cửa hàng và nhân viên', 'warning');
    }

    try {
      setSaving(true);
      const payload = {
        storeId: Number(formData.storeId),
        employeeId: Number(formData.employeeId), 
        shiftDate: formData.shiftDate,
        startTime: formData.startTime,
        notes: formData.notes
      };

      await workShiftAPI.checkIn(payload);
      showToast('Check-in thành công!', 'success');
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi Check-in', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn kết thúc ca làm việc này?")) return;
    try {
      await workShiftAPI.checkOut(id);
      showToast('Check-out thành công!', 'success');
      loadData();
    } catch (err: any) {
      showToast('Lỗi Check-out', 'error');
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon color="primary" /> QUẢN LÝ CA LÀM VIỆC
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog} 
          sx={{ bgcolor: '#00a65a', textTransform: 'none' }}
        >
          Mở Ca Check-in
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nhân Viên</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cửa Hàng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giờ Vào</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giờ Ra</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : shifts.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Chưa có ca làm việc nào</TableCell></TableRow>
              ) : shifts.map((shift) => (
                <TableRow key={shift.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{shift.employeeName || 'N/A'}</TableCell>
                  <TableCell>{shift.storeName || 'N/A'}</TableCell>
                  <TableCell>{shift.shiftDate}</TableCell>
                  <TableCell sx={{ color: '#00a65a', fontWeight: 600 }}>{shift.startTime}</TableCell>
                  <TableCell sx={{ color: '#dd4b39', fontWeight: 600 }}>{shift.endTime || '--:--'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={!shift.endTime ? 'Đang làm' : 'Đã kết thúc'} 
                      color={!shift.endTime ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    {!shift.endTime && (
                      <Tooltip title="Kết thúc ca (Check-out)">
                        <IconButton color="error" onClick={() => handleCheckOut(shift.id)}>
                          <LogoutIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small"><HistoryIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* DIALOG CHECK-IN */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>CHECK-IN NHÂN VIÊN</DialogTitle>
        <DialogContent sx={{ pt: '20px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Cửa Hàng</InputLabel>
            <Select 
              label="Cửa Hàng" 
              value={formData.storeId} 
              // CƠ CHẾ RESET: Khi đổi cửa hàng, ép employeeId về rỗng để phải chọn lại nhân viên
              onChange={(e) => setFormData({...formData, storeId: e.target.value, employeeId: ''})}
              disabled={!isSuperAdmin() && !!user?.storeId} 
            >
              {stores.map(s => <MenuItem key={s.id} value={s.id.toString()}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Nhân Viên</InputLabel>
            <Select 
              label="Nhân Viên" 
              value={formData.employeeId} 
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              // Mở khóa cho Quản lý (MANAGER) và Super Admin được phép check-in cho nhân viên khác
              disabled={!isSuperAdmin() && user?.role !== 'MANAGER'} 
            >
              {/* CƠ CHẾ LỌC: Chỉ hiển thị user có storeId khớp với storeId đã chọn ở trên */}
              {users
                .filter(u => {
                  if (!formData.storeId) return false; // Không chọn cửa hàng -> Không hiện nhân viên nào
                  return u.storeId?.toString() === formData.storeId.toString();
                })
                .map(u => <MenuItem key={u.id} value={u.id.toString()}>{u.fullName}</MenuItem>)
              }
            </Select>
          </FormControl>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Ngày" type="date" size="small" value={formData.shiftDate} onChange={(e) => setFormData({...formData, shiftDate: e.target.value})} InputLabelProps={{ shrink: true }} />
            <TextField label="Giờ vào" type="time" size="small" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} InputLabelProps={{ shrink: true }} />
          </Box>

          <TextField label="Ghi chú" multiline rows={2} size="small" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleCheckIn} disabled={saving} sx={{ bgcolor: '#00a65a' }}>
            {saving ? 'Đang lưu...' : 'Xác Nhận Check-in'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};