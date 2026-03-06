import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, Edit as EditIcon,
  AccountBalanceWallet as DebtIcon
} from '@mui/icons-material';

// Dữ liệu mẫu Phiếu Nhập
const mockImports = [
  { no: 1, maPhieu: 'PN260301', ngayNhap: '05/03/2026', ncc: 'Công ty TNHH Nước Giải Khát', tongTien: 15000000, daTra: 15000000, congNo: 0, nguoiLap: 'Admin', trangThai: 'Đã thanh toán' },
  { no: 2, maPhieu: 'PN260302', ngayNhap: '06/03/2026', ncc: 'Đại lý Bánh Kẹo Hùng Phát', tongTien: 24500000, daTra: 10000000, congNo: 14500000, nguoiLap: 'Kế toán 01', trangThai: 'Ghi nợ' },
  { no: 3, maPhieu: 'PN260303', ngayNhap: '06/03/2026', ncc: 'Nhà phân phối Trái Cây', tongTien: 3200000, daTra: 3200000, congNo: 0, nguoiLap: 'Kho Hà Nội', trangThai: 'Đã thanh toán' },
];

export const ImportInventoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const filteredImports = mockImports.filter(p => 
    p.maPhieu.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.ncc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          DANH SÁCH PHIẾU NHẬP HÀNG
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã phiếu/Tên NCC..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Lập Phiếu Nhập</Button>
            <Button size="small" variant="contained" startIcon={<DebtIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thanh Toán Nợ</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Phiếu</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Hủy Phiếu</Button>
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
                  
                  {/* CÁC CỘT PHIẾU NHẬP */}
                  {['Mã Phiếu', 'Ngày Nhập', 'Nhà Cung Cấp', 'Tổng Tiền', 'Đã Thanh Toán', 'Công Nợ', 'Người Lập', 'Trạng Thái'].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredImports.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>Không có dữ liệu phiếu nhập</TableCell>
                   </TableRow>
                ) : (
                  filteredImports.map((row) => (
                    <TableRow key={row.no} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                      
                      {/* Cột Thao tác */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Xem chi tiết">
                            <ViewIcon sx={{ fontSize: 14 }} />
                          </Box>
                          <Box sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }} title="Sửa phiếu">
                            <EditIcon sx={{ fontSize: 14 }} />
                          </Box>
                        </Box>
                      </TableCell>
                      
                      {/* Dữ liệu */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, fontWeight: 600, color: '#0284c7' }}>{row.maPhieu}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#475569' }}>{row.ngayNhap}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#0f172a', fontWeight: 600 }}>{row.ncc}</TableCell>
                      
                      {/* Cột Số Tiền */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, fontWeight: 700 }}>{formatCurrency(row.tongTien)}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#16a34a', fontWeight: 600 }}>{formatCurrency(row.daTra)}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: row.congNo > 0 ? '#dc2626' : '#475569', fontWeight: row.congNo > 0 ? 700 : 500 }}>
                        {formatCurrency(row.congNo)}
                      </TableCell>
                      
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5, color: '#475569' }}>{row.nguoiLap}</TableCell>
                      
                      {/* Trạng Thái */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        {row.trangThai === 'Đã thanh toán' ? 
                          <Chip label={row.trangThai} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                          <Chip label={row.trangThai} size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {filteredImports.length} of {filteredImports.length} items</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};