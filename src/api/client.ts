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

// ==== Auth API types ====

export interface BackendLoginResponseData {
  accessToken: string;
  tokenType: string;
  role: string;      
  fullName: string;  
}

export interface BackendBaseResponse<T = unknown> {
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
      console.error('Logout error:', err);
    } finally {
      clearAuth();
    }
  },
};

// ==== Business API helpers ====

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

export interface BackendHoaDonDTO extends BackendHoaDon {
  cuaHangId?: number | null;
  tenCuaHang?: string | null;
  khachHangId?: number | null;
  tenKhachHang?: string | null;
  dienThoaiKhachHang?: string | null;
  nhanVienId?: number | null;
  tenNhanVien?: string | null;
  tienThue?: number | null;
  phiShip?: number | null;
  ngayHuy?: string | null;
  lyDoHuy?: string | null;
  nguoiHuy?: string | null;
}

export const productAPI = {
  getAll: () => apiClient.get<BackendSanPham[]>('/api/v1/san-pham'),
  getActive: () => apiClient.get<BackendSanPham[]>('/api/v1/san-pham/active'),
  search: (keyword: string) =>
    apiClient.get<BackendSanPham[]>(`/api/v1/san-pham/search`, {
      params: { keyword },
    }),
  getById: (id: number) => apiClient.get<BackendSanPham>(`/api/v1/san-pham/${id}`),
};

export const variantAPI = {
  getByProductId: (sanPhamId: number) =>
    apiClient.get<BackendBienTheSanPham[]>(`/api/v1/bien-the-san-pham/san-pham/${sanPhamId}`),
  create: (payload: any) => apiClient.post('/api/v1/bien-the-san-pham', payload),
  delete: (id: number) => apiClient.delete(`/api/v1/bien-the-san-pham/${id}`),
};

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
  startDate: string;
  endDate: string;
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
  getById: (id: number) => apiClient.get<BackendBaseResponse<BackendCategory>>(`/api/v1/danh-muc/${id}`),
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
  getAll: () => apiClient.get<BackendBaseResponse<BackendStore[]>>('/api/v1/cua-hang'), // Đang trỏ vào v1, bạn có thể cân nhắc đổi thành /api/core/stores theo chuẩn mới
  getById: (id: number) => apiClient.get<BackendBaseResponse<BackendStore>>(`/api/v1/cua-hang/${id}`),
  create: (data: any) => apiClient.post<BackendBaseResponse<BackendStore>>('/api/v1/cua-hang', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<BackendStore>>(`/api/v1/cua-hang/${id}`, data),
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
  getById: (id: number) => apiClient.get<BackendBaseResponse<BackendUser>>(`/api/v1/users/${id}`),
  create: (data: any) => apiClient.post<BackendBaseResponse<BackendUser>>('/api/v1/users', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<BackendUser>>(`/api/v1/users/${id}`, data),
  toggleActive: (id: number) => apiClient.put<BackendBaseResponse<BackendUser>>(`/api/v1/users/${id}/toggle-active`),
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
  getById: (id: number) => apiClient.get<BackendBaseResponse<BackendVoucher>>(`/api/v1/voucher/${id}`),
  getByCode: (code: string) => apiClient.get<BackendBaseResponse<BackendVoucher>>(`/api/v1/voucher/code/${code}`),
  create: (data: Omit<BackendVoucher, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>) => apiClient.post<BackendBaseResponse<BackendVoucher>>('/api/v1/voucher', data),
  update: (id: number, data: Omit<BackendVoucher, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>) => apiClient.put<BackendBaseResponse<BackendVoucher>>(`/api/v1/voucher/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/voucher/${id}`),
  validate: (data: VoucherValidationRequest) => apiClient.post<BackendBaseResponse<VoucherValidationResponse>>('/api/v1/voucher/validate', data),
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
  markAsRead: (id: number) => apiClient.put<BackendBaseResponse<BackendAIRecommendation>>(`/api/v1/ai/recommendations/${id}/read`),
  markAsResolved: (id: number) => apiClient.put<BackendBaseResponse<BackendAIRecommendation>>(`/api/v1/ai/recommendations/${id}/resolve`),
  triggerWorkflow: (workflowName: string, data?: Record<string, any>) =>
    apiClient.post<BackendBaseResponse<void>>('/api/v1/ai/trigger', data, {
      params: { workflowName },
    }),
};

// ==== Settings API ====
export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  aiRecommendations: boolean;
}

export const settingsAPI = {
  getCurrentUser: () => apiClient.get<BackendBaseResponse<BackendUser>>('/api/v1/users/me'),
  updateProfile: (data: any) => apiClient.put<BackendBaseResponse<BackendUser>>('/api/v1/users/me', data),
  changePassword: (data: any) => apiClient.put<BackendBaseResponse<void>>('/api/v1/users/me/password', data),
  getNotificationSettings: () => apiClient.get<BackendBaseResponse<NotificationSettings>>('/api/v1/users/me/settings'),
  updateNotificationSettings: (data: NotificationSettings) => apiClient.put<BackendBaseResponse<void>>('/api/v1/users/me/settings', data),
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
  create: (data: any) => apiClient.post<BackendBaseResponse<BackendNotification>>('/api/v1/notifications', data),
  markAsRead: (id: number) => apiClient.put<BackendBaseResponse<BackendNotification>>(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put<BackendBaseResponse<void>>('/api/v1/notifications/read-all'),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/notifications/${id}`),
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

export const inventoryAPI = {
  getAll: (storeId?: number, productId?: number) =>
    apiClient.get<BackendBaseResponse<BackendInventory[]>>('/api/v1/inventory', {
      params: { storeId, productId },
    }),
  getLowStock: () => apiClient.get<BackendBaseResponse<BackendInventory[]>>('/api/v1/inventory/low-stock'),
  getById: (id: number) => apiClient.get<BackendBaseResponse<BackendInventory>>(`/api/v1/inventory/${id}`),
  update: (id: number, minStock?: number, maxStock?: number) =>
    apiClient.put<BackendBaseResponse<BackendInventory>>(`/api/v1/inventory/${id}`, null, {
      params: { minStock, maxStock },
    }),
  createTransaction: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/v1/inventory/transaction', data),
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
    apiClient.get<BackendBaseResponse<BackendWorkShift[]>>('/api/v1/work-shifts', { // Có thể sửa thành /api/core/work-shifts
      params: { storeId, userId, shiftDate },
    }),
  getById: (id: number) => apiClient.get<BackendBaseResponse<BackendWorkShift>>(`/api/v1/work-shifts/${id}`),
  create: (data: any) => apiClient.post<BackendBaseResponse<BackendWorkShift>>('/api/v1/work-shifts', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<BackendWorkShift>>(`/api/v1/work-shifts/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/v1/work-shifts/${id}`),
};

// ==== Reports API ====
export const reportAPI = {
  getRevenue: (startDate: string, endDate: string, storeId?: number, period?: string) =>
    apiClient.get<BackendBaseResponse<any[]>>('/api/v1/reports/revenue', {
      params: { startDate, endDate, storeId, period },
    }),
  getProductSales: (startDate: string, endDate: string, storeId?: number) =>
    apiClient.get<BackendBaseResponse<any[]>>('/api/v1/reports/product-sales', {
      params: { startDate, endDate, storeId },
    }),
  getStoreComparison: (startDate: string, endDate: string) =>
    apiClient.get<BackendBaseResponse<any[]>>('/api/v1/reports/store-comparison', {
      params: { startDate, endDate },
    }),
};

// =====================================================================
// ==== CÁC API THUỘC MODULE CORE & FINANCE (MỚI THÊM) ====
// =====================================================================

// ==== Core: Suppliers (Nhà Cung Cấp) ====
export interface BackendSupplier {
  id: number;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  debt: number; // Công nợ
  status: string;
}

export const supplierAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendSupplier[]>>('/api/core/suppliers'),
  create: (data: any) => apiClient.post<BackendBaseResponse<BackendSupplier>>('/api/core/suppliers', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<BackendSupplier>>(`/api/core/suppliers/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/core/suppliers/${id}`),
};

// ==== Finance: Cashbook (Sổ quỹ Thu/Chi) ====
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
  // Lấy danh sách giao dịch
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
};

// ==== Finance: Supplier Debt (Công nợ NCC) ====
export interface PaySupplierDebtRequest {
  supplierId: number;
  amount: number;
  method: 'CASH' | 'BANK_TRANSFER' | 'CARD';
  notes?: string;
  storeId: number;
  creatorId: number;
}

export const supplierDebtAPI = {
  // Trả nợ cho nhà cung cấp
  payDebt: (data: PaySupplierDebtRequest) =>
    apiClient.post<BackendBaseResponse<BackendCashbookTransaction>>('/api/finance/supplier-debts/pay', data),
};

export default apiClient;