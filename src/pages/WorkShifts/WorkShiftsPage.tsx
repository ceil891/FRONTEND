import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, MenuItem, FormControl,
  InputLabel, Select, IconButton, Checkbox, Pagination, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, AccessTime as TimeIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Storefront as StoreIcon, Person as PersonIcon
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
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToastStore();
  const { isSuperAdmin } = useAuthStore();

  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    storeId: '', userId: '', shiftDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00', endTime: '', notes: '',
  });

  // ================= LOGIC API (GIỮ NGUYÊN) =================
  useEffect(() => { void loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadShifts(), loadStores(), loadUsers()]);
    } finally { setLoading(false); }
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
    } catch (err: any) { showToast('Lỗi khi tải ca làm việc', 'error'); }
  };

  const loadStores = async () => {
    try {
      const resp = await storeAPI.getAll();
      if (resp.data.success && resp.data.data) {
        setStores(resp.data.data.map((s: BackendStore) => ({ id: s.id.toString(), name: s.name })));
      }
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const resp = await userAPI.getAll();
      if (resp.data.success && resp.data.data) {
        setUsers(resp.data.data.map((u: BackendUser) => ({ id: u.id.toString(), name: u.fullName })));
      }
    } catch {}
  };

  const handleOpenDialog = (shift?: WorkShift) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        storeId: shift.storeId, userId: shift.userId,
        shiftDate: format(shift.shiftDate, 'yyyy-MM-dd'),
        startTime: format(shift.startTime, 'HH:mm'),
        endTime: shift.endTime ? format(shift.endTime, 'HH:mm') : '',
        notes: shift.notes || '',
      });
    } else {
      setEditingShift(null);
      setFormData({ storeId: '', userId: '', shiftDate: format(new Date(), 'yyyy-MM-dd'), startTime: '08:00', endTime: '', notes: '' });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.storeId || !formData.userId) return showToast('Vui lòng chọn cửa hàng và nhân viên', 'warning');
    try {
      const payload = {
        storeId: parseInt(formData.storeId, 10),
        userId: parseInt(formData.userId, 10),
        shiftDate: formData.shiftDate,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        notes: formData.notes || undefined,
      };
      if (editingShift) await workShiftAPI.update(parseInt(editingShift.id, 10), payload);
      else await workShiftAPI.create(payload);
      
      showToast('Lưu ca làm việc thành công', 'success');
      await loadShifts();
      setOpenDialog(false);
    } catch (err: any) { showToast('Lỗi khi lưu ca làm việc', 'error'); }
  };

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';
  const getStoreName = (storeId: string) => stores.find(s => s.id === storeId)?.name || 'N/A';

  // ================= GIAO DIỆN CHUẨN RIC =================
  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          LỊCH TRÌNH CA LÀM VIỆC
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm tên nhân viên..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            {isSuperAdmin() && (
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm Ca Làm</Button>
            )}
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Lịch Trình</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Quản lý thời gian check-in/check-out của nhân viên tại các chi nhánh</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Sửa</TableCell>
                  
                  {['Nhân Viên', 'Cửa Hàng', 'Ngày Trực', 'Bắt Đầu', 'Kết Thúc', 'Trạng Thái', 'Ghi Chú'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5 }}>Đang tải...</TableCell></TableRow>
                ) : shifts.map((shift, index) => (
                  <TableRow key={shift.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      {isSuperAdmin() && (
                        <Box onClick={() => handleOpenDialog(shift)} sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'inline-flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                      )}
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: '#0284c7' }} />
                        <Typography variant="body2" fontWeight={600} color="#0f172a">{getUserName(shift.userId)}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StoreIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" color="#475569">{getStoreName(shift.storeId)}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>
                      {format(shift.shiftDate, 'dd/MM/yyyy')}
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>
                      {format(shift.startTime, 'HH:mm')}
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', p: 1.5 }}>
                      {shift.endTime ? format(shift.endTime, 'HH:mm') : '--:--'}
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      {!shift.endTime ? 
                        <Chip label="Đang làm" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, borderRadius: 1 }} /> : 
                        <Chip label="Hoàn thành" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, borderRadius: 1 }} />
                      }
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#94a3b8', p: 1.5 }}>
                      {shift.notes || '---'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{shifts.length} items</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================= DIALOG FORM ================= */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9', pb: 2 }}>{editingShift ? 'CHỈNH SỬA CA LÀM VIỆC' : 'THÊM CA LÀM VIỆC MỚI'}</DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small"><InputLabel>Cửa Hàng (*)</InputLabel><Select label="Cửa Hàng (*)" value={formData.storeId} onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}>{stores.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl>
              <FormControl fullWidth size="small"><InputLabel>Nhân Viên (*)</InputLabel><Select label="Nhân Viên (*)" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })}>{users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}</Select></FormControl>
            </Box>
            <TextField fullWidth size="small" label="Ngày Làm Việc (*)" type="date" value={formData.shiftDate} onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Giờ Bắt Đầu (*)" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth size="small" label="Giờ Kết Thúc" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField fullWidth size="small" label="Ghi Chú" multiline rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Lưu Ca Làm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};