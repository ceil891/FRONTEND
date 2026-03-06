import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  QrCode as QrCodeIcon, FileUpload as ImportIcon, FileDownload as ExcelIcon, 
  PictureAsPdf as PdfIcon, CheckCircleOutline as CheckCircleIcon,
  Edit as EditIcon, SwapHoriz as TransferIcon, FilterAlt as FilterIcon,
  Stars as StarsIcon
} from '@mui/icons-material';

// Dữ liệu mẫu bám sát thuộc tính của bạn
const mockCustomers = [
  { no: 1, khuVuc: 'Miền Bắc', nhom: 'SILVER', maKH: 'KL', tenToChuc: 'Khách lẻ', diaChi: 'Hà Nội', dienThoai: '0988123123', email: '(())', nhanVien: 'Admin', coTheDatHang: '0' },
  { no: 2, khuVuc: 'Hà Nội', nhom: 'DIAMOND', maKH: 'KH001', tenToChuc: 'Công ty ABC', diaChi: 'Cầu Giấy', dienThoai: '0901234567', email: 'abc@gmail.com', nhanVien: 'Admin', coTheDatHang: '1' },
];

export const CustomersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleToolbarClick = (action: string) => {
    console.log(`Thực hiện: ${action}`);
  };

  // Hàm lấy màu sắc cho Chip Nhóm Khách Hàng theo UI hiện đại
  const getTierStyle = (tier: string) => {
    switch(tier) {
      case 'DIAMOND': return { label: 'Kim Cương', color: '#2563eb', bg: '#eff6ff' };
      case 'GOLD': return { label: 'Vàng', color: '#d97706', bg: '#fef3c7' };
      case 'SILVER': return { label: 'Bạc', color: '#475569', bg: '#f1f5f9' };
      default: return { label: 'Đồng', color: '#c2410c', bg: '#ffedd5' };
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          KHÁCH HÀNG
        </Typography>
      </Box>

      {/* BẢNG DỮ LIỆU + TOOLBAR (UI PHẲNG HIỆN ĐẠI) */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" 
              placeholder="Tìm: Gõ mã/tên/điện thoại" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleToolbarClick('Thêm')} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Thêm</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} onClick={() => handleToolbarClick('Xóa')} sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xóa</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} onClick={() => handleToolbarClick('Print')} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Print</Button>
            <Button size="small" variant="contained" startIcon={<QrCodeIcon />} onClick={() => handleToolbarClick('Print QRCode')} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Print QRCode</Button>
            <Button size="small" variant="contained" startIcon={<ImportIcon />} onClick={() => handleToolbarClick('Import')} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Import</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} onClick={() => handleToolbarClick('Xuất Excel')} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Excel</Button>
            <Button size="small" variant="contained" startIcon={<PdfIcon />} onClick={() => handleToolbarClick('Xuất PDF')} sx={{ bgcolor: '#00c0ef', '&:hover': { bgcolor: '#00acd6' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>PDF</Button>
            <Button size="small" variant="contained" startIcon={<CheckCircleIcon />} onClick={() => handleToolbarClick('Sử dụng')} sx={{ bgcolor: '#39cccc', '&:hover': { bgcolor: '#33b8b8' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Sử dụng/Không</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Drag a column header and drop it here to group by that column
            </Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center">
                    <Checkbox size="small" />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 70, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Thao Tác</TableCell>
                  
                  {/* CÁC CỘT THUỘC TÍNH (Đã bỏ Tên Khách Hàng, chỉ giữ Tên tổ chức như ảnh) */}
                  {[
                    'Khu vực', 'Nhóm', 'Mã KH', 'Tên tổ chức', 'Địa chỉ', 
                    'Điện thoại', 'Email', 'Nhân viên phụ trách', 'Có thể Đặt hàng'
                  ].map((col) => (
                    <TableCell key={col} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col} <FilterIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockCustomers.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.secondary' }}>Không có dữ liệu</TableCell>
                   </TableRow>
                ) : (
                  mockCustomers.map((row) => {
                    const tierStyle = getTierStyle(row.nhom);
                    
                    return (
                      <TableRow key={row.no} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center">
                          <Checkbox size="small" />
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Box sx={{ bgcolor: '#00a65a', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><EditIcon sx={{ fontSize: 14 }} /></Box>
                            <Box sx={{ bgcolor: '#f39c12', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><TransferIcon sx={{ fontSize: 14 }} /></Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5 }}>{row.khuVuc}</TableCell>
                        
                        {/* Nhóm (Render dạng Chip UI hiện đại) */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                          {row.nhom ? (
                            <Chip 
                              icon={<StarsIcon style={{ color: tierStyle.color, fontSize: '16px' }} />} 
                              label={tierStyle.label} 
                              size="small"
                              sx={{ bgcolor: tierStyle.bg, color: tierStyle.color, fontWeight: 600, borderRadius: 1.5 }} 
                            />
                          ) : '---'}
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', p: 1.5 }}>{row.maKH}</TableCell>
                        
                        {/* Tên Tổ Chức (Bỏ Avatar tròn, chỉ để text như bình thường) */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>
                          {row.tenToChuc}
                        </TableCell>

                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.diaChi}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.dienThoai}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.email}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.nhanVien}</TableCell>
                        
                        {/* Có thể đặt hàng (Hiển thị dạng trạng thái đẹp mắt) */}
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                          {row.coTheDatHang === '1' ? 
                            <Chip label="Có" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} /> : 
                            <Chip label="Không" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: 'none', borderRadius: 1 }} />
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             {mockCustomers.length > 0 && <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>1 - {mockCustomers.length} of {mockCustomers.length} items</Typography>}
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};