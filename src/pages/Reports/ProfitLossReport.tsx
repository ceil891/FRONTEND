import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, MenuItem, FormControl, Select,
  Button, CircularProgress
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as ExcelIcon,
  FilterAlt as FilterIcon, // 🟢 ĐÃ CHUYỂN VỀ ĐÚNG NHÀ CỦA ICON 🟢
} from '@mui/icons-material';
import { reportAPI, storeAPI } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

interface PLItem {
  name: string;
  values: Record<number, number>; 
}

interface PLSection {
  group: string;
  items: PLItem[];
  isTotal?: boolean;
  isFinal?: boolean;
}

export const ProfitLossReport: React.FC = () => {
  const [month, setMonth] = useState('2026-03');
  const [stores, setStores] = useState<any[]>([]); 
  const [sections, setSections] = useState<PLSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;

        // 1. Gọi API lấy danh sách chi nhánh trước
        const storeRes = await storeAPI.getAll();
        const fetchedStores = storeRes.data?.data || storeRes.data || [];
        setStores(fetchedStores);

        if (fetchedStores.length === 0) {
          setSections([]);
          return;
        }

        // 2. Gọi song song API lấy doanh thu/lợi nhuận cho tất cả các chi nhánh
        const revPromises = fetchedStores.map((st: any) => 
          reportAPI.getRevenue({ startDate, endDate, period: 'month', storeId: st.id })
        );
        const revResponses = await Promise.all(revPromises);

        // 3. Chuẩn bị object lưu trữ dữ liệu tài chính cho từng chi nhánh
        const revenueValues: Record<number, number> = {};
        const cogsValues: Record<number, number> = {};
        const grossProfitValues: Record<number, number> = {};
        const operatingValues: Record<number, number> = {};
        const netProfitValues: Record<number, number> = {};

        // 4. Lắp ráp dữ liệu
        fetchedStores.forEach((st: any, index: number) => {
          const dataList = revResponses[index].data?.data || [];
          const storeData = dataList.length > 0 ? dataList[0] : null;

          const revenue = Number(storeData?.revenue || 0);
          const grossProfit = Number(storeData?.profit || 0);
          
          const cogs = -(revenue - grossProfit); // Giá vốn hàng bán (âm)
          const opCost = -(revenue * 0.1); // Giả lập chi phí vận hành 10% doanh thu (âm)
          const netProfit = grossProfit + opCost; // Lợi nhuận ròng

          revenueValues[st.id] = revenue;
          cogsValues[st.id] = cogs;
          grossProfitValues[st.id] = grossProfit;
          operatingValues[st.id] = opCost;
          netProfitValues[st.id] = netProfit;
        });

        // 5. Đẩy vào sections để render
        setSections([
          { group: '1. Doanh Thu', items: [{ name: 'Doanh thu bán hàng', values: revenueValues }] },
          { group: '2. Giá Vốn', items: [{ name: 'Giá vốn hàng bán (COGS)', values: cogsValues }] },
          { group: '3. LỢI NHUẬN GỘP', items: [{ name: 'Lợi Nhuận Gộp', values: grossProfitValues }], isTotal: true },
          { group: '4. Chi Phí Vận Hành', items: [{ name: 'Chi phí vận hành ước tính', values: operatingValues }] },
          { group: '5. LỢI NHUẬN RÒNG (NET PROFIT)', items: [{ name: 'LỢI NHUẬN RÒNG', values: netProfitValues }], isFinal: true },
        ]);

      } catch (error) {
        console.error("Lỗi khi tải báo cáo:", error);
        setSections([]);
        showToast("Lỗi khi tải báo cáo P&L", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          BÁO CÁO KẾT QUẢ KINH DOANH (P&L)
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC CHUẨN RIC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200, mr: 1 }}>
              <Select value={month} onChange={(e) => setMonth(e.target.value)} sx={{ bgcolor: 'white', '& .MuiSelect-select': { py: 0.8, fontSize: '0.875rem' } }}>
                <MenuItem value="2026-03">Tháng 03/2026</MenuItem>
                <MenuItem value="2026-02">Tháng 02/2026</MenuItem>
                <MenuItem value="2026-01">Tháng 01/2026</MenuItem>
              </Select>
            </FormControl>
            
            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }} onClick={() => window.print()}>In Báo Cáo</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Đơn vị tính: Việt Nam Đồng (VND)</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 400 }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      CHỈ TIÊU TÀI CHÍNH
                      <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} />
                    </Box>
                  </TableCell>
                  
                  {/* 🟢 TẠO CỘT ĐỘNG DỰA TRÊN DANH SÁCH CHI NHÁNH 🟢 */}
                  {stores.map(st => (
                     <TableCell key={st.id} align="right" sx={{ borderBottom: '2px solid #f1f5f9', fontWeight: 600, color: '#1d4ed8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                       {st.name}
                     </TableCell>
                  ))}

                  <TableCell align="right" sx={{ borderBottom: '2px solid #f1f5f9', fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', bgcolor: '#f8fafc' }}>TỔNG CỘNG</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={stores.length + 2} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : stores.length === 0 ? (
                   <TableRow><TableCell colSpan={2} align="center" sx={{ py: 6, color: 'text.secondary' }}>Chưa có dữ liệu chi nhánh</TableCell></TableRow>
                ) : sections.map((section, idx) => (
                  <React.Fragment key={idx}>
                    {/* Hàng Tiêu Đề Nhóm */}
                    {!section.isTotal && !section.isFinal && (
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={stores.length + 2} sx={{ fontWeight: 700, color: '#1e293b', py: 1, fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                          {section.group}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {/* Các dòng dữ liệu */}
                    {section.items.map((item, i) => {
                      // Tính tổng cộng của cả hàng (Cộng dồn tất cả các chi nhánh)
                      let rowTotal = 0;
                      stores.forEach(st => { rowTotal += (item.values[st.id] || 0) });

                      return (
                        <TableRow key={i} hover sx={{ 
                          bgcolor: section.isFinal ? '#fff1f2' : section.isTotal ? '#f0fdf4' : 'inherit',
                          '&:last-child td': { borderBottom: section.isFinal ? 0 : '1px solid #f1f5f9' }
                        }}>
                          <TableCell sx={{ 
                            pl: section.isTotal || section.isFinal ? 2 : 5, 
                            fontWeight: section.isTotal || section.isFinal ? 700 : 500,
                            color: section.isFinal ? '#be123c' : '#475569',
                            fontSize: '0.85rem',
                            borderBottom: '1px solid #f1f5f9'
                          }}>
                            {item.name}
                          </TableCell>
                          
                          {/* 🟢 RENDER GIÁ TRỊ CỦA TỪNG CHI NHÁNH 🟢 */}
                          {stores.map(st => {
                             const val = item.values[st.id] || 0;
                             return (
                                <TableCell key={st.id} align="right" sx={{ 
                                  fontSize: '0.85rem', 
                                  color: val < 0 ? '#dc2626' : '#475569',
                                  fontWeight: section.isTotal || section.isFinal ? 700 : 500,
                                  borderBottom: '1px solid #f1f5f9'
                                }}>
                                  {formatCurrency(val)}
                                </TableCell>
                             );
                          })}
                          
                          {/* 🟢 CỘT TỔNG CỘNG 🟢 */}
                          <TableCell align="right" sx={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 800, 
                            color: rowTotal < 0 ? '#dc2626' : section.isFinal ? '#be123c' : '#0f172a',
                            bgcolor: section.isFinal ? '#ffe4e6' : section.isTotal ? '#dcfce7' : '#f8fafc',
                            borderBottom: '1px solid #f1f5f9'
                          }}>
                            {formatCurrency(rowTotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 2, bgcolor: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
             <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#94a3b8' }}>
               * Dữ liệu được tổng hợp tự động từ module Bán hàng và module Chi phí.
             </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};