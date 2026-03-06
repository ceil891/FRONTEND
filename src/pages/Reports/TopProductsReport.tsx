import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, Avatar
} from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';

const mockTopProducts = [
  { rank: 1, name: 'Bánh Trung Thu Kinh Đô', category: 'Bánh kẹo', sold: 1540, revenue: 154000000, stock: 120 },
  { rank: 2, name: 'Nước Ngọt Coca Cola Thùng 24', category: 'Đồ uống', sold: 850, revenue: 161500000, stock: 450 },
  { rank: 3, name: 'Sữa Tươi Vinamilk Lốc 4', category: 'Sữa', sold: 720, revenue: 23040000, stock: 80 },
  { rank: 4, name: 'Gạo ST25 5Kg', category: 'Thực phẩm', sold: 410, revenue: 61500000, stock: 25 },
];

export const TopProductsReport: React.FC = () => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  const maxSold = Math.max(...mockTopProducts.map(p => p.sold));

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrophyIcon sx={{ fontSize: 32, color: '#eab308' }} />
          Top Sản Phẩm Bán Chạy
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '5%' }}>Top</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên Sản Phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Danh Mục</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tồn Kho</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '30%' }}>Số Lượng Đã Bán</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Doanh Thu (VNĐ)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockTopProducts.map((row) => (
                  <TableRow key={row.rank} hover>
                    <TableCell>
                      <Avatar sx={{ width: 32, height: 32, fontWeight: 800, 
                        bgcolor: row.rank === 1 ? '#fef08a' : row.rank === 2 ? '#e2e8f0' : row.rank === 3 ? '#fed7aa' : 'transparent',
                        color: row.rank <= 3 ? '#000' : 'text.secondary'
                      }}>
                        {row.rank}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ bgcolor: '#f1f5f9', display: 'inline-block', px: 1, py: 0.5, borderRadius: 1 }}>{row.category}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={row.stock < 50 ? 'error' : 'inherit'}>{row.stock}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography fontWeight={700}>{row.sold}</Typography>
                        <LinearProgress variant="determinate" value={(row.sold / maxSold) * 100} sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' } }} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={800} color="#16a34a">{formatCurrency(row.revenue)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};