import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip
} from '@mui/material';
import {
  Delete as DeleteIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, Restore as RestoreIcon
} from '@mui/icons-material';

// Dữ liệu mẫu Đơn bị hủy
const mockCancelledOrders = [
  { no: 1, maHD: 'HD260305', ngayHuy: '06/03/2026 14:20', khachHang: 'Trần Văn Kiên', dienThoai: '0911222333', tongTien: 550000, lyDo: 'Khách đổi ý không mua nữa', nguoiHuy: 'Sale 01', trangThai: 'Đã hủy' },
  { no: 2, maHD: 'WEB012', ngayHuy: '05/03/2026 09:10', khachHang: 'Lê Thảo My', dienThoai: '0933444555', tongTien: 1250000, lyDo: 'Hết hàng trong kho', nguoiHuy: 'Admin', trangThai: 'Đã hủy' },
];

export const CancelledOrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH ĐƠN BỊ HỦY
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã HĐ/Tên KH/Lý do" 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<RestoreIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Khôi phục đơn</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xóa vĩnh viễn</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Drag a column header and drop it here to group by that column</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {['Mã HĐ', 'Ngày Hủy', 'Khách Hàng', 'Điện Thoại', 'Tổng Tiền', 'Lý Do Hủy', 'Người Hủy', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockCancelledOrders.map((row) => (
                  <TableRow key={row.no} hover sx={{ '&:last-child td': { border: 0 }, bgcolor: '#fef2f2' }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', p: 1.5 }}><strike>{row.maHD}</strike></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.ngayHuy}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>{row.khachHang}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.dienThoai}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', p: 1.5 }}>{formatCurrency(row.tongTien)}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#b91c1c', fontStyle: 'italic' }}>{row.lyDo}</Typography>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', fontWeight: 600, p: 1.5 }}>{row.nguoiHuy}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip label={row.trangThai} size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {mockCancelledOrders.length} of {mockCancelledOrders.length} items</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};