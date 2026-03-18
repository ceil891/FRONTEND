import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Pagination,
  Checkbox, Chip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon, 
  FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Visibility as ViewIcon, AssignmentReturn as ReturnIcon
} from '@mui/icons-material';

// 👉 1. IMPORT API VÀ TOAST
import { orderAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

// 👉 2. KHAI BÁO TYPE 
export interface BackendHoaDonDTO {
  hoaDonId: number;
  maHoaDon?: string;
  ngayLap: string | Date;
  tenKhachHang?: string;
  dienThoaiKhachHang?: string;
  tamTinh?: number;
  chietKhau?: number;
  tongPhaiThanhToan?: number;
  tenNhanVien?: string;
  tenCuaHang?: string;
  trangThai?: string;
}

export const RetailOrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<BackendHoaDonDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const filtered = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.maHoaDon, r.tenKhachHang, r.dienThoaiKhachHang, r.tenNhanVien, r.tenCuaHang]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw))
    );
  }, [rows, searchQuery]);

  // 👉 3. GỌI API LẤY DANH SÁCH ĐƠN BÁN LẺ
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    orderAPI.query({ channel: 'RETAIL' })
      .then((res) => {
        if (!mounted) return;
        const dataList = res.data.data || res.data || [];
        setRows(dataList);
      })
      .catch((err) => {
        if (mounted) showToast('Lỗi khi tải danh sách đơn bán lẻ', 'error');
        console.error("Lỗi tải đơn bán lẻ:", err);
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
      const res = await orderAPI.exportExcel({ channel: 'RETAIL', keyword: searchQuery.trim() || undefined });
      
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `don_ban_le_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast('Tải Excel thành công!', 'success');
    } catch (error) {
      showToast('Lỗi khi xuất file Excel', 'error');
    }
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          ĐƠN BÁN LẺ TẠI QUẦY
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã HĐ/Tên KH/Điện thoại" 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Tạo Đơn (POS)</Button>
            <Button size="small" variant="contained" startIcon={<ReturnIcon />} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#db8b0b' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Khách Trả Hàng</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Hóa Đơn</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} onClick={downloadExcel} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
            <Button size="small" variant="contained" startIcon={<DeleteIcon />} disabled sx={{ bgcolor: '#dd4b39', '&:hover': { bgcolor: '#d33724' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Hủy HĐ</Button>
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
                  
                  {['Mã HĐ', 'Ngày Bán', 'Khách Hàng', 'Tổng Tiền', 'Giảm Giá', 'Khách Phải Trả', 'Nhân Viên', 'Chi Nhánh', 'Trạng Thái'].map((col) => (
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
                    
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', p: 1.5 }}>{row.maHoaDon ?? `HD${row.hoaDonId}`}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{new Date(row.ngayLap).toLocaleString('vi-VN')}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, p: 1.5 }}>{row.tenKhachHang ?? 'Khách lẻ'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', p: 1.5 }}>{formatCurrency(Number(row.tamTinh ?? 0))}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#dc2626', p: 1.5 }}>{formatCurrency(Number(row.chietKhau ?? 0))}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', p: 1.5 }}>{formatCurrency(Number(row.tongPhaiThanhToan ?? 0))}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.tenNhanVien ?? '-'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569', p: 1.5 }}>{row.tenCuaHang ?? '-'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                      <Chip label={row.trangThai ?? '-'} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, border: 'none', borderRadius: 1 }} />
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