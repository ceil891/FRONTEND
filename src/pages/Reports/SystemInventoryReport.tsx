import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Button,
  Checkbox, Pagination, CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { productAPI, storeAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

export const SystemInventoryReport: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]); // 🟢 State lưu danh sách cửa hàng/kho động
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();

  const formatNumber = (num: number) => new Intl.NumberFormat('vi-VN').format(num || 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 🟢 Gọi song song API Sản phẩm và API Cửa hàng
        const [prodRes, storeRes] = await Promise.all([
          productAPI.getAll(),
          storeAPI.getAll()
        ]);
        
        // Lấy danh sách cửa hàng/khu vực động từ Backend
        const fetchedStores = storeRes.data?.data || storeRes.data || [];
        setStores(fetchedStores);

        const rawProducts = prodRes.data?.data || prodRes.data || [];
        const allVariants: any[] = [];
        let indexCount = 1;

        rawProducts.forEach((p: any) => {
          const variantsList = p.variants || p.productVariants || [];
          
          if (variantsList.length > 0) {
            variantsList.forEach((v: any) => {
              const totalQty = Number(v.quantity || 0);
              
              // 🟢 Bóc tách tồn kho theo từng chi nhánh
              // Giả sử backend trả về mảng inventories: [{storeId: 1, quantity: 50}, {storeId: 2, quantity: 30}]
              const storeStocks: Record<number, number> = {};
              fetchedStores.forEach((st: any) => {
                 const inv = (v.inventories || []).find((i: any) => i.storeId === st.id);
                 storeStocks[st.id] = inv ? Number(inv.quantity) : 0;
              });

              allVariants.push({
                no: indexCount++,
                sku: v.sku || 'Chưa có SKU',
                name: `${p.name || ''} - ${v.variantName || ''}`.trim(),
                unit: p.unitName || 'Đơn vị',
                total: totalQty,
                storeStocks, // Lưu object tồn kho chi tiết
                costPrice: Number(v.costPrice || p.baseCostPrice || 0),
                status: totalQty < 10 ? 'LOW_STOCK' : totalQty > 500 ? 'OVERSTOCK' : 'NORMAL',
              });
            });
          } else if (p.sku || p.name) {
             const totalQty = Number(p.quantity || 0);
             
             const storeStocks: Record<number, number> = {};
             fetchedStores.forEach((st: any) => {
                 const inv = (p.inventories || []).find((i: any) => i.storeId === st.id);
                 storeStocks[st.id] = inv ? Number(inv.quantity) : 0;
             });

             allVariants.push({
                no: indexCount++,
                sku: p.sku || 'Chưa có SKU',
                name: p.name || 'Sản phẩm không tên',
                unit: p.unitName || 'Đơn vị',
                total: totalQty,
                storeStocks,
                costPrice: Number(p.costPrice || p.baseCostPrice || p.price || 0),
                status: totalQty < 10 ? 'LOW_STOCK' : totalQty > 500 ? 'OVERSTOCK' : 'NORMAL',
             });
          }
        });

        setRows(allVariants);
      } catch (error) {
        console.error("Lỗi lấy báo cáo tồn kho:", error);
        setRows([]); 
        showToast('Không thể tải dữ liệu tồn kho', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInventory = rows.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          BÁO CÁO TỒN KHO HỆ THỐNG
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm: Mã SKU/Tên hàng hóa..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <Button size="small" variant="contained" startIcon={<ShippingIcon />} sx={{ bgcolor: '#00a65a', '&:hover': { bgcolor: '#008d4c' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => showToast('Tính năng đang phát triển', 'info')}>Điều Chuyển Kho</Button>
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => window.print()}>In Báo Cáo</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => showToast('Đang xuất báo cáo Excel...', 'info')}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Tổng quan tồn kho tại các chi nhánh và cảnh báo nhập hàng</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No.</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 40, p: 0 }} align="center"><Checkbox size="small" /></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 50, p: 1, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} align="center">Xem</TableCell>
                  
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: '10%' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Mã SKU <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /></Box></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: '25%' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Tên Sản Phẩm <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /></Box></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: '5%' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>ĐVT <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /></Box></TableCell>
                  
                  {/* 🟢 CỘT CHI NHÁNH ĐƯỢC TẠO ĐỘNG TỪ API 🟢 */}
                  {stores.map((st) => (
                    <TableCell key={st.id} align="right" sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: '10%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {st.name} <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} />
                      </Box>
                    </TableCell>
                  ))}

                  <TableCell align="right" sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: '10%' }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Tổng Tồn <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /></Box></TableCell>
                  <TableCell align="right" sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: '15%' }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Giá Trị Tồn <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /></Box></TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, width: '10%' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Cảnh Báo <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /></Box></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={11} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : filteredInventory.length === 0 ? (
                   <TableRow><TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.secondary' }}>Không có dữ liệu tồn kho hệ thống</TableCell></TableRow>
                ) : filteredInventory.map((row) => (
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
                    
                    {/* 🟢 RENDER DỮ LIỆU TỒN KHO TỪNG CHI NHÁNH ĐỘNG 🟢 */}
                    {stores.map((st) => (
                       <TableCell key={st.id} align="right" sx={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500, color: row.storeStocks[st.id] === 0 ? '#cbd5e1' : '#475569' }}>
                         {formatNumber(row.storeStocks[st.id] || 0)}
                       </TableCell>
                    ))}
                    
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
               1 - {filteredInventory.length} của {filteredInventory.length} sản phẩm
             </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};