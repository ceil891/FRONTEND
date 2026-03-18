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
// 3. DANH SÁCH CÁC API
// ==========================================

// --- AUTH API ---
export const authAPI = {
  async login(email: string, password?: string): Promise<BackendBaseResponse<BackendLoginResponseData>> {
    const response = await apiClient.post<BackendBaseResponse<BackendLoginResponseData>>('/api/auth/login', {
      email,
      password: password || '', // Đảm bảo luôn gửi string
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
  getAll: () => 
    apiClient.get<BackendBaseResponse<BackendSize[]>>('/api/inventory/sizes'),
  create: (data: { name: string; description?: string; status: string }) => 
    apiClient.post<BackendBaseResponse<BackendSize>>('/api/inventory/sizes', data),
  update: (id: number, data: { name: string; description?: string; status: string }) => 
    apiClient.put<BackendBaseResponse<BackendSize>>(`/api/inventory/sizes/${id}`, data),
  delete: (id: number) => 
    apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/sizes/${id}`),
};

export const colorAPI = {
  getAll: () => 
    apiClient.get<BackendBaseResponse<BackendColor[]>>('/api/inventory/colors'),
  create: (data: { name: string; hexCode: string; status: string }) => 
    apiClient.post<BackendBaseResponse<BackendColor>>('/api/inventory/colors', data),
  update: (id: number, data: { name: string; hexCode: string; status: string }) => 
    apiClient.put<BackendBaseResponse<BackendColor>>(`/api/inventory/colors/${id}`, data),
  delete: (id: number) => 
    apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/colors/${id}`),
};

export const unitAPI = {
  getAll: () => 
    apiClient.get<BackendBaseResponse<BackendUnit[]>>('/api/inventory/units'),
  create: (data: { code: string; name: string; description?: string; status: string }) => 
    apiClient.post<BackendBaseResponse<BackendUnit>>('/api/inventory/units', data),
  update: (id: number, data: { code: string; name: string; description?: string; status: string }) => 
    apiClient.put<BackendBaseResponse<BackendUnit>>(`/api/inventory/units/${id}`, data),
  delete: (id: number) => 
    apiClient.delete<BackendBaseResponse<void>>(`/api/inventory/units/${id}`),
};

export const categoryAPI = {
  getAll: () => 
    apiClient.get<BackendBaseResponse<BackendCategory[]>>('/api/inventory/categories'),
  create: (data: { name: string; description?: string; parentId?: number; isActive: boolean }) => 
    apiClient.post<BackendBaseResponse<BackendCategory>>('/api/inventory/categories', data),
  update: (id: number, data: { name: string; description?: string; parentId?: number; isActive: boolean }) => 
    apiClient.put<BackendBaseResponse<BackendCategory>>(`/api/inventory/categories/${id}`, data),
  delete: (id: number) => 
    apiClient.delete<BackendBaseResponse<string>>(`/api/inventory/categories/${id}`),
};

// --- CORE API ---
export const supplierAPI = {
  getAll: () => 
    apiClient.get<BackendBaseResponse<BackendSupplier[]>>('/api/core/suppliers'),
  create: (data: any) => 
    apiClient.post<BackendBaseResponse<BackendSupplier>>('/api/core/suppliers', data),
  update: (id: number, data: any) => 
    apiClient.put<BackendBaseResponse<BackendSupplier>>(`/api/core/suppliers/${id}`, data),
  delete: (id: number) => 
    apiClient.delete<BackendBaseResponse<void>>(`/api/core/suppliers/${id}`),
};
export const areaAPI = {
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/core/areas'), // Chú ý: Cần đảm bảo Spring Boot của bạn đã có link này!
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
  getAll: () => apiClient.get<BackendBaseResponse<any[]>>('/api/core/employees'), // Kiểm tra lại đường dẫn bên Java của bạn
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
  // Lấy danh sách giao dịch có lọc theo Phương thức (Tiền mặt/Ngân hàng) và Loại (Thu/Chi)
  getAll: (params: { 
    method?: 'CASH' | 'BANK_TRANSFER'; 
    type?: 'INCOME' | 'EXPENSE'; 
    search?: string 
  }) => apiClient.get<BackendBaseResponse<CashbookTransactionResponse[]>>('/api/finance/cashbooks', { params }),

  // Tạo phiếu Thu/Chi thông thường
  create: (data: CashbookTransactionRequest) => 
    apiClient.post<BackendBaseResponse<CashbookTransactionResponse>>('/api/finance/cashbooks', data),

  // Trả nợ Nhà cung cấp
  paySupplier: (data: SupplierDebtPaymentRequest) => 
    apiClient.post<BackendBaseResponse<CashbookTransactionResponse>>('/api/finance/cashbooks/pay-supplier', data),
};
// --- LOYALTY API ---

export const loyaltyAPI = {
  getMembers: (search?: string) => 
    apiClient.get<BackendBaseResponse<any[]>>('/api/sales/loyalty/members', { params: { search } }),
  getConfig: () => 
    apiClient.get<BackendBaseResponse<LoyaltyConfig>>('/api/sales/loyalty/config'),
  saveConfig: (data: LoyaltyConfig) => 
    apiClient.post<BackendBaseResponse<LoyaltyConfig>>('/api/sales/loyalty/config', data),
};
export const orderAPI = {
  query: (params: any) => apiClient.get('/api/sales/orders', { params }),
  exportExcel: (params: any) => apiClient.get('/api/sales/orders/export', { params, responseType: 'blob' })
};
export default apiClient;