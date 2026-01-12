import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { ActivityLog } from '../../types';
import { format } from 'date-fns';

export const ActivityLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  // Mock data - Thay thế bằng API call
  const mockLogs: ActivityLog[] = [
    {
      id: '1',
      userId: 'user-1',
      action: 'CREATE_ORDER',
      entityType: 'Order',
      entityId: 'order-1',
      details: { orderNumber: 'HD001', total: 50000 },
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0',
      createdAt: new Date(),
    },
    {
      id: '2',
      userId: 'user-2',
      action: 'UPDATE_INVENTORY',
      entityType: 'Inventory',
      entityId: 'inv-1',
      details: { productId: 'prod-1', quantity: 100 },
      ipAddress: '192.168.1.2',
      userAgent: 'Firefox/121.0',
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      userId: 'user-1',
      action: 'DELETE_PRODUCT',
      entityType: 'Product',
      entityId: 'prod-2',
      details: { productName: 'Pepsi 330ml' },
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0',
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: '4',
      userId: 'user-3',
      action: 'UPDATE_PRODUCT',
      entityType: 'Product',
      entityId: 'prod-3',
      details: { price: 25000, oldPrice: 20000 },
      ipAddress: '192.168.1.3',
      userAgent: 'Safari/17.0',
      createdAt: new Date(Date.now() - 10800000),
    },
  ];

  const mockUsers = [
    { id: 'user-1', name: 'Nguyễn Văn A', avatar: '' },
    { id: 'user-2', name: 'Trần Thị B', avatar: '' },
    { id: 'user-3', name: 'Lê Văn C', avatar: '' },
  ];

  const getUserName = (userId: string) => {
    return mockUsers.find(u => u.id === userId)?.name || 'Unknown';
  };

  const getUserInitial = (userId: string) => {
    const name = getUserName(userId);
    return name.charAt(0).toUpperCase();
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_ORDER: 'Tạo đơn hàng',
      UPDATE_ORDER: 'Cập nhật đơn hàng',
      DELETE_ORDER: 'Xóa đơn hàng',
      CREATE_PRODUCT: 'Tạo sản phẩm',
      UPDATE_PRODUCT: 'Cập nhật sản phẩm',
      DELETE_PRODUCT: 'Xóa sản phẩm',
      UPDATE_INVENTORY: 'Cập nhật kho',
      IMPORT_INVENTORY: 'Nhập kho',
      EXPORT_INVENTORY: 'Xuất kho',
      TRANSFER_INVENTORY: 'Điều chuyển kho',
      CREATE_USER: 'Tạo người dùng',
      UPDATE_USER: 'Cập nhật người dùng',
      DELETE_USER: 'Xóa người dùng',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return <CheckCircleIcon color="success" />;
    if (action.includes('UPDATE')) return <InfoIcon color="info" />;
    if (action.includes('DELETE')) return <ErrorIcon color="error" />;
    return <InfoIcon />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'info';
    if (action.includes('DELETE')) return 'error';
    return 'default';
  };

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      Order: 'Đơn hàng',
      Product: 'Sản phẩm',
      Inventory: 'Kho',
      User: 'Người dùng',
      Store: 'Cửa hàng',
      Category: 'Danh mục',
      Promotion: 'Khuyến mãi',
    };
    return labels[entityType] || entityType;
  };

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch =
      getActionLabel(log.action).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getEntityTypeLabel(log.entityType).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUserName(log.userId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueActions = Array.from(new Set(mockLogs.map(log => {
    if (log.action.includes('CREATE')) return 'CREATE';
    if (log.action.includes('UPDATE')) return 'UPDATE';
    if (log.action.includes('DELETE')) return 'DELETE';
    return 'OTHER';
  })));

  const uniqueEntities = Array.from(new Set(mockLogs.map(log => log.entityType)));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          Lịch Sử Hoạt Động
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo hành động, entity, người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Loại Hành Động</InputLabel>
                <Select
                  value={actionFilter}
                  label="Loại Hành Động"
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Tất cả</MenuItem>
                  <MenuItem value="CREATE">Tạo mới</MenuItem>
                  <MenuItem value="UPDATE">Cập nhật</MenuItem>
                  <MenuItem value="DELETE">Xóa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Loại Entity</InputLabel>
                <Select
                  value={entityFilter}
                  label="Loại Entity"
                  onChange={(e) => setEntityFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Tất cả</MenuItem>
                  {uniqueEntities.map(entity => (
                    <MenuItem key={entity} value={entity}>
                      {getEntityTypeLabel(entity)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thời Gian</TableCell>
                  <TableCell>Người Thực Hiện</TableCell>
                  <TableCell>Hành Động</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Chi Tiết</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {format(log.createdAt, 'dd/MM/yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(log.createdAt, 'HH:mm:ss')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {getUserInitial(log.userId)}
                        </Avatar>
                        <Typography variant="body2">
                          {getUserName(log.userId)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getActionIcon(log.action)}
                        <Chip
                          label={getActionLabel(log.action)}
                          color={getActionColor(log.action) as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEntityTypeLabel(log.entityType)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={JSON.stringify(log.details, null, 2)}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'help',
                          }}
                        >
                          {JSON.stringify(log.details)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.ipAddress}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.userAgent}
                      </Typography>
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
