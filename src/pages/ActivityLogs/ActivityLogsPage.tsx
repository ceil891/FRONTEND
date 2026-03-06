import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Chip, MenuItem,
  FormControl, InputLabel, Select, Grid, Avatar, Tooltip, TablePagination, 
  CircularProgress, Button, Checkbox
} from '@mui/material';
import {
  History as HistoryIcon, Search as SearchIcon,
  CheckCircle as CheckCircleIcon, Warning as WarningIcon, 
  Error as ErrorIcon, Info as InfoIcon,
  Print as PrintIcon, FileDownload as ExcelIcon, FilterAlt as FilterIcon,
  Terminal as TerminalIcon, Devices as DeviceIcon
} from '@mui/icons-material';
import { ActivityLog } from '../../types';
import { format } from 'date-fns';
import { activityLogAPI, BackendActivityLog } from '../../api/client';
import { useToastStore } from '../../store/toastStore';

const ENTITY_TYPES = ['Order', 'Product', 'Inventory', 'User', 'Store', 'Category', 'Promotion'];

export const ActivityLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { showToast } = useToastStore();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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
        debouncedSearch || undefined,
        page,
        size
      );
      
      if (resp.data.success && resp.data.data) {
        const pageData = resp.data.data;
        setLogs(pageData.content.map(mapBackendToLog));
        setTotalElements(pageData.totalElements);
      }
    } catch (err: any) {
      showToast('Lỗi khi tải nhật ký hoạt động', 'error');
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

  const getActionInfo = (action: string) => {
    if (action.includes('CREATE') || action.includes('IMPORT') || action === 'LOGIN') 
      return { icon: <CheckCircleIcon fontSize="inherit" />, color: 'success', bg: '#dcfce7', text: '#166534' };
    if (action.includes('UPDATE') || action.includes('EXPORT')) 
      return { icon: <InfoIcon fontSize="inherit" />, color: 'info', bg: '#e0f2fe', text: '#0369a1' };
    if (action.includes('DELETE') || action.includes('FAIL')) 
      return { icon: <ErrorIcon fontSize="inherit" />, color: 'error', bg: '#fee2e2', text: '#991b1b' };
    return { icon: <InfoIcon fontSize="inherit" />, color: 'default', bg: '#f1f5f9', text: '#475569' };
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400, color: '#333', textTransform: 'uppercase' }}>
          NHẬT KÝ HỆ THỐNG (AUDIT LOGS)
        </Typography>
      </Box>

      {/* BẢNG CHUẨN RIC HIỆN ĐẠI */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          
          {/* THANH TOOLBAR ĐA MÀU SẮC */}
          <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <TextField 
              size="small" placeholder="Tìm kiếm nhanh nội dung log..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 280, bgcolor: 'white', mr: 1, '& .MuiInputBase-input': { py: 0.8, fontSize: '0.875rem' } }}
            />
            
            <FormControl size="small" sx={{ minWidth: 160, mr: 1 }}>
              <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }} sx={{ bgcolor: 'white', '& .MuiSelect-select': { py: 0.8, fontSize: '0.875rem' } }}>
                <MenuItem value="ALL">Tất cả hành động</MenuItem>
                <MenuItem value="CREATE">Tạo mới / Nhập</MenuItem>
                <MenuItem value="UPDATE">Cập nhật</MenuItem>
                <MenuItem value="DELETE">Hành động Xóa</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160, mr: 1 }}>
              <Select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }} sx={{ bgcolor: 'white', '& .MuiSelect-select': { py: 0.8, fontSize: '0.875rem' } }}>
                <MenuItem value="ALL">Tất cả thực thể</MenuItem>
                {ENTITY_TYPES.map(entity => <MenuItem key={entity} value={entity}>{entity}</MenuItem>)}
              </Select>
            </FormControl>

            <Button size="small" variant="contained" startIcon={<PrintIcon />} sx={{ bgcolor: '#f012be', '&:hover': { bgcolor: '#d810aa' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>In Nhật Ký</Button>
            <Button size="small" variant="contained" startIcon={<ExcelIcon />} sx={{ bgcolor: '#0073b7', '&:hover': { bgcolor: '#00609a' }, textTransform: 'none', borderRadius: 1, boxShadow: 'none' }}>Xuất Excel</Button>
          </Box>

          <Box sx={{ p: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Ghi lại mọi thay đổi dữ liệu của người dùng trên toàn hệ thống</Typography>
          </Box>

          <TableContainer sx={{ minHeight: 500 }}>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: '#ffffff' }}>
                <TableRow>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 140, p: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Thời Gian <FilterIcon sx={{ fontSize: 14, color: '#cbd5e1' }} /></Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 150, p: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Tài Khoản</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 180, p: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Hành Động</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 120, p: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Đối Tượng</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', p: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Dữ Liệu Chi Tiết</TableCell>
                  <TableCell sx={{ borderBottom: '2px solid #f1f5f9', width: 200, p: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Thiết Bị / IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : logs.map((log) => {
                  const act = getActionInfo(log.action);
                  return (
                    <TableRow key={log.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Typography variant="body2" fontWeight={700} color="#334155">{format(log.createdAt, 'dd/MM/yyyy')}</Typography>
                        <Typography variant="caption" color="text.secondary">{format(log.createdAt, 'HH:mm:ss')}</Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#0284c7', fontSize: '0.7rem', fontWeight: 700 }}>U</Avatar>
                          <Typography variant="body2" fontWeight={600} color="#0284c7">ID: {log.userId}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Chip 
                          icon={act.icon} 
                          label={getActionLabel(log.action)} 
                          size="small" 
                          sx={{ bgcolor: act.bg, color: act.text, fontWeight: 700, borderRadius: 1, '& .MuiChip-icon': { color: 'inherit' } }} 
                        />
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Typography variant="body2" fontWeight={600} color="#475569">{log.entityType}</Typography>
                        {log.entityId && <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5 }}>#{log.entityId}</Typography>}
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Tooltip title={<pre style={{ margin: 0, fontSize: '11px' }}>{JSON.stringify(log.details, null, 2)}</pre>} arrow placement="top">
                          <Box sx={{ 
                            display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', p: 1, borderRadius: 1, border: '1px dashed #e2e8f0', cursor: 'help'
                          }}>
                            <TerminalIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography variant="caption" fontFamily="monospace" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {JSON.stringify(log.details)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <DeviceIcon sx={{ fontSize: 14, color: '#64748b' }} />
                          <Typography variant="caption" fontWeight={600} color="#64748b">{log.ipAddress}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.userAgent}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ p: 1, borderTop: '1px solid #f1f5f9' }}>
            <TablePagination
              component="div"
              count={totalElements}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={size}
              rowsPerPageOptions={[size]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count} bản ghi`}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};