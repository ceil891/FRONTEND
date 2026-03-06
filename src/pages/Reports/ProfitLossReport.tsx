import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { AccountBalanceWallet as ProfitIcon } from '@mui/icons-material';

const mockProfitLoss = [
  { group: '1. Doanh Thu', items: [{ name: 'Doanh thu bán hàng', hn: 500000000, hcm: 420000000 }] },
  { group: '2. Giá Vốn', items: [{ name: 'Giá vốn hàng bán (COGS)', hn: -300000000, hcm: -250000000 }] },
  { group: '3. Lợi Nhuận Gộp', items: [{ name: 'Lợi Nhuận Gộp', hn: 200000000, hcm: 170000000 }], isTotal: true },
  { group: '4. Chi Phí Vận Hành', items: [
      { name: 'Chi phí mặt bằng', hn: -50000000, hcm: -60000000 },
      { name: 'Chi phí nhân sự', hn: -40000000, hcm: -45000000 },
      { name: 'Chi phí Marketing', hn: -15000000, hcm: -20000000 },
      { name: 'Chi phí điện nước & khác', hn: -5000000, hcm: -6000000 }
  ] },
  { group: '5. LỢI NHUẬN RÒNG (NET PROFIT)', items: [{ name: 'LỢI NHUẬN RÒNG', hn: 90000000, hcm: 39000000 }], isFinal: true },
];

export const ProfitLossReport: React.FC = () => {
  const [month, setMonth] = useState('2026-03');
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ProfitIcon sx={{ fontSize: 32, color: '#be123c' }} />
          Báo Cáo Lãi Lỗ (P&L) Chi Nhánh
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
          <InputLabel>Kỳ Báo Cáo</InputLabel>
          <Select value={month} label="Kỳ Báo Cáo" onChange={(e) => setMonth(e.target.value)}>
            <MenuItem value="2026-03">Tháng 03/2026</MenuItem>
            <MenuItem value="2026-02">Tháng 02/2026</MenuItem>
            <MenuItem value="2026-01">Tháng 01/2026</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '1rem', width: '40%' }}>Chỉ Tiêu Tài Chính</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#166534' }}>Chi Nhánh Hà Nội</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#1d4ed8' }}>Chi Nhánh HCM</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#be123c' }}>Tổng Cộng Toàn Chuỗi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockProfitLoss.map((section, idx) => (
                  <React.Fragment key={idx}>
                    {/* Dòng Tiêu đề nhóm */}
                    {!section.isTotal && !section.isFinal && (
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 700, color: '#475569', py: 1.5 }}>{section.group}</TableCell>
                      </TableRow>
                    )}
                    {/* Các dòng chi tiết */}
                    {section.items.map((item, i) => (
                      <TableRow key={i} sx={{ 
                        bgcolor: section.isFinal ? '#fef2f2' : section.isTotal ? '#f0fdf4' : 'inherit',
                      }}>
                        <TableCell sx={{ pl: section.isTotal || section.isFinal ? 2 : 5, fontWeight: section.isTotal || section.isFinal ? 800 : 500, color: section.isFinal ? '#be123c' : 'inherit', fontSize: section.isFinal ? '1.1rem' : '1rem' }}>
                          {item.name}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: section.isTotal || section.isFinal ? 700 : 500, color: item.hn < 0 ? '#dc2626' : 'inherit' }}>
                          {formatCurrency(item.hn)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: section.isTotal || section.isFinal ? 700 : 500, color: item.hcm < 0 ? '#dc2626' : 'inherit' }}>
                          {formatCurrency(item.hcm)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: (item.hn + item.hcm) < 0 ? '#dc2626' : section.isFinal ? '#be123c' : '#0f172a', fontSize: section.isFinal ? '1.1rem' : '1rem' }}>
                          {formatCurrency(item.hn + item.hcm)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};