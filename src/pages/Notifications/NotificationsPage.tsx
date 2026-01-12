import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { Notification, NotificationType } from '../../types';
import { format } from 'date-fns';
import { useToastStore } from '../../store/toastStore';

export const NotificationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { showToast } = useToastStore();

  // Mock data - Thay thế bằng API call
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      userId: 'user-1',
      type: NotificationType.WARNING,
      title: 'Cảnh báo tồn kho thấp',
      message: 'Sản phẩm Pepsi 330ml đang ở mức tồn kho thấp (25/50)',
      link: '/inventory',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      userId: 'user-1',
      type: NotificationType.SUCCESS,
      title: 'Đơn hàng hoàn thành',
      message: 'Đơn hàng HD001 đã được thanh toán thành công',
      link: '/orders',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      userId: 'user-1',
      type: NotificationType.INFO,
      title: 'Đề xuất từ AI-Agent',
      message: 'Có 3 đề xuất mới từ AI-Agent cần xem xét',
      link: '/ai-dashboard',
      isRead: true,
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: '4',
      userId: 'user-1',
      type: NotificationType.ERROR,
      title: 'Lỗi hệ thống',
      message: 'Có lỗi xảy ra khi xử lý đơn hàng HD002',
      link: '/orders',
      isRead: false,
      createdAt: new Date(Date.now() - 10800000),
    },
  ]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircleIcon color="success" />;
      case NotificationType.WARNING:
        return <WarningIcon color="warning" />;
      case NotificationType.ERROR:
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'success';
      case NotificationType.WARNING:
        return 'warning';
      case NotificationType.ERROR:
        return 'error';
      default:
        return 'info';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = tabValue === 0
    ? notifications
    : tabValue === 1
    ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.isRead);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
    showToast('Đã đánh dấu đã đọc', 'success');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    showToast('Đã đánh dấu tất cả là đã đọc', 'success');
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    showToast('Đã xóa thông báo', 'success');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" />
          Thông Báo
          {unreadCount > 0 && (
            <Chip
              label={unreadCount}
              color="error"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        {unreadCount > 0 && (
          <Chip
            icon={<MarkReadIcon />}
            label="Đánh dấu tất cả đã đọc"
            onClick={handleMarkAllAsRead}
            color="primary"
            variant="outlined"
            clickable
          />
        )}
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab
              label={
                <Badge badgeContent={notifications.length} color="primary">
                  Tất cả
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={unreadCount} color="error">
                  Chưa đọc
                </Badge>
              }
            />
            <Tab label="Đã đọc" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsActiveIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                Không có thông báo
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!notification.isRead && (
                          <IconButton
                            edge="end"
                            onClick={() => handleMarkAsRead(notification.id)}
                            size="small"
                          >
                            <MarkReadIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(notification.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <ListItemAvatar>
                      {getNotificationIcon(notification.type)}
                    </ListItemAvatar>
                    <ListItemButton
                      onClick={() => {
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: notification.isRead ? 400 : 600 }}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.isRead && (
                              <Chip
                                label="Mới"
                                color={getNotificationColor(notification.type) as any}
                                size="small"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {format(notification.createdAt, 'dd/MM/yyyy HH:mm')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
