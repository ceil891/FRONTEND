// src/api/client.ts

import axios, { AxiosError, AxiosInstance } from 'axios';
import { 
  BackendSize, 
  BackendColor, 
  BackendUnit, 
  BackendSupplier, 
  BackendCategory 
} from '../types/api.types';

const API_BASE_URL = 'http://localhost:8080';

export const AUTH_API_BASE = `${API_BASE_URL}/api/auth`;
export const BUSINESS_API_BASE = `${API_BASE_URL}/api/v1`;

// ==========================================
// 1. CẤU HÌNH AXIOS VÀ INTERCEPTORS
// ==========================================
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

// ==========================================
// 2. TYPES CHUNG
// ==========================================
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

export interface CashbookTransactionResponse {
  id: number;
  code: string;
  transactionDate: string;
  type: 'INCOME' | 'EXPENSE';
  method: 'CASH' | 'BANK_TRANSFER';
  category: string;
  amount: number;
  balanceAfterTransaction: number;
  referenceName: string;
  description: string;
  status: string;
  storeName?: string;
  creatorName?: string;
}

export interface LoyaltyConfig {
  id?: number;
  exchangeRateEarn: number;
  exchangeRateRedeem: number;
}

export interface SupplierDebtPaymentRequest {
  supplierId: number;
  amount: number;
  method: 'CASH' | 'BANK_TRANSFER';
  notes?: string;
  storeId: number;
  creatorId: number;
}

export interface CashbookTransactionRequest {
  type: 'INCOME' | 'EXPENSE';
  method: 'CASH' | 'BANK_TRANSFER';
  category: string;
  amount: number;
  referenceName: string;
  description?: string;
  storeId: number;
  creatorId: number;
}

// ==========================================
// 2.1. DASHBOARD & ACTIVITY LOG TYPES
// ==========================================
export interface DashboardStatsResponse {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingRecommendations: number;
  revenueGrowth: number | null;
  orderGrowth: number | null;
}

export interface ActivityLogResponse {
  id: number;
  userId: number | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface RevenueReportResponse {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  profit: number;
  profitMargin: number | null;
}

export interface ProductSalesReportResponse {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface StoreComparisonResponse {
  storeId: number;
  storeName: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growth: number | null;
}

// ==========================================
// 3. DANH SÁCH CÁC API
// ==========================================

// --- AUTH API ---
export const authAPI = {
  async login(email: string, password?: string): Promise<BackendBaseResponse<BackendLoginResponseData>> {
    const response = await apiClient.post<BackendBaseResponse<BackendLoginResponseData>>('/api/auth/login', {
      email,
      password: password || '', 
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

// --- INVENTORY API ---
export const sizeAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendSize[]>>('/api/inventory/sizes'),
  create: (data: { name: string; description?: string; status: string }) => apiClient.post<BackendBaseResponse<BackendSize>>('/api/inventory/sizes', data),
  update: (id: number, data: { name: string; description?: string; status: string }) => apiClient.put<BackendBaseResponse<BackendSize>>(`/api/inventory/sizes/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/sizes/${id}`),
};

export const colorAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendColor[]>>('/api/inventory/colors'),
  create: (data: { name: string; hexCode: string; status: string }) => apiClient.post<BackendBaseResponse<BackendColor>>('/api/inventory/colors', data),
  update: (id: number, data: { name: string; hexCode: string; status: string }) => apiClient.put<BackendBaseResponse<BackendColor>>(`/api/inventory/colors/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/colors/${id}`),
};

export const unitAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendUnit[]>>('/api/inventory/units'),
  create: (data: { code: string; name: string; description?: string; status: string }) => apiClient.post<BackendBaseResponse<BackendUnit>>('/api/inventory/units', data),
  update: (id: number, data: { code: string; name: string; description?: string; status: string }) => apiClient.put<BackendBaseResponse<BackendUnit>>(`/api/inventory/units/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/units/${id}`),
};

export const categoryAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendCategory[]>>('/api/inventory/categories'),
  create: (data: { name: string; description?: string; parentId?: number; isActive: boolean }) => apiClient.post<BackendBaseResponse<BackendCategory>>('/api/inventory/categories', data),
  update: (id: number, data: { name: string; description?: string; parentId?: number; isActive: boolean }) => apiClient.put<BackendBaseResponse<BackendCategory>>(`/api/inventory/categories/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<string>>(`/api/inventory/categories/${id}`),
};

// 👉 THÊM PRODUCT API (Dành cho trang POS)
export const productAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/inventory/products'),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/inventory/products', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/products/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/products/${id}`),
};

// --- CORE API ---
export const supplierAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<BackendSupplier[]>>('/api/core/suppliers'),
  create: (data: any) => apiClient.post<BackendBaseResponse<BackendSupplier>>('/api/core/suppliers', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<BackendSupplier>>(`/api/core/suppliers/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/core/suppliers/${id}`),
};

export const areaAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/core/areas'), 
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/core/areas', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/core/areas/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/core/areas/${id}`),
};

export const storeAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/core/stores'),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/core/stores', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/core/stores/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/core/stores/${id}`),
};

export const userAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/core/employees'), 
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/core/employees', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/core/employees/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/core/employees/${id}`),
};

export const customerAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/sales/customers'),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/sales/customers', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/sales/customers/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/sales/customers/${id}`),
};

export const promotionAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/sales/promotions'),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/sales/promotions', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/sales/promotions/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/sales/promotions/${id}`),
  check: (data: { code: string, orderTotal: number }) => 
    apiClient.post<BackendBaseResponse<any>>('/api/sales/promotions/check', data),
};

export const workShiftAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/core/work-shifts'),
  checkIn: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/core/work-shifts/check-in', data),
  checkOut: (id: number) => apiClient.patch<BackendBaseResponse<any>>(`/api/core/work-shifts/${id}/check-out`),
};

export const cashbookAPI = {
  getAll: (params: { method?: 'CASH' | 'BANK_TRANSFER'; type?: 'INCOME' | 'EXPENSE'; search?: string }) => 
    apiClient.get<BackendBaseResponse<CashbookTransactionResponse[]>>('/api/finance/cashbooks', { params }),
  create: (data: CashbookTransactionRequest) => 
    apiClient.post<BackendBaseResponse<CashbookTransactionResponse>>('/api/finance/cashbooks', data),
  paySupplier: (data: SupplierDebtPaymentRequest) => 
    apiClient.post<BackendBaseResponse<CashbookTransactionResponse>>('/api/finance/cashbooks/pay-supplier', data),
};

// --- LOYALTY VÀ ORDER API ---
export const loyaltyAPI = {
  getMembers: (search?: string) => 
    apiClient.get<BackendBaseResponse<any[]>>('/api/sales/loyalty/members', { params: { search } }),
  getConfig: () => 
    apiClient.get<BackendBaseResponse<LoyaltyConfig>>('/api/sales/loyalty/config'),
  saveConfig: (data: LoyaltyConfig) => 
    apiClient.post<BackendBaseResponse<LoyaltyConfig>>('/api/sales/loyalty/config', data),
};

export const orderAPI = {
  // Lấy tất cả (giữ nguyên của em)
  getAll: () => apiClient.get('/api/sales/orders'),

  // 1. THÊM MỚI: Hàm lấy danh sách có bộ lọc (Dùng cho Online, Tại quầy, Hủy)
  query: (params: any) => apiClient.get('/api/sales/orders', { params }),

  // 2. THÊM MỚI: Hàm cập nhật trạng thái (Dùng để Duyệt đơn hoặc Hủy đơn)
  // id: mã đơn hàng, status: 'COMPLETED' hoặc 'CANCELLED'
  updateStatus: (id: number, status: string) => 
    apiClient.patch(`/api/sales/orders/${id}/status`, { status }),

  // 3. THÊM MỚI: Hàm xuất Excel (nếu em cần dùng nút Xuất Excel)
  exportExcel: (params: any) => 
    apiClient.get('/api/sales/orders/export', { params, responseType: 'blob' }),

  // Các hàm cũ của em (giữ nguyên)
  getById: (id: number) => apiClient.get(`/api/sales/orders/${id}`),
  create: (data: any) => apiClient.post('/api/sales/orders', data),
};

// --- PHIẾU NHẬP, XUẤT VÀ KIỂM KHO ---
export const importTicketAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/inventory/import-tickets'),
  getById: (id: number) => apiClient.get<BackendBaseResponse<any>>(`/api/inventory/import-tickets/${id}`),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/inventory/import-tickets', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/import-tickets/${id}`, data),
  cancel: (id: number) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/import-tickets/${id}/cancel`)
};

export const exportTicketAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/inventory/export-tickets/get-all'),
  getById: (id: number) => apiClient.get<BackendBaseResponse<any>>(`/api/inventory/export-tickets/${id}`),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/inventory/export-tickets/create', data),
  cancel: (id: number) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/export-tickets/cancel/${id}`),
};

// Chỉ giữ lại MỘT khai báo cho inventoryCheckAPI
export const inventoryCheckAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/inventory/inventory-checks/get-all'),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/inventory/inventory-checks/create', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/inventory-checks/update/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<string>>(`/api/inventory/inventory-checks/delete/${id}`),
  balance: (id: number) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/inventory-checks/balance/${id}`),
};
export const transferTicketAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/inventory/transfer-tickets/get-all'),
  create: (data: any) => apiClient.post<BackendBaseResponse<any>>('/api/inventory/transfer-tickets/create', data),
  update: (id: number, data: any) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/transfer-tickets/update/${id}`, data),
  delete: (id: number) => apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/transfer-tickets/delete/${id}`),
  process: (id: number) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/transfer-tickets/process/${id}`),
  confirm: (id: number) => apiClient.put<BackendBaseResponse<any>>(`/api/inventory/transfer-tickets/confirm/${id}`),
};
export const returnTicketAPI = {
  getByType: (type: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN') => 
    apiClient.get<BackendBaseResponse<any[]>>(`/api/inventory/return-tickets/type/${type}`),
  getAll: () => 
    apiClient.get<BackendBaseResponse<any[]>>('/api/inventory/return-tickets'),

 
  
  getById: (id: number) => 
    apiClient.get<BackendBaseResponse<any>>(`/api/inventory/return-tickets/${id}`),
    
  create: (data: any) => 
    apiClient.post<BackendBaseResponse<any>>('/api/inventory/return-tickets', data),
    
  update: (id: number, data: any) => 
    apiClient.put<BackendBaseResponse<any>>(`/api/inventory/return-tickets/${id}`, data),
    
  // 🟢 HÀM XÓA PHIẾU ĐÃ ĐƯỢC CHUẨN HÓA VỚI BACKEND 🟢
  delete: (id: number) => 
    apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/return-tickets/${id}`),

  cancel: (id: number) => 
    apiClient.put<BackendBaseResponse<any>>(`/api/inventory/return-tickets/${id}/cancel`),
};


// --- ACTIVITY LOG API (Audit Log) ---
export const activityLogAPI = {
  getAll: (params?: {
    userId?: number;
    action?: string;
    entityType?: string;
    search?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient.get<BackendBaseResponse<PageResponse<ActivityLogResponse>>>(
      '/api/v1/activity-logs',
      { params }
    ),
};
export const dashboardAPI = {
  // 1. API GET Summary (Dùng cho 4 thẻ thống kê và đơn hàng gần đây)
  getStats: (params?: { startDate?: string; endDate?: string; storeId?: number | string }) => 
    apiClient.get<BackendBaseResponse<any>>('/api/dashboard/summary', { params }),

  // 2. API POST Báo cáo hiệu suất cửa hàng
  getStorePerformance: (data: { startDate: string; endDate: string; areaId?: number }) => 
    apiClient.post<BackendBaseResponse<any>>('/api/dashboard/stores-performance', data),

  // 3. API POST Xu hướng doanh thu theo cửa hàng (Dùng để vẽ biểu đồ)
  getStoreTrend: (storeId: number, data: { startDate: string; endDate: string }) => 
    apiClient.post<BackendBaseResponse<any>>(`/api/dashboard/store-trend/${storeId}`, data),
};
// --- REPORT API ---
export const reportAPI = {
  // 1. Báo cáo doanh thu (Dùng cho ProfitLossReport & StoreRevenueReport)
  getRevenue: (params: { startDate: string; endDate: string; period?: string; storeId?: number }) => 
    apiClient.get<BackendBaseResponse<any>>('/api/reports/revenue', { params }),

  // 2. Hiệu suất bán hàng nhân viên (Fix lỗi ảnh 5a6bcc)
  getEmployeePerformance: (params: { startDate: string, endDate: string, storeId?: number }) => 
    apiClient.get<BackendBaseResponse<any[]>>('/api/reports/employee-performance', { params }),

  // 3. Cơ cấu danh mục - Biểu đồ tròn (Fix lỗi ảnh 5ae42a)
  getCategoryRatio: () => 
    apiClient.get<BackendBaseResponse<any[]>>('/api/reports/category-ratio'),

  // 4. Top sản phẩm bán chạy (Dùng cho SystemInventoryReport & TopProductsReport)
  getProductSales: (params: { startDate?: string; endDate?: string; limit?: number; storeId?: number }) => 
    apiClient.get<BackendBaseResponse<any>>('/api/reports/top-products', { params }),

  // 5. So sánh hiệu suất cửa hàng (Dùng cho StorePerformanceReport)
  getStoreComparison: (params: { startDate: string; endDate: string }) => 
    apiClient.get<BackendBaseResponse<any>>('/api/reports/store-comparison', { params }),
    
  // 6. Báo cáo công nợ
  getDebtReport: (params?: any) => 
    apiClient.get<BackendBaseResponse<any>>('/api/reports/debt', { params }),
};

export const productPricingAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<ProductPricingResponse[]>>('/api/inventory/productPricings'),
  
  setup: (data: ProductPricingRequest) => 
    apiClient.post<BackendBaseResponse<ProductPricingResponse>>('/api/inventory/productPricings/setup', data),
    
  approve: (id: number) => 
    apiClient.put<BackendBaseResponse<string>>(`/api/inventory/productPricings/${id}/approve`),
    
  bulkApprove: (ids: number[]) => 
    apiClient.post<BackendBaseResponse<string>>('/api/inventory/productPricings/bulk-approve', ids),
    
  delete: (id: number) => 
    apiClient.delete<BackendBaseResponse<string>>(`/api/inventory/productPricings/${id}`),
};
export default apiClient;