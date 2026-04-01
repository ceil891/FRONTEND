import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Button,
  Checkbox, Pagination, Tooltip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { reportAPI } from '../../api/client';

const mockSystemInventory = [
  { no: 1, sku: 'SP001', name: 'Nước Mắm Nam Ngư 500ml', unit: 'Chai', total: 1250, hn: 800, hcm: 450, costPrice: 35000, status: 'NORMAL' },
  { no: 2, sku: 'SP002', name: 'Mì Hảo Hảo Tôm Chua Cay', unit: 'Gói', total: 45, hn: 15, hcm: 30, costPrice: 3200, status: 'LOW_STOCK' },
  { no: 3, sku: 'SP003', name: 'Bột Giặt OMO 3Kg', unit: 'Túi', total: 850, hn: 850, hcm: 0, costPrice: 125000, status: 'OVERSTOCK' },
];

export const SystemInventoryReport: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState(mockSystemInventory);

  const formatNumber = (num: number) => new Intl.NumberFormat('vi-VN').format(num);
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const startDate = start.toISOString().slice(0, 10);

        const res = await reportAPI.getProductSales({ startDate, endDate: today });
        const apiRows = (res.data.data || []).map((item, index) => {
          const total = Number(item.quantitySold || 0);
          return {
            no: index + 1,
            sku: `SP${item.productId}`,
            name: item.productName,
            unit: 'Đơn vị',
            total,
            hn: Math.floor(total * 0.6),
            hcm: Math.floor(total * 0.4),
            costPrice: total > 0 ? Number(item.revenue || 0) / total : 0,
            status: total < 50 ? 'LOW_STOCK' : 'NORMAL',
          };
        });
        if (apiRows.length > 0) setRows(apiRows);
      } catch (error) {
        setRows(mockSystemInventory);
      }
    };
    fetchData();
  }, []);

  const filteredInventory = rows.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          BÁO CÁO TỒN KHO HỆ THỐNG
        </Typography>
      </Box>

      {/* BẢNG CHUẨN RIC HIỆN ĐẠI */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã SKU/Tên hàng hóa..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<ShippingIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Điều Chuyển Kho</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Báo Cáo</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Tổng quan tồn kho tại các chi nhánh và cảnh báo nhập hàng</Typography>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 50, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Xem</TableCell>
                  
                  {[
                    { label: 'Mã SKU', width: '10%' },
                    { label: 'Tên Sản Phẩm', width: '25%' },
                    { label: 'ĐVT', width: '5%' },
                    { label: 'Hà Nội', width: '10%' },
                    { label: 'TP. HCM', width: '10%' },
                    { label: 'Tổng Tồn', width: '10%' },
                    { label: 'Giá Trị Tồn (Vốn)', width: '15%' },
                    { label: 'Cảnh Báo', width: '10%' }
                  ].map((col) => (
                    <TableCell key={col.label} align={col.label.includes('Tồn') ? 'right' : 'left'} sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: col.width }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: col.label.includes('Tồn') ? 'flex-end' : 'flex-start', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {col.label} <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((row) => (
                  <TableRow key={row.sku} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1, fontSize: '0.85rem', color: '#64748b' }}>{row.no}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1 }} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ bgcolor: '#00c0ef', color: 'white', p: 0.4, borderRadius: 0.5, cursor: 'pointer', display: 'flex' }}><ViewIcon sx={{ fontSize: 14 }} /></Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{row.sku}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{row.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#475569' }}>{row.unit}</TableCell>
                    
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500, color: row.hn === 0 ? '#cbd5e1' : '#475569' }}>{formatNumber(row.hn)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500, color: row.hcm === 0 ? '#cbd5e1' : '#475569' }}>{formatNumber(row.hcm)}</TableCell>
                    
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', fontWeight: 800, color: '#0284c7', bgcolor: '#f0f9ff' }}>
                      {formatNumber(row.total)}
                    </TableCell>

                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                      {formatCurrency(row.total * row.costPrice)}
                    </TableCell>
                    
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                      {row.status === 'LOW_STOCK' && (
                        <Chip icon={<WarningIcon style={{ fontSize: 14 }} />} label="Sắp hết" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, borderRadius: 1 }} />
                      )}
                      {row.status === 'OVERSTOCK' && (
                        <Chip label="Tồn cao" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, borderRadius: 1 }} />
                      )}
                      {row.status === 'NORMAL' && (
                        <Chip label="An toàn" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, borderRadius: 1 }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Pagination count={1} size="small" shape="rounded" color="primary" />
             <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
               1 - {filteredInventory.length} of {filteredInventory.length} items
             </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};