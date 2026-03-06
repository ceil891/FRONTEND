import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, Grid
} from '@mui/material';
import { Inventory as InventoryIcon, Search as SearchIcon, Warning as WarningIcon } from '@mui/icons-material';

const mockSystemInventory = [
  { sku: 'SP001', name: 'Nước Mắm Nam Ngư 500ml', total: 1250, hn: 800, hcm: 450, status: 'NORMAL' },
  { sku: 'SP002', name: 'Mì Hảo Hảo Tôm Chua Cay', total: 45, hn: 15, hcm: 30, status: 'LOW_STOCK' },
  { sku: 'SP003', name: 'Bột Giặt OMO 3Kg', total: 850, hn: 850, hcm: 0, status: 'OVERSTOCK' },
];

export const SystemInventoryReport: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryIcon sx={{ fontSize: 32, color: '#0284c7' }} />
          Báo Cáo Tồn Kho Toàn Hệ Thống
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <TextField
            size="small" placeholder="Tìm theo mã SKU, tên sản phẩm..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: '400px' }, mb: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f0f9ff' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Mã SKU</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên Sản Phẩm</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#0369a1' }}>Tổng Tồn Toàn Hệ Thống</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Tồn Kho Hà Nội</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Tồn Kho HCM</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Cảnh Báo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockSystemInventory.map((row) => (
                  <TableRow key={row.sku} hover>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{row.sku}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={800} fontSize="1.1rem" color="#0284c7">{row.total}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={600} color={row.hn === 0 ? 'error' : 'inherit'}>{row.hn}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={600} color={row.hcm === 0 ? 'error' : 'inherit'}>{row.hcm}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {row.status === 'LOW_STOCK' && <Chip icon={<WarningIcon />} label="Sắp hết hàng" color="error" size="small" />}
                      {row.status === 'OVERSTOCK' && <Chip label="Chênh lệch kho" color="warning" size="small" />}
                      {row.status === 'NORMAL' && <Chip label="Bình thường" color="success" size="small" variant="outlined" />}
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