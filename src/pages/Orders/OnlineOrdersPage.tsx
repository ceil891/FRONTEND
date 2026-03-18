import React, { useEffect, useMemo, useState } from 'react';
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

// 👉 1. IMPORT API VÀ TOAST TỪ PROJECT CỦA BẠN
import { orderAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

// 👉 2. KHAI BÁO TYPE ĐỂ TYPESCRIPT KHÔNG BÁO LỖI (Sử dụng lại type đã định nghĩa nếu có)
export interface BackendHoaDonDTO {
  hoaDonId: number;
  maHoaDon?: string;
  ngayLap: string | Date;
  tenKhachHang?: string;
  dienThoaiKhachHang?: string;
  tongPhaiThanhToan?: number;
  kenhBan?: string;
  trangThai?: string;
}

export const OnlineOrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<BackendHoaDonDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const filtered = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.maHoaDon, r.tenKhachHang, r.dienThoaiKhachHang, r.kenhBan]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw))
    );
  }, [rows, searchQuery]);

  // 👉 3. GỌI API LẤY DANH SÁCH ĐƠN ONLINE KHI MỞ TRANG
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    orderAPI.query({ channel: 'ONLINE' }) // Lọc theo kênh bán ONLINE
      .then((res) => {
        if (!mounted) return;
        // Bóc tách dữ liệu an toàn, tuỳ theo cấu trúc BaseResponse của bạn (thường là res.data.data)
        const dataList = res.data.data || res.data || [];
        setRows(dataList);
      })
      .catch((err) => {
        if (mounted) showToast('Lỗi khi tải danh sách đơn Online', 'error');
        console.error("Lỗi tải đơn Online:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
      
    return () => {
      mounted = false;
    };
  }, [showToast]);

  // 👉 4. GỌI API XUẤT EXCEL
  const downloadExcel = async () => {
    try {
      showToast('Đang tạo file Excel...', 'info');
      const res = await orderAPI.exportExcel({ channel: 'ONLINE', keyword: searchQuery.trim() || undefined });
      
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `don_online_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast('Tải Excel thành công!', 'success');
    } catch (error) {
      showToast('Lỗi khi xuất file Excel', 'error');
    }
  };

  // Render màu sắc Chip trạng thái
  const getStatusChip = (status: string) => {
    // Đưa về chữ hoa hoặc thường để so sánh cho chính xác (Tuỳ DB của bạn lưu tiếng Việt hay Tiếng Anh)
    const s = status.toUpperCase();
    if (s.includes('CHỜ DUYỆT') || s === 'PENDING') {
        return <Chip label={status} size="small" sx={{ bgcolor: '#fef08a', color: '#854d0e', fontWeight: 600, borderRadius: 1 }} />;
    }
    if (s.includes('ĐANG GIAO') || s === 'SHIPPING') {
        return <Chip label={status} size="small" sx={{ bgcolor: '#e0f2fe', color: '#075985', fontWeight: 600, borderRadius: 1 }} />;
    }
    if (s.includes('THÀNH CÔNG') || s === 'COMPLETED') {
        return <Chip label={status} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, borderRadius: 1 }} />;
    }
    return <Chip label={status} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, borderRadius: 1 }} />;
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
            <Button size="small" variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Phiếu Giao</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} onClick={downloadExcel} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
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
                {filtered.map((row, idx) => (
                  <TableRow key={row.hoaDonId} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', p: 1.5 }}>{row.maHoaDon ?? `HD${row.hoaDonId}`}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{new Date(row.ngayLap).toLocaleString('vi-VN')}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>{row.tenKhachHang ?? '-'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.dienThoaiKhachHang ?? '-'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>{formatCurrency(Number(row.tongPhaiThanhToan ?? 0))}</TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: row.kenhBan === 'SHOPEE' ? '#ea580c' : row.kenhBan === 'FACEBOOK' ? '#2563eb' : '#475569' }}>
                        {row.kenhBan ?? 'ONLINE'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', fontWeight: 600, p: 1.5 }}>-</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      {getStatusChip(row.trangThai ?? '-')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
               {loading ? 'Đang tải...' : `1 - ${filtered.length} of ${filtered.length} items`}
             </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};