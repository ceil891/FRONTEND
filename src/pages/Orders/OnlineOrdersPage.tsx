import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip
} from '@mui/material';
import {
  Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, CheckCircle as ApproveIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';

// Dữ liệu mẫu Đơn hàng Online
const mockOnlineOrders = [
  { no: 1, maHD: 'WEB001', ngayDat: '06/03/2026 10:15', khachHang: 'Nguyễn Văn A', dienThoai: '0988111222', tongTien: 350000, kenhBan: 'Website', donViVC: 'GHTK', trangThai: 'Chờ duyệt' },
  { no: 2, maHD: 'SHOPEE05', ngayDat: '06/03/2026 11:00', khachHang: 'Lê Thị B', dienThoai: '0901234567', tongTien: 1250000, kenhBan: 'Shopee', donViVC: 'SPX', trangThai: 'Đang giao' },
  { no: 3, maHD: 'FB009', ngayDat: '05/03/2026 15:30', khachHang: 'Trần C', dienThoai: '0911333444', tongTien: 85000, kenhBan: 'Facebook', donViVC: 'Ahamove', trangThai: 'Thành công' },
];

export const OnlineOrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  // Render màu sắc Chip trạng thái
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Chờ duyệt': return <Chip label={status} size="small" sx={{ bgcolor: '#fef08a', color: '#854d0e', fontWeight: 600, borderRadius: 1 }} />;
      case 'Đang giao': return <Chip label={status} size="small" sx={{ bgcolor: '#e0f2fe', color: '#075985', fontWeight: 600, borderRadius: 1 }} />;
      case 'Thành công': return <Chip label={status} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, borderRadius: 1 }} />;
      default: return <Chip label={status} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, borderRadius: 1 }} />;
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          ĐƠN HÀNG ONLINE / TMĐT
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã HĐ/Tên KH/SĐT" 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<ApproveIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Duyệt Đơn</Button>
            <Button size="small" variant="contained" startIcon={<ShippingIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Đẩy Vận Đơn</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Phiếu Giao</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Hủy Đơn</Button>
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
                  
                  {['Mã HĐ', 'Ngày Đặt', 'Khách Hàng', 'Điện Thoại', 'Tổng Tiền', 'Kênh Bán', 'ĐV Vận Chuyển', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockOnlineOrders.map((row) => (
                  <TableRow key={row.no} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>{row.maHD}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.ngayDat}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>{row.khachHang}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.dienThoai}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>{formatCurrency(row.tongTien)}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: row.kenhBan === 'Shopee' ? '#ea580c' : row.kenhBan === 'Facebook' ? '#2563eb' : '#475569' }}>
                        {row.kenhBan}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', fontWeight: 600, p: 1.5 }}>{row.donViVC}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      {getStatusChip(row.trangThai)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {mockOnlineOrders.length} of {mockOnlineOrders.length} items</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};