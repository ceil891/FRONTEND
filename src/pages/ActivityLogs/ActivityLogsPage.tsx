import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Chip, MenuItem,
  FormControl, InputLabel, Select, Grid, Avatar, Tooltip, TablePagination, CircularProgress
} from '@mui/material';
import {
  History as HistoryIcon, Search as SearchIcon,
  CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon
} from '@mui/icons-material';
import { ActivityLog } from '../../types';
import { format } from 'date-fns';
import { activityLogAPI, BackendActivityLog } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

// ✅ Cố định danh sách Entity thay vì lấy từ logs hiện tại (tránh lỗi filter bị thiếu)
const ENTITY_TYPES = ['Order', 'Product', 'Inventory', 'User', 'Store', 'Category', 'Promotion'];

export const ActivityLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // State riêng cho debounce
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { showToast } = useToastStore();

  // ✅ DEBOUNCE SEARCH: Chờ 500ms sau khi ngừng gõ mới cập nhật từ khóa tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset về trang 1 khi tìm kiếm
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load lại data khi page, filter hoặc từ khóa (đã debounce) thay đổi
  useEffect(() => {
    void loadLogs();
  }, [page, actionFilter, entityFilter, debouncedSearch]);

  const mapBackendToLog = (log: BackendActivityLog): ActivityLog => ({
    id: log.id.toString(),
    userId: log.userId.toString(),
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details || {},
    ipAddress: log.ipAddress || 'Unknown',
    userAgent: log.userAgent || 'Unknown',
    createdAt: new Date(log.createdAt),
  });

  const loadLogs = async () => {
    try {
      setLoading(true);
      const resp = await activityLogAPI.getAll(
        undefined,
        actionFilter === 'ALL' ? undefined : actionFilter,
        entityFilter === 'ALL' ? undefined : entityFilter,
        debouncedSearch || undefined, // Dùng từ khóa đã debounce
        page,
        size
      );
      
      if (resp.data.success && resp.data.data) {
        const pageData = resp.data.data;
        setLogs(pageData.content.map(mapBackendToLog));
        setTotalElements(pageData.totalElements);
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi tải nhật ký hoạt động', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_ORDER: 'Tạo đơn hàng', UPDATE_ORDER: 'Cập nhật đơn', DELETE_ORDER: 'Xóa đơn hàng',
      CREATE_PRODUCT: 'Tạo sản phẩm', UPDATE_PRODUCT: 'Sửa sản phẩm', DELETE_PRODUCT: 'Xóa sản phẩm',
      UPDATE_INVENTORY: 'Cập nhật tồn kho', IMPORT_INVENTORY: 'Nhập kho', EXPORT_INVENTORY: 'Xuất kho',
      LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('IMPORT') || action === 'LOGIN') return <CheckCircleIcon color="success" fontSize="small" />;
    if (action.includes('UPDATE') || action.includes('EXPORT')) return <InfoIcon color="info" fontSize="small" />;
    if (action.includes('DELETE') || action.includes('FAIL')) return <ErrorIcon color="error" fontSize="small" />;
    return <InfoIcon fontSize="small" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('IMPORT') || action === 'LOGIN') return 'success';
    if (action.includes('UPDATE') || action.includes('EXPORT')) return 'info';
    if (action.includes('DELETE') || action.includes('FAIL')) return 'error';
    return 'default';
  };

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
          Nhật Ký Hoạt Động (Audit Logs)
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth size="small"
                placeholder="Tìm kiếm chi tiết (VD: mã đơn, tên)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại Hành Động</InputLabel>
                <Select value={actionFilter} label="Loại Hành Động" onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}>
                  <MenuItem value="ALL">Tất cả hành động</MenuItem>
                  <MenuItem value="CREATE">Chỉ Tạo mới / Nhập</MenuItem>
                  <MenuItem value="UPDATE">Chỉ Cập nhật</MenuItem>
                  <MenuItem value="DELETE">Chỉ Xóa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Thực thể (Entity)</InputLabel>
                <Select value={entityFilter} label="Thực thể (Entity)" onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}>
                  <MenuItem value="ALL">Tất cả thực thể</MenuItem>
                  {ENTITY_TYPES.map(entity => (
                    <MenuItem key={entity} value={entity}>{entity}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID Người Dùng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hành Động</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thực Thể</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Chi Tiết (Dữ liệu cũ/mới)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thiết bị & IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      Không tìm thấy lịch sử hoạt động nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#1e293b">
                          {format(log.createdAt, 'dd/MM/yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(log.createdAt, 'HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                            U
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            User ID: {log.userId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getActionIcon(log.action)}
                          <Chip label={getActionLabel(log.action)} color={getActionColor(log.action) as any} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.entityType} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500 }} />
                        {log.entityId && <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>ID: {log.entityId}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={<pre style={{ margin: 0, fontSize: '11px' }}>{JSON.stringify(log.details, null, 2)}</pre>} arrow placement="top">
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: '#0ea5e9', bgcolor: '#f0f9ff', px: 1, py: 0.5, borderRadius: 1 }}>
                            {JSON.stringify(log.details)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                          {log.ipAddress}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.userAgent}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* ✅ ĐÃ THÊM PHÂN TRANG (PAGINATION) */}
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={size}
            rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên tổng ${count}`}
            sx={{ borderTop: '1px solid #e2e8f0' }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};