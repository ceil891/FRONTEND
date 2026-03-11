import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { WorkShift } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { workShiftAPI, storeAPI, userAPI, BackendWorkShift, BackendStore, BackendUser } from '../../api/client';

export const WorkShiftsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    storeId: '',
    userId: '',
    shiftDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadShifts(), loadStores(), loadUsers()]);
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    try {
      const resp = await workShiftAPI.getAll();
      if (resp.data.success && resp.data.data) {
        const mapped: WorkShift[] = resp.data.data.map((ws: BackendWorkShift) => ({
          id: ws.id.toString(),
          storeId: ws.storeId.toString(),
          userId: ws.userId.toString(),
          shiftDate: new Date(ws.shiftDate),
          startTime: new Date(`${ws.shiftDate}T${ws.startTime}`),
          endTime: ws.endTime ? new Date(`${ws.shiftDate}T${ws.endTime}`) : undefined,
          notes: ws.notes || undefined,
          createdAt: new Date(ws.createdAt),
        }));
        setShifts(mapped);
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi tải ca làm việc', 'error');
    }
  };

  const loadStores = async () => {
    try {
      const resp = await storeAPI.getAll();
      if (resp.data.success && resp.data.data) {
        setStores(
          resp.data.data.map((s: BackendStore) => ({
            id: s.id.toString(),
            name: s.name,
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  const loadUsers = async () => {
    try {
      const resp = await userAPI.getAll();
      if (resp.data.success && resp.data.data) {
        setUsers(
          resp.data.data.map((u: BackendUser) => ({
            id: u.id.toString(),
            name: u.fullName,
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleOpenDialog = (shift?: WorkShift) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        storeId: shift.storeId,
        userId: shift.userId,
        shiftDate: format(shift.shiftDate, 'yyyy-MM-dd'),
        startTime: format(shift.startTime, 'HH:mm'),
        endTime: shift.endTime ? format(shift.endTime, 'HH:mm') : '',
        notes: shift.notes || '',
      });
    } else {
      setEditingShift(null);
      setFormData({
        storeId: '',
        userId: '',
        shiftDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShift(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.storeId || !formData.userId) {
      showToast('Vui lòng chọn cửa hàng và nhân viên', 'warning');
      return;
    }
    if (!formData.shiftDate) {
      showToast('Vui lòng chọn ngày làm việc', 'warning');
      return;
    }
    if (!formData.startTime) {
      showToast('Vui lòng chọn giờ bắt đầu', 'warning');
      return;
    }
    if (formData.endTime && formData.endTime <= formData.startTime) {
      showToast('Giờ kết thúc phải sau giờ bắt đầu', 'warning');
      return;
    }

    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const startTime = new Date(formData.shiftDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    let endTime: Date | undefined;
    if (formData.endTime) {
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      endTime = new Date(formData.shiftDate);
      endTime.setHours(endHour, endMinute, 0, 0);
    }

    try {
      if (editingShift) {
        const resp = await workShiftAPI.update(parseInt(editingShift.id, 10), {
          storeId: parseInt(formData.storeId, 10),
          userId: parseInt(formData.userId, 10),
          shiftDate: formData.shiftDate,
          startTime: formData.startTime,
          endTime: formData.endTime || undefined,
          notes: formData.notes || undefined,
        });
        if (resp.data.success) {
          showToast('Cập nhật ca làm việc thành công', 'success');
          await loadShifts();
        }
      } else {
        const resp = await workShiftAPI.create({
          storeId: parseInt(formData.storeId, 10),
          userId: parseInt(formData.userId, 10),
          shiftDate: formData.shiftDate,
          startTime: formData.startTime,
          endTime: formData.endTime || undefined,
          notes: formData.notes || undefined,
        });
        if (resp.data.success) {
          showToast('Thêm ca làm việc thành công', 'success');
          await loadShifts();
        }
      }
      handleCloseDialog();
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi lưu ca làm việc', 'error');
    }
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'N/A';
  };

  const getStoreName = (storeId: string) => {
    return stores.find(s => s.id === storeId)?.name || 'N/A';
  };

  const isActive = (shift: WorkShift) => {
    return !shift.endTime;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Đang tải ca làm việc...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon color="primary" />
          Quản Lý Ca Làm Việc
        </Typography>
        {isSuperAdmin() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              },
            }}
          >
            Thêm Ca Làm Việc
          </Button>
        )}
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nhân Viên</TableCell>
                  <TableCell>Cửa Hàng</TableCell>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Giờ Bắt Đầu</TableCell>
                  <TableCell>Giờ Kết Thúc</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>Ghi Chú</TableCell>
                  <TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{getUserName(shift.userId)}</TableCell>
                    <TableCell>{getStoreName(shift.storeId)}</TableCell>
                    <TableCell>{format(shift.shiftDate, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(shift.startTime, 'HH:mm')}</TableCell>
                    <TableCell>
                      {shift.endTime ? format(shift.endTime, 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isActive(shift) ? 'Đang làm' : 'Đã kết thúc'}
                        color={isActive(shift) ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {shift.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {isSuperAdmin() && (
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(shift)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingShift ? 'Chỉnh Sửa Ca Làm Việc' : 'Thêm Ca Làm Việc Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Cửa Hàng</InputLabel>
                <Select
                label="Cửa Hàng"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              >
                {stores.map(store => (
                  <MenuItem key={store.id} value={store.id}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Nhân Viên</InputLabel>
                <Select
                label="Nhân Viên"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              >
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Ngày"
              type="date"
              value={formData.shiftDate}
              onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Giờ Bắt Đầu"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                label="Giờ Kết Thúc"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              fullWidth
              label="Ghi Chú"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {editingShift ? 'Cập Nhật' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
