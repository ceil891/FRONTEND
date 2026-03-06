import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, Edit as EditIcon
} from '@mui/icons-material';

const mockSupplierReturns = [
  { no: 1, maPhieu: 'TL260301', ngayTra: '06/03/2026', ncc: 'Công ty Cổ phần Sữa VN', lyDo: 'Hàng cận date', tongTien: 12500000, phuongThuc: 'Trừ công nợ', nguoiLap: 'Admin', trangThai: 'Đã hoàn tất' },
  { no: 2, maPhieu: 'TL260302', ngayTra: '05/03/2026', ncc: 'Đại lý Bánh kẹo ABC', lyDo: 'Hàng móp méo do vận chuyển', tongTien: 3400000, phuongThuc: 'Nhận lại tiền mặt', nguoiLap: 'Kho Hà Nội', trangThai: 'Đang xử lý' },
];

export const ReturnSupplierPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          PHIẾU TRẢ HÀNG NHÀ CUNG CẤP
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã phiếu/Tên NCC..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Lập Phiếu Trả</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Hủy Phiếu</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Phiếu</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
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
                  
                  {['Mã Phiếu', 'Ngày Trả', 'Nhà Cung Cấp', 'Lý Do Trả', 'Tổng Giá Trị', 'Phương Thức Bù Trừ', 'Người Lập', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockSupplierReturns.map((row) => (
                  <TableRow key={row.no} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                        <Box sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>{row.maPhieu}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.ngayTra}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>{row.ncc}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.lyDo}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>{formatCurrency(row.tongTien)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.phuongThuc}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.nguoiLap}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      {row.trangThai === 'Đã hoàn tất' ? 
                        <Chip label={row.trangThai} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                        <Chip label={row.trangThai} size="small" sx={{ bgcolor: '#fef08a', color: '#854d0e', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {mockSupplierReturns.length} of {mockSupplierReturns.length} items</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};