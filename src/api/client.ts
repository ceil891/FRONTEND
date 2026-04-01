// src/api/client.ts

import axios, { AxiosError, AxiosInstance } from 'axios';
import { 
  BackendSize, BackendColor, BackendUnit, BackendSupplier, BackendCategory 
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
// 2. DANH SÁCH CÁC API
// ==========================================

// --- AUTH API ---
export const authAPI = {
  async login(email: string, password?: string) {
    const response = await apiClient.post('/api/auth/login', { email, password: password || '' });
    if (response.data.success && response.data.data?.accessToken) {
      setToken(response.data.data.accessToken);
    }
    return response.data;
  },
  async register(userData: any) {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },
  async logout() {
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
  getAll: () => apiClient.get('/api/inventory/sizes'),
  create: (data: any) => apiClient.post('/api/inventory/sizes', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/sizes/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/sizes/${id}`),
};

export const colorAPI = {
  getAll: () => apiClient.get('/api/inventory/colors'),
  create: (data: any) => apiClient.post('/api/inventory/colors', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/colors/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/colors/${id}`),
};

export const unitAPI = {
  getAll: () => apiClient.get('/api/inventory/units'),
  create: (data: any) => apiClient.post('/api/inventory/units', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/units/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/units/${id}`),
};

export const categoryAPI = {
  getAll: () => apiClient.get('/api/inventory/categories'),
  create: (data: any) => apiClient.post('/api/inventory/categories', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/categories/${id}`),
};

export const productAPI = {
  getAll: () => apiClient.get('/api/inventory/products'),
  create: (data: any) => apiClient.post('/api/inventory/products', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/products/${id}`),
};

// --- CORE API ---
export const supplierAPI = {
  getAll: () => apiClient.get('/api/core/suppliers'),
  create: (data: any) => apiClient.post('/api/core/suppliers', data),
  update: (id: number, data: any) => apiClient.put(`/api/core/suppliers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/core/suppliers/${id}`),
};

export const areaAPI = {
  getAll: () => apiClient.get('/api/core/areas'), 
  create: (data: any) => apiClient.post('/api/core/areas', data),
  update: (id: number, data: any) => apiClient.put(`/api/core/areas/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/core/areas/${id}`),
};

export const storeAPI = {
  getAll: () => apiClient.get('/api/core/stores'),
  create: (data: any) => apiClient.post('/api/core/stores', data),
  update: (id: number, data: any) => apiClient.put(`/api/core/stores/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/core/stores/${id}`),
};

export const userAPI = {
  getAll: () => apiClient.get('/api/core/employees'), 
  create: (data: any) => apiClient.post('/api/core/employees', data),
  update: (id: number, data: any) => apiClient.put(`/api/core/employees/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/core/employees/${id}`),
  toggleStatus: (id: number) => 
    apiClient.patch(`/api/core/employees/${id}/toggle-status`),
};

export const customerAPI = {
  getAll: () => apiClient.get('/api/sales/customers'),
  create: (data: any) => apiClient.post('/api/sales/customers', data),
  update: (id: number, data: any) => apiClient.put(`/api/sales/customers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/sales/customers/${id}`),
};

export const promotionAPI = {
  getAll: () => apiClient.get('/api/sales/promotions'),
  create: (data: any) => apiClient.post('/api/sales/promotions', data),
  update: (id: number, data: any) => apiClient.put(`/api/sales/promotions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/sales/promotions/${id}`),
  check: (data: { code: string, orderTotal: number }) => apiClient.post('/api/sales/promotions/check', data),
};

export const workShiftAPI = {
  getAll: () => apiClient.get('/api/core/work-shifts'),
  checkIn: (data: any) => apiClient.post('/api/core/work-shifts/check-in', data),
  checkOut: (id: number) => apiClient.patch(`/api/core/work-shifts/${id}/check-out`),
};

export const cashbookAPI = {
  getAll: (params: any) => apiClient.get('/api/finance/cashbooks', { params }),
  create: (data: any) => apiClient.post('/api/finance/cashbooks', data),
  paySupplier: (data: any) => apiClient.post('/api/finance/cashbooks/pay-supplier', data),
};

// --- LOYALTY VÀ ORDER API ---
export const loyaltyAPI = {
  getMembers: (search?: string) => apiClient.get('/api/sales/loyalty/members', { params: { search } }),
  getConfig: () => apiClient.get('/api/sales/loyalty/config'),
  saveConfig: (data: any) => apiClient.post('/api/sales/loyalty/config', data),
};

export const orderAPI = {
  getAll: () => apiClient.get('/api/sales/orders'),
  query: (params: any) => apiClient.get('/api/sales/orders', { params }),
  updateStatus: (id: number, status: string) => apiClient.patch(`/api/sales/orders/${id}/status`, { status }),
  exportExcel: (params: any) => apiClient.get('/api/sales/orders/export', { params, responseType: 'blob' }),
  getById: (id: number) => apiClient.get(`/api/sales/orders/${id}`),
  create: (data: any) => apiClient.post('/api/sales/orders', data),
};

// --- PHIẾU NHẬP, XUẤT VÀ KIỂM KHO ---
export const importTicketAPI = {
  getAll: () => apiClient.get('/api/inventory/import-tickets'),
  getById: (id: number) => apiClient.get(`/api/inventory/import-tickets/${id}`),
  create: (data: any) => apiClient.post('/api/inventory/import-tickets', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/import-tickets/${id}`, data),
  cancel: (id: number) => apiClient.put(`/api/inventory/import-tickets/${id}/cancel`)
};

export const exportTicketAPI = {
  getAll: () => apiClient.get('/api/inventory/export-tickets/get-all'),
  getById: (id: number) => apiClient.get(`/api/inventory/export-tickets/${id}`),
  create: (data: any) => apiClient.post('/api/inventory/export-tickets/create', data),
  cancel: (id: number) => apiClient.put(`/api/inventory/export-tickets/cancel/${id}`),
};

export const inventoryCheckAPI = {
  getAll: () => apiClient.get('/api/inventory/inventory-checks/get-all'),
  create: (data: any) => apiClient.post('/api/inventory/inventory-checks/create', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/inventory-checks/update/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/inventory-checks/delete/${id}`),
  balance: (id: number) => apiClient.put(`/api/inventory/inventory-checks/balance/${id}`),
};

export const transferTicketAPI = {
  getAll: () => apiClient.get('/api/inventory/transfer-tickets/get-all'),
  create: (data: any) => apiClient.post('/api/inventory/transfer-tickets/create', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/transfer-tickets/update/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/transfer-tickets/delete/${id}`),
  process: (id: number) => apiClient.put(`/api/inventory/transfer-tickets/process/${id}`),
  confirm: (id: number) => apiClient.put(`/api/inventory/transfer-tickets/confirm/${id}`),
};

export const returnTicketAPI = {
  getByType: (type: string) => apiClient.get(`/api/inventory/return-tickets/type/${type}`),
  getById: (id: number) => apiClient.get(`/api/inventory/return-tickets/${id}`),
  create: (data: any) => apiClient.post('/api/inventory/return-tickets', data),
  update: (id: number, data: any) => apiClient.put(`/api/inventory/return-tickets/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/inventory/return-tickets/${id}`),
  cancel: (id: number) => apiClient.put(`/api/inventory/return-tickets/${id}/cancel`),
};

// --- ACTIVITY LOG API (Audit Log) ---
export const activityLogAPI = {
  getAll: (params?: any) => apiClient.get('/api/v1/activity-logs', { params }),
};


export const dashboardAPI = {
  // Lấy dữ liệu 4 thẻ
  getStats: (params?: any) => apiClient.get('/api/dashboard/summary', { params }),
  // Báo cáo chi nhánh
  getStorePerformance: (data: any) => apiClient.post('/api/dashboard/stores-performance', data),
  // Biểu đồ xu hướng
  getStoreTrend: (storeId: number, data: any) => apiClient.post(`/api/dashboard/store-trend/${storeId}`, data),
};


export const reportAPI = {
  getRevenue: (params: any) => apiClient.get('/api/reports/revenue', { params }),
  getProductSales: (params: any) => apiClient.get('/api/reports/top-products', { params }),
  getStoreComparison: (params: any) => apiClient.get('/api/reports/store-comparison', { params }),
  // Đã thêm 2 hàm này cho bác để không bị lỗi màn Bảng giá và Nhân viên
  getEmployeePerformance: (params: any) => apiClient.get('/api/reports/employee-performance', { params }),
  getCategoryRatio: () => apiClient.get('/api/reports/category-ratio'),
  getDebtReport: (params?: any) => apiClient.get('/api/reports/debt', { params }),
};


export const productPricingAPI = {
  getAll: () => apiClient.get('/api/inventory/productPricings'),
  search: (query: string) => apiClient.get('/api/inventory/productPricings/search', { params: { query } }),
  setup: (data: any) => apiClient.post('/api/inventory/productPricings/setup', data),
  approve: (id: number) => apiClient.put(`/api/inventory/productPricings/${id}/approve`),
  bulkApprove: (ids: number[]) => apiClient.post('/api/inventory/productPricings/bulk-approve', ids),
  delete: (id: number) => apiClient.delete(`/api/inventory/productPricings/${id}`),
};

export default apiClient;