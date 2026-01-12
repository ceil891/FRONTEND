import React, { useState } from 'react';
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

export const WorkShiftsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  // Mock data
  const mockUsers = [
    { id: 'user-1', name: 'Nguyễn Văn A' },
    { id: 'user-2', name: 'Trần Thị B' },
    { id: 'user-3', name: 'Lê Văn C' },
  ];

  const mockStores = [
    { id: 'store-1', name: 'Cửa Hàng 1' },
    { id: 'store-2', name: 'Cửa Hàng 2' },
  ];

  const [shifts, setShifts] = useState<WorkShift[]>([
    {
      id: '1',
      storeId: 'store-1',
      userId: 'user-1',
      shiftDate: new Date(),
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      endTime: new Date(new Date().setHours(17, 0, 0, 0)),
      createdAt: new Date(),
    },
    {
      id: '2',
      storeId: 'store-1',
      userId: 'user-2',
      shiftDate: new Date(),
      startTime: new Date(new Date().setHours(17, 0, 0, 0)),
      createdAt: new Date(),
    },
  ]);

  const [formData, setFormData] = useState({
    storeId: '',
    userId: '',
    shiftDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '',
    notes: '',
  });

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

  const handleSave = () => {
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

    if (editingShift) {
      setShifts(shifts.map(s =>
        s.id === editingShift.id
          ? {
              ...s,
              storeId: formData.storeId,
              userId: formData.userId,
              shiftDate: new Date(formData.shiftDate),
              startTime,
              endTime,
              notes: formData.notes,
            }
          : s
      ));
      showToast('Cập nhật ca làm việc thành công', 'success');
    } else {
      const newShift: WorkShift = {
        id: Date.now().toString(),
        storeId: formData.storeId,
        userId: formData.userId,
        shiftDate: new Date(formData.shiftDate),
        startTime,
        endTime,
        notes: formData.notes,
        createdAt: new Date(),
      };
      setShifts([...shifts, newShift]);
      showToast('Thêm ca làm việc thành công', 'success');
    }
    handleCloseDialog();
  };

  const getUserName = (userId: string) => {
    return mockUsers.find(u => u.id === userId)?.name || 'N/A';
  };

  const getStoreName = (storeId: string) => {
    return mockStores.find(s => s.id === storeId)?.name || 'N/A';
  };

  const isActive = (shift: WorkShift) => {
    return !shift.endTime;
  };

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
                {mockStores.map(store => (
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
                {mockUsers.map(user => (
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
