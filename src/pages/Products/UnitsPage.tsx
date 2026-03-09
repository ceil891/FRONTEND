import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Edit as EditIcon, SettingsBackupRestore as RestoreIcon
} from '@mui/icons-material';
import { unitAPI, type BackendDonVi } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const UnitsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [units, setUnits] = useState<BackendDonVi[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BackendDonVi | null>(null);
  const [name, setName] = useState('');
  const { showToast } = useToastStore();

  useEffect(() => {
    void loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const res = await unitAPI.getAll();
      setUnits(res.data || []);
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tải danh sách đơn vị', 'error');
    }
  };

  const filteredUnits = units.filter(u =>
    u.tenDonVi.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenDialog = (unit?: BackendDonVi) => {
    if (unit) {
      setEditingUnit(unit);
      setName(unit.tenDonVi);
    } else {
      setEditingUnit(null);
      setName('');
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Tên đơn vị là bắt buộc', 'warning');
      return;
    }
    try {
      if (editingUnit) {
        await unitAPI.update(editingUnit.donViId, { tenDonVi: name.trim() });
        showToast('Cập nhật đơn vị thành công', 'success');
      } else {
        await unitAPI.create({ tenDonVi: name.trim() });
        showToast('Thêm đơn vị thành công', 'success');
      }
      setOpenDialog(false);
      setName('');
      await loadUnits();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lưu đơn vị', 'error');
    }
  };

  const handleDelete = async (unit: BackendDonVi) => {
    if (!window.confirm(`Xóa đơn vị "${unit.tenDonVi}"?`)) return;
    try {
      await unitAPI.delete(unit.donViId);
      showToast('Xóa đơn vị thành công', 'success');
      await loadUnits();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi xóa đơn vị', 'error');
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          QUẢN LÝ ĐƠN VỊ TÍNH
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Tìm: Mã ĐVT/Tên ĐVT..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}
            >
              Thêm ĐVT
            </Button>
            <Button size="small" variant="contained" startIcon={<RestoreIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Khôi phục</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Danh Sách</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xóa</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Sửa</TableCell>
                  
                  {/* CÁC CỘT DỮ LIỆU */}
                  {['Mã ĐVT', 'Tên Đơn Vị Tính', 'Ghi Chú / Mô Tả', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUnits.map((row, index) => (
                  <TableRow key={row.donViId} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box
                          sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex', mr: 0.5 }}
                          onClick={() => handleOpenDialog(row)}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </Box>
                        <Box
                          sx={{ bgcolor: '#dd4b39', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}
                          onClick={() => handleDelete(row)}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>
                      {row.donViId}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700, p: 1.5 }}>
                      {row.tenDonVi}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5, fontStyle: 'italic' }}>
                      ---
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip
                        label="Sử dụng"
                        size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {filteredUnits.length} đơn vị
             </Typography>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUnit ? 'CẬP NHẬT ĐƠN VỊ' : 'THÊM ĐƠN VỊ MỚI'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Tên đơn vị tính"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};