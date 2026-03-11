import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export const AUTH_API_BASE = `${API_BASE_URL}/api/auth`;
export const BUSINESS_API_BASE = `${API_BASE_URL}/api/v1`;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
};

export const isAuthenticated = () => !!getToken();

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;

    if (status === 401) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    const message =
      (error.response?.data as any)?.message ??
      error.message ??
      'Có lỗi xảy ra. Vui lòng thử lại.';

    return Promise.reject(
      Object.assign(error, {
        message,
      })
    );
  }
);

// ==== Auth API types (phù hợp với backend) ====

// ==== Auth API types ====

export interface BackendLoginResponseData {
  accessToken: string;
  tokenType: string;
  role: string;      // Bổ sung lấy role từ DB
  fullName: string;  // Bổ sung lấy tên thật từ DB
}
interface BackendBaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export const authAPI = {
  async login(email: string, password: string): Promise<BackendBaseResponse<BackendLoginResponseData>> {
    const response = await apiClient.post<BackendBaseResponse<BackendLoginResponseData>>('/api/auth/login', {
      email,
      password,
    });

    if (response.data.success && response.data.data?.accessToken) {
      setToken(response.data.data.accessToken);
    }

    return response.data;
  },

  async register(userData: Record<string, unknown>): Promise<BackendBaseResponse<null>> {
    const response = await apiClient.post<BackendBaseResponse<null>>('/api/auth/register', userData);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Logout error:', err);
    } finally {
      clearAuth();
    }
  },
};

// ==== Business API helpers ====

// Kiểu trả về cơ bản từ backend cho các entity thuần (không bọc success/message)
export interface BackendSanPham {
  sanPhamId: number;
  maSku: string;
  tenSanPham: string;
  giaBan: number;
  giaNhap: number | null;
  maVach: string | null;
  moTa: string | null;
  hoatDong: boolean;
  danhMuc?: {
    danhMucId: number;
    tenDanhMuc: string;
  } | null;
}

export interface BackendHoaDon {
  hoaDonId: number;
  ngayLap: string;
  maHoaDon?: string | null;
  kenhBan?: string | null;
  phuongThucThanhToan?: string | null;
  ghiChu?: string | null;
  tamTinh: number;
  chietKhau: number;
  tongPhaiThanhToan: number;
  trangThai: string;
}

export interface BackendHoaDonDTO {
  hoaDonId: number;
  maHoaDon?: string | null;
  kenhBan?: string | null;
  cuaHangId?: number | null;
  tenCuaHang?: string | null;
  khachHangId?: number | null;
  tenKhachHang?: string | null;
  dienThoaiKhachHang?: string | null;
  nhanVienId?: number | null;
  tenNhanVien?: string | null;
  ngayLap: string;
  phuongThucThanhToan?: string | null;
  ghiChu?: string | null;
  tamTinh?: number | null;
  tienThue?: number | null;
  chietKhau?: number | null;
  phiShip?: number | null;
  tongPhaiThanhToan?: number | null;
  trangThai?: string | null;
  ngayHuy?: string | null;
  lyDoHuy?: string | null;
  nguoiHuy?: string | null;
}

export const orderAPI = {
  getAll: () => apiClient.get<BackendHoaDonDTO[]>('/api/v1/hoa-don'),
  create: (data: any) => apiClient.post('/api/v1/hoa-don', data),

  query: (params?: {
    storeId?: number;
    channel?: string;
    status?: string;
    from?: string;
    to?: string;
    keyword?: string;
  }) => apiClient.get<BackendHoaDonDTO[]>('/api/v1/hoa-don/query', { params }),

  exportExcel: (params?: {
    storeId?: number;
    channel?: string;
    status?: string;
    from?: string;
    to?: string;
    keyword?: string;
  }) => apiClient.get('/api/v1/hoa-don/export', { params, responseType: 'blob' }),

  cancel: (id: number, params?: { reason?: string; cancelledBy?: string }) =>
    apiClient.put(`/api/v1/hoa-don/${id}/cancel`, null, { params }),
};

export interface BackendOrderHistoryRow {
  id: number;
  maGD: string;
  thoiGian: string;
  loaiGD: string;
  doiTuong?: string | null;
  giaTri: number;
  phuongThuc?: string | null;
  nhanVien?: string | null;
}

export const orderHistoryAPI = {
  getAll: (params?: { from?: string; to?: string; keyword?: string }) =>
    apiClient.get<BackendOrderHistoryRow[]>('/api/v1/order-history', { params }),
  exportExcel: (params?: { from?: string; to?: string; keyword?: string }) =>
    apiClient.get('/api/v1/order-history/export', { params, responseType: 'blob' }),
};

export interface BackendBienTheSanPham {
  bienTheId: number;
  sanPham?: { sanPhamId: number } | null;
  tenBienThe?: string | null;
  maSku?: string | null;
  giaBan?: number | null;
  giaNhap?: number | null;
  maVach?: string | null;
  hoatDong?: boolean | null;
}

export const variantAPI = {
  getByProductId: (sanPhamId: number) =>
    apiClient.get<BackendBienTheSanPham[]>(`/api/v1/bien-the-san-pham/san-pham/${sanPhamId}`),
  create: (payload: any) => apiClient.post('/api/v1/bien-the-san-pham', payload),
  delete: (id: number) => apiClient.delete(`/api/v1/bien-the-san-pham/${id}`),
};

export const productAPI = {
  getAll: () => apiClient.get<BackendSanPham[]>('/api/v1/san-pham'),
  getActive: () => apiClient.get<BackendSanPham[]>('/api/v1/san-pham/active'),
  search: (keyword: string) =>
    apiClient.get<BackendSanPham[]>(`/api/v1/san-pham/search`, {
      params: { keyword },
    }),
  getById: (id: number) => apiClient.get<BackendSanPham>(`/api/v1/san-pham/${id}`),
};

export const orderAPI = {
  getAll: () => apiClient.get<BackendHoaDon[]>('/api/v1/hoa-don'),
};

// ==== Promotions API ====

export interface BackendPromotion {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase?: number | null;
  maxDiscount?: number | null;
  startDate: string; // ISO date (yyyy-MM-dd)
  endDate: string;   // ISO date
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const promotionAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendPromotion[]>>('/api/v1/khuyen-mai'),
  getActive: () => apiClient.get<BackendBaseResponse<BackendPromotion[]>>('/api/v1/khuyen-mai/active'),
  create: (data: Omit<BackendPromotion, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<BackendBaseResponse<BackendPromotion>>('/api/v1/khuyen-mai', data),
  update: (id: number, data: Omit<BackendPromotion, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.put<BackendBaseResponse<BackendPromotion>>(`/api/v1/khuyen-mai/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/khuyen-mai/${id}`),
};

// ==== Categories API ====

export interface BackendCategory {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const categoryAPI = {
  getAll: (parentId?: number) =>
    apiClient.get<BackendBaseResponse<BackendCategory[]>>('/api/v1/danh-muc', {
      params: parentId ? { parentId } : {},
    }),
  getById: (id: number) =>
    apiClient.get<BackendBaseResponse<BackendCategory>>(`/api/v1/danh-muc/${id}`),
  create: (data: { name: string; description?: string; parentId?: number; isActive?: boolean }) =>
    apiClient.post<BackendBaseResponse<BackendCategory>>('/api/v1/danh-muc', data),
  update: (id: number, data: { name: string; description?: string; parentId?: number; isActive?: boolean }) =>
    apiClient.put<BackendBaseResponse<BackendCategory>>(`/api/v1/danh-muc/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/danh-muc/${id}`),
};

// ==== Stores API ====

export interface BackendStore {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email?: string | null;
  managerId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const storeAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendStore[]>>('/api/v1/cua-hang'),
  getById: (id: number) =>
    apiClient.get<BackendBaseResponse<BackendStore>>(`/api/v1/cua-hang/${id}`),
  create: (data: { code: string; name: string; address: string; phone: string; email?: string; isActive?: boolean }) =>
    apiClient.post<BackendBaseResponse<BackendStore>>('/api/v1/cua-hang', data),
  update: (id: number, data: { code?: string; name?: string; address?: string; phone?: string; email?: string; isActive?: boolean }) =>
    apiClient.put<BackendBaseResponse<BackendStore>>(`/api/v1/cua-hang/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/cua-hang/${id}`),
};

// ==== Users API ====

export interface BackendUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  storeId?: number | null;
  isActive: boolean;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const userAPI = {
  getAll: (role?: string, storeId?: number) =>
    apiClient.get<BackendBaseResponse<BackendUser[]>>('/api/v1/users', {
      params: { role, storeId },
    }),
  getById: (id: number) =>
    apiClient.get<BackendBaseResponse<BackendUser>>(`/api/v1/users/${id}`),
  create: (data: { email: string; password: string; fullName: string; phone: string; role: string; storeId?: number }) =>
    apiClient.post<BackendBaseResponse<BackendUser>>('/api/v1/users', data),
  update: (id: number, data: { fullName?: string; phone?: string; role?: string; storeId?: number; password?: string; isActive?: boolean }) =>
    apiClient.put<BackendBaseResponse<BackendUser>>(`/api/v1/users/${id}`, data),
  toggleActive: (id: number) =>
    apiClient.put<BackendBaseResponse<BackendUser>>(`/api/v1/users/${id}/toggle-active`),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/users/${id}`),
};

// ==== Dashboard Stats API ====

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingRecommendations: number;
  revenueGrowth: number;
  orderGrowth: number;
}

export const dashboardAPI = {
  getStats: (storeId?: number, startDate?: string, endDate?: string) =>
    apiClient.get<BackendBaseResponse<DashboardStats>>('/api/v1/dashboard/stats', {
      params: { storeId, startDate, endDate },
    }),
};

// ==== Voucher API ====

export interface BackendVoucher {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase?: number | null;
  maxDiscount?: number | null;
  startDate: string;
  endDate: string;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  currentUsage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherValidationRequest {
  code: string;
  orderAmount: number;
  userId?: number;
}

export interface VoucherValidationResponse {
  isValid: boolean;
  message: string;
  discountAmount: number;
  voucher?: BackendVoucher;
}

export const voucherAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendVoucher[]>>('/api/v1/voucher'),
  getActive: () => apiClient.get<BackendBaseResponse<BackendVoucher[]>>('/api/v1/voucher/active'),
  getById: (id: number) =>
    apiClient.get<BackendBaseResponse<BackendVoucher>>(`/api/v1/voucher/${id}`),
  getByCode: (code: string) =>
    apiClient.get<BackendBaseResponse<BackendVoucher>>(`/api/v1/voucher/code/${code}`),
  create: (data: Omit<BackendVoucher, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<BackendBaseResponse<BackendVoucher>>('/api/v1/voucher', data),
  update: (id: number, data: Omit<BackendVoucher, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>) =>
    apiClient.put<BackendBaseResponse<BackendVoucher>>(`/api/v1/voucher/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/voucher/${id}`),
  validate: (data: VoucherValidationRequest) =>
    apiClient.post<BackendBaseResponse<VoucherValidationResponse>>('/api/v1/voucher/validate', data),
};

// ==== AI Agent API ====

export interface BackendAIRecommendation {
  id: number;
  type: string;
  storeId?: number | null;
  productId?: number | null;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: Record<string, any>;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface BackendDemandPrediction {
  productId: number;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedOrder: number;
  confidence: number;
  period: string;
}

export const aiAPI = {
  getRecommendations: (storeId?: number, type?: string, priority?: string, isResolved?: boolean) =>
    apiClient.get<BackendBaseResponse<BackendAIRecommendation[]>>('/api/v1/ai/recommendations', {
      params: { storeId, type, priority, isResolved },
    }),
  getPredictions: (storeId?: number) =>
    apiClient.get<BackendBaseResponse<BackendDemandPrediction[]>>('/api/v1/ai/predictions', {
      params: { storeId },
    }),
  predictDemand: (storeId?: number, days?: number) =>
    apiClient.post<BackendBaseResponse<BackendDemandPrediction[]>>('/api/v1/ai/predict-demand', null, {
      params: { storeId, days },
    }),
  analyzeSales: (storeId?: number, productId?: number, days?: number) =>
    apiClient.post<BackendBaseResponse<any>>('/api/v1/ai/analyze-sales', null, {
      params: { storeId, productId, days },
    }),
  markAsRead: (id: number) =>
    apiClient.put<BackendBaseResponse<BackendAIRecommendation>>(`/api/v1/ai/recommendations/${id}/read`),
  markAsResolved: (id: number) =>
    apiClient.put<BackendBaseResponse<BackendAIRecommendation>>(`/api/v1/ai/recommendations/${id}/resolve`),
  triggerWorkflow: (workflowName: string, data?: Record<string, any>) =>
    apiClient.post<BackendBaseResponse<void>>('/api/v1/ai/trigger', data, {
      params: { workflowName },
    }),
};

// ==== Settings API ====

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  aiRecommendations: boolean;
}

export const settingsAPI = {
  getCurrentUser: () =>
    apiClient.get<BackendBaseResponse<BackendUser>>('/api/v1/users/me'),
  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<BackendBaseResponse<BackendUser>>('/api/v1/users/me', data),
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put<BackendBaseResponse<void>>('/api/v1/users/me/password', data),
  getNotificationSettings: () =>
    apiClient.get<BackendBaseResponse<NotificationSettings>>('/api/v1/users/me/settings'),
  updateNotificationSettings: (data: NotificationSettings) =>
    apiClient.put<BackendBaseResponse<void>>('/api/v1/users/me/settings', data),
};

// ==== Notifications API ====

export interface BackendNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationAPI = {
  getAll: (isRead?: boolean) =>
    apiClient.get<BackendBaseResponse<BackendNotification[]>>('/api/v1/notifications', {
      params: isRead !== undefined ? { isRead } : {},
    }),
  create: (data: { userId: number; type: string; title: string; message: string; link?: string }) =>
    apiClient.post<BackendBaseResponse<BackendNotification>>('/api/v1/notifications', data),
  markAsRead: (id: number) =>
    apiClient.put<BackendBaseResponse<BackendNotification>>(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () =>
    apiClient.put<BackendBaseResponse<void>>('/api/v1/notifications/read-all'),
  delete: (id: number) =>
    apiClient.delete<BackendBaseResponse<void>>(`/api/v1/notifications/${id}`),
};

// ==== ActivityLogs API ====

export interface BackendActivityLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export const activityLogAPI = {
  getAll: (userId?: number, action?: string, entityType?: string, search?: string, page = 0, size = 20) =>
    apiClient.get<BackendBaseResponse<PaginatedResponse<BackendActivityLog>>>('/api/v1/activity-logs', {
      params: { userId, action, entityType, search, page, size },
    }),
};

// ==== Inventory API ====

export interface BackendInventory {
  id: number;
  storeId: number;
  storeName: string;
  productId: number;
  productName: string;
  quantity: number;
  minStock: number;
  maxStock?: number | null;
  lastUpdated: string;
}

export interface InventoryTransactionRequest {
  storeId: number;
  productId: number;
  type: 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  fromStoreId?: number;
  toStoreId?: number;
  reason?: string;
}

export interface BackendInventoryTransaction {
  id: number;
  storeId: number;
  storeName: string;
  productId: number;
  productName: string;
  type: string;
  quantity: number;
  fromStoreId?: number | null;
  fromStoreName?: string | null;
  toStoreId?: number | null;
  toStoreName?: string | null;
  reason?: string | null;
  createdBy: number;
  createdAt: string;
}

export const inventoryAPI = {
  getAll: (storeId?: number, productId?: number) =>
    apiClient.get<BackendBaseResponse<BackendInventory[]>>('/api/v1/inventory', {
      params: { storeId, productId },
    }),
  getLowStock: () =>
    apiClient.get<BackendBaseResponse<BackendInventory[]>>('/api/v1/inventory/low-stock'),
  getById: (id: number) =>
    apiClient.get<BackendBaseResponse<BackendInventory>>(`/api/v1/inventory/${id}`),
  update: (id: number, minStock?: number, maxStock?: number) =>
    apiClient.put<BackendBaseResponse<BackendInventory>>(`/api/v1/inventory/${id}`, null, {
      params: { minStock, maxStock },
    }),
  createTransaction: (data: InventoryTransactionRequest) =>
    apiClient.post<BackendBaseResponse<BackendInventoryTransaction>>('/api/v1/inventory/transaction', data),
};

// ==== WorkShifts API ====

export interface BackendWorkShift {
  id: number;
  storeId: number;
  storeName: string;
  userId: number;
  userName: string;
  shiftDate: string;
  startTime: string;
  endTime?: string | null;
  notes?: string | null;
  createdAt: string;
}

export const workShiftAPI = {
  getAll: (storeId?: number, userId?: number, shiftDate?: string) =>
    apiClient.get<BackendBaseResponse<BackendWorkShift[]>>('/api/v1/work-shifts', {
      params: { storeId, userId, shiftDate },
    }),
  getById: (id: number) =>
    apiClient.get<BackendBaseResponse<BackendWorkShift>>(`/api/v1/work-shifts/${id}`),
  create: (data: { storeId: number; userId: number; shiftDate: string; startTime: string; endTime?: string; notes?: string }) =>
    apiClient.post<BackendBaseResponse<BackendWorkShift>>('/api/v1/work-shifts', data),
  update: (id: number, data: { storeId?: number; userId?: number; shiftDate?: string; startTime?: string; endTime?: string; notes?: string }) =>
    apiClient.put<BackendBaseResponse<BackendWorkShift>>(`/api/v1/work-shifts/${id}`, data),
  delete: (id: number) =>
    apiClient.delete<BackendBaseResponse<void>>(`/api/v1/work-shifts/${id}`),
};

// ==== Reports API ====

export interface RevenueReport {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  profit?: number;
  profitMargin?: number;
}

export interface ProductSalesReport {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit?: number;
}

export interface StoreComparison {
  storeId: number;
  storeName: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growth: number;
}

export const reportAPI = {
  getRevenue: (startDate: string, endDate: string, storeId?: number, period?: string) =>
    apiClient.get<BackendBaseResponse<RevenueReport[]>>('/api/v1/reports/revenue', {
      params: { startDate, endDate, storeId, period },
    }),
  getProductSales: (startDate: string, endDate: string, storeId?: number) =>
    apiClient.get<BackendBaseResponse<ProductSalesReport[]>>('/api/v1/reports/product-sales', {
      params: { startDate, endDate, storeId },
    }),
  getStoreComparison: (startDate: string, endDate: string) =>
    apiClient.get<BackendBaseResponse<StoreComparison[]>>('/api/v1/reports/store-comparison', {
      params: { startDate, endDate },
    }),
};
// ==== Cashbook API (Sổ quỹ & Công nợ) ====

export interface BackendCashbookTransaction {
  id: number;
  code: string;
  transactionDate: string;
  type: 'INCOME' | 'EXPENSE';
  method: 'CASH' | 'BANK_TRANSFER' | 'CARD';
  category: string;
  description: string;
  referenceName: string;
  amount: number;
  balanceAfterTransaction: number;
  storeName: string;
  creatorName: string;
  status: string;
}

export interface CreateCashbookRequest {
  type: 'INCOME' | 'EXPENSE';
  method: 'CASH' | 'BANK_TRANSFER' | 'CARD';
  category: string;
  description: string;
  referenceName: string;
  amount: number;
  storeId: number;
  creatorId: number;
}

export const cashbookAPI = {
  // Lấy danh sách giao dịch (hỗ trợ lọc theo type, method, search)
  getAll: (method?: string, type?: string, search?: string) =>
    apiClient.get<BackendBaseResponse<BackendCashbookTransaction[]>>('/api/finance/cashbooks', {
      params: { 
        method, 
        type: type === 'ALL' ? undefined : type, 
        search: search || undefined 
      },
    }),
  
  // Tạo giao dịch mới
  create: (data: CreateCashbookRequest) =>
    apiClient.post<BackendBaseResponse<BackendCashbookTransaction>>('/api/finance/cashbooks', data),
    
  // Hủy giao dịch
  cancel: (id: number) =>
    apiClient.patch<BackendBaseResponse<BackendCashbookTransaction>>(`/api/finance/cashbooks/${id}/cancel`),
};
export default apiClient;

