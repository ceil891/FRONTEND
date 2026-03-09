import axios from 'axios';

// ================== AXIOS INSTANCE ==================

const BASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_BASE_URL) ||
  'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

const V1_PREFIX = '/api/v1';

// ================== COMMON TYPES ==================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Simple Spring Page wrapper used by activity logs
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ================== BACKEND DTO TYPES ==================

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

export interface BackendCategory {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSanPham {
  sanPhamId: number;
  maSku: string;
  tenSanPham: string;
  danhMucId?: number | null;
  tenDanhMuc?: string | null;
  donViId?: number | null;
  tenDonVi?: string | null;
  thuongHieu?: string | null;
  giaBan?: number | null;
  giaNhap?: number | null;
  maVach?: string | null;
  moTa?: string | null;
  hoatDong: boolean;
  hinhAnhUrls?: string[] | null;
}

export interface BackendInventory {
  id: number;
  storeId: number;
  productId: number;
  quantity: number;
  minStock: number;
  maxStock?: number | null;
  lastUpdated: string;
}

export interface BackendDonVi {
  donViId: number;
  tenDonVi: string;
}

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

export interface BackendWorkShift {
  id: number;
  storeId: number;
  userId: number;
  shiftDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime?: string | null; // HH:mm
  notes?: string | null;
  createdAt: string;
}

export interface BackendHoaDonDTO {
  hoaDonId: number;
  maHoaDon?: string | null;
  ngayLap: string;
  tenKhachHang?: string | null;
  dienThoaiKhachHang?: string | null;
  kenhBan?: string | null;
  tamTinh?: number | null;
  chietKhau?: number | null;
  tongPhaiThanhToan?: number | null;
  tenNhanVien?: string | null;
  tenCuaHang?: string | null;
  trangThai?: string | null;
  // Hủy đơn
  lyDoHuy?: string | null;
  nguoiHuy?: string | null;
  ngayHuy?: string | null;
}

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

export interface BackendAIRecommendation {
  id: number;
  type: string;
  storeId?: number | null;
  productId?: number | null;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: Record<string, any> | null;
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

export interface BackendActivityLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  aiRecommendations: boolean;
}

export interface BackendSupplier {
  nhaCungCapId: number;
  tenNhaCungCap: string;
  dienThoai?: string | null;
  email?: string | null;
  diaChi?: string | null;
  nguoiLienHe?: string | null;
  maSoThue?: string | null;
  trangThai?: string | null;
}

// ================== STORE API ==================

export const storeAPI = {
  getAll: () =>
    api.get<ApiResponse<BackendStore[]>>(`${V1_PREFIX}/cua-hang`),

  getById: (id: number) =>
    api.get<ApiResponse<BackendStore>>(`${V1_PREFIX}/cua-hang/${id}`),

  create: (payload: {
    code: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    isActive?: boolean;
  }) => api.post<ApiResponse<BackendStore>>(`${V1_PREFIX}/cua-hang`, payload),

  update: (
    id: number,
    payload: {
      name: string;
      address: string;
      phone: string;
      email?: string;
      isActive?: boolean;
    },
  ) =>
    api.put<ApiResponse<BackendStore>>(
      `${V1_PREFIX}/cua-hang/${id}`,
      payload,
    ),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`${V1_PREFIX}/cua-hang/${id}`),
};

// ================== USER API ==================

export const userAPI = {
  getAll: (params?: { role?: string; storeId?: number }) =>
    api.get<ApiResponse<BackendUser[]>>(`${V1_PREFIX}/users`, {
      params,
    }),

  getById: (id: string | number) =>
    api.get<ApiResponse<BackendUser>>(`${V1_PREFIX}/users/${id}`),

  create: (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    storeId?: number;
  }) => api.post<ApiResponse<BackendUser>>(`${V1_PREFIX}/users`, payload),

  update: (
    id: string | number,
    payload: {
      fullName: string;
      email: string;
      password?: string;
      phone?: string;
      role: string;
      storeId?: number;
    },
  ) =>
    api.put<ApiResponse<BackendUser>>(
      `${V1_PREFIX}/users/${id}`,
      payload,
    ),

  toggleActive: (id: string | number) =>
    api.put<ApiResponse<BackendUser>>(
      `${V1_PREFIX}/users/${id}/toggle-active`,
    ),

  delete: (id: string | number) =>
    api.delete<ApiResponse<void>>(`${V1_PREFIX}/users/${id}`),
};

// ================== CATEGORY API ==================

export const categoryAPI = {
  getAll: (params?: { parentId?: number }) =>
    api.get<ApiResponse<BackendCategory[]>>(
      `${V1_PREFIX}/danh-muc`,
      { params },
    ),

  create: (payload: {
    name: string;
    description?: string | null;
    parentId?: number | null;
  }) =>
    api.post<ApiResponse<BackendCategory>>(
      `${V1_PREFIX}/danh-muc`,
      payload,
    ),

  update: (id: number, payload: Partial<BackendCategory>) =>
    api.put<ApiResponse<BackendCategory>>(
      `${V1_PREFIX}/danh-muc/${id}`,
      payload,
    ),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`${V1_PREFIX}/danh-muc/${id}`),
};

// ================== PRODUCT API ==================

export const productAPI = {
  // Lấy tất cả sản phẩm (List<SanPham>)
  getAll: () =>
    api.get<BackendSanPham[]>(`${V1_PREFIX}/san-pham`),

  // Tạo sản phẩm mới (SanPhamDTO)
  create: (payload: {
    maSku: string;
    tenSanPham: string;
    danhMucId: number;
    donViId: number;
    giaBan: number;
    giaNhap?: number;
    maVach?: string;
    moTa?: string;
    hoatDong: boolean;
    thuongHieu?: string;
    hinhAnhUrls?: string[];
  }) =>
    api.post(`${V1_PREFIX}/san-pham`, payload),

  // Cập nhật sản phẩm
  update: (
    sanPhamId: number,
    payload: {
      maSku: string;
      tenSanPham: string;
      danhMucId: number;
      donViId: number;
      giaBan: number;
      giaNhap?: number;
      maVach?: string;
      moTa?: string;
      hoatDong: boolean;
      thuongHieu?: string;
      hinhAnhUrls?: string[];
    },
  ) =>
    api.put(`${V1_PREFIX}/san-pham/${sanPhamId}`, payload),

  delete: (sanPhamId: number) =>
    api.delete(`${V1_PREFIX}/san-pham/${sanPhamId}`),
};

// ================== INVENTORY API ==================

export const inventoryAPI = {
  getAll: (params?: { storeId?: number; productId?: number }) =>
    api.get<ApiResponse<BackendInventory[]>>(
      `${V1_PREFIX}/inventory`,
      { params },
    ),

  createTransaction: (payload: {
    storeId: number;
    productId: number;
    type: 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'ADJUSTMENT';
    quantity: number;
    fromStoreId?: number;
    toStoreId?: number;
    reason?: string;
  }) =>
    api.post<ApiResponse<any>>(
      `${V1_PREFIX}/inventory/transaction`,
      payload,
    ),
};

// ================== SUPPLIER / NHÀ CUNG CẤP API ==================

export const supplierAPI = {
  getAll: (params?: { keyword?: string }) =>
    api.get<BackendSupplier[]>(
      `${V1_PREFIX}/nha-cung-cap`,
      { params },
    ),

  create: (payload: {
    tenNhaCungCap: string;
    dienThoai?: string;
    email?: string;
    diaChi?: string;
    nguoiLienHe?: string;
    maSoThue?: string;
    trangThai?: string;
  }) =>
    api.post<BackendSupplier>(
      `${V1_PREFIX}/nha-cung-cap`,
      payload,
    ),

  update: (
    id: number,
    payload: {
      tenNhaCungCap: string;
      dienThoai?: string;
      email?: string;
      diaChi?: string;
      nguoiLienHe?: string;
      maSoThue?: string;
      trangThai?: string;
    },
  ) =>
    api.put<BackendSupplier>(
      `${V1_PREFIX}/nha-cung-cap/${id}`,
      payload,
    ),

  delete: (id: number) =>
    api.delete<void>(`${V1_PREFIX}/nha-cung-cap/${id}`),
};

// ================== UNIT / ĐƠN VỊ API ==================

export const unitAPI = {
  getAll: () =>
    api.get<BackendDonVi[]>(`${V1_PREFIX}/don-vi`),

  create: (payload: { tenDonVi: string }) =>
    api.post<BackendDonVi>(`${V1_PREFIX}/don-vi`, payload),

  update: (id: number, payload: { tenDonVi: string }) =>
    api.put<BackendDonVi>(`${V1_PREFIX}/don-vi/${id}`, payload),

  delete: (id: number) =>
    api.delete<void>(`${V1_PREFIX}/don-vi/${id}`),
};

// ================== PROMOTION API ==================

export const promotionAPI = {
  // KhuyenMaiController trả về List<KhuyenMai> (không bọc ApiResponse)
  getAll: () =>
    api.get<BackendPromotion[]>(`${V1_PREFIX}/khuyen-mai`),

  create: (payload: Omit<BackendPromotion, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<BackendPromotion>(`${V1_PREFIX}/khuyen-mai`, payload),

  update: (id: number, payload: Omit<BackendPromotion, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.put<BackendPromotion>(`${V1_PREFIX}/khuyen-mai/${id}`, payload),

  delete: (id: number) =>
    api.delete<void>(`${V1_PREFIX}/khuyen-mai/${id}`),
};

// ================== NOTIFICATION API ==================

export const notificationAPI = {
  getAll: (params?: { isRead?: boolean }) =>
    api.get<ApiResponse<BackendNotification[]>>(
      `${V1_PREFIX}/notifications`,
      { params },
    ),

  create: (payload: {
    userId: number;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) =>
    api.post<ApiResponse<BackendNotification>>(
      `${V1_PREFIX}/notifications`,
      payload,
    ),

  markAsRead: (id: number) =>
    api.put<ApiResponse<BackendNotification>>(
      `${V1_PREFIX}/notifications/${id}/read`,
    ),

  markAllAsRead: () =>
    api.put<ApiResponse<void>>(
      `${V1_PREFIX}/notifications/read-all`,
    ),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(
      `${V1_PREFIX}/notifications/${id}`,
    ),
};

// ================== WORK SHIFT API ==================

export const workShiftAPI = {
  getAll: (params?: {
    storeId?: number;
    userId?: number;
    shiftDate?: string; // yyyy-MM-dd
  }) =>
    api.get<ApiResponse<BackendWorkShift[]>>(
      `${V1_PREFIX}/work-shifts`,
      { params },
    ),

  create: (payload: {
    storeId: number;
    userId: number;
    shiftDate: string;
    startTime: string;
    endTime?: string;
    notes?: string;
  }) =>
    api.post<ApiResponse<BackendWorkShift>>(
      `${V1_PREFIX}/work-shifts`,
      payload,
    ),

  update: (
    id: number,
    payload: {
      storeId: number;
      userId: number;
      shiftDate: string;
      startTime: string;
      endTime?: string;
      notes?: string;
    },
  ) =>
    api.put<ApiResponse<BackendWorkShift>>(
      `${V1_PREFIX}/work-shifts/${id}`,
      payload,
    ),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(
      `${V1_PREFIX}/work-shifts/${id}`,
    ),
};

// ================== ORDER / HÓA ĐƠN API ==================

export const orderAPI = {
  // Tạo đơn từ POS
  create: (payload: any) =>
    api.post(`${V1_PREFIX}/hoa-don`, payload),

  // Truy vấn danh sách đơn theo điều kiện
  query: (params: {
    storeId?: number;
    channel?: string;
    status?: string;
    from?: string;
    to?: string;
    keyword?: string;
  }) =>
    api.get<BackendHoaDonDTO[]>(
      `${V1_PREFIX}/hoa-don/query`,
      { params },
    ),

  // Xuất Excel (mảng byte)
  exportExcel: (params: {
    storeId?: number;
    channel?: string;
    status?: string;
    from?: string;
    to?: string;
    keyword?: string;
  }) =>
    api.get<ArrayBuffer>(
      `${V1_PREFIX}/hoa-don/export`,
      {
        params,
        responseType: 'arraybuffer',
      },
    ),
};

// ================== ORDER HISTORY / SỔ QUỸ API ==================

export const orderHistoryAPI = {
  getAll: (params?: {
    from?: string;
    to?: string;
    keyword?: string;
  }) =>
    api.get<BackendOrderHistoryRow[]>(
      `${V1_PREFIX}/order-history`,
      { params },
    ),

  exportExcel: (params?: {
    from?: string;
    to?: string;
    keyword?: string;
  }) =>
    api.get<ArrayBuffer>(
      `${V1_PREFIX}/order-history/export`,
      {
        params,
        responseType: 'arraybuffer',
      },
    ),
};

// ================== DASHBOARD API ==================

export const dashboardAPI = {
  getStats: (params?: {
    storeId?: number;
    startDate?: string; // yyyy-MM-dd
    endDate?: string; // yyyy-MM-dd
  }) =>
    api.get<ApiResponse<any>>(
      `${V1_PREFIX}/dashboard/stats`,
      { params },
    ),
};

// ================== AI / AGENT API ==================

export const aiAPI = {
  getRecommendations: (params?: {
    storeId?: number;
    type?: string;
    priority?: string;
    isResolved?: boolean;
  }) =>
    api.get<ApiResponse<BackendAIRecommendation[]>>(
      `${V1_PREFIX}/ai/recommendations`,
      { params },
    ),

  getPredictions: (params?: { storeId?: number }) =>
    api.get<ApiResponse<BackendDemandPrediction[]>>(
      `${V1_PREFIX}/ai/predictions`,
      { params },
    ),

  markAsRead: (id: number) =>
    api.put<ApiResponse<BackendAIRecommendation>>(
      `${V1_PREFIX}/ai/recommendations/${id}/read`,
    ),

  markAsResolved: (id: number) =>
    api.put<ApiResponse<BackendAIRecommendation>>(
      `${V1_PREFIX}/ai/recommendations/${id}/resolve`,
    ),
};

// ================== ACTIVITY LOG API ==================

export const activityLogAPI = {
  getAll: (
    userId?: number,
    action?: string,
    entityType?: string,
    search?: string,
    page: number = 0,
    size: number = 20,
  ) =>
    api.get<ApiResponse<Page<BackendActivityLog>>>(
      `${V1_PREFIX}/activity-logs`,
      {
        params: {
          userId,
          action,
          entityType,
          search,
          page,
          size,
        },
      },
    ),
};

// ================== SETTINGS (CURRENT USER) API ==================

export const settingsAPI = {
  getCurrentUser: () =>
    api.get<ApiResponse<BackendUser>>(
      `${V1_PREFIX}/users/me`,
    ),

  updateProfile: (payload: {
    fullName: string;
    phone?: string;
  }) =>
    api.put<ApiResponse<BackendUser>>(
      `${V1_PREFIX}/users/me`,
      payload,
    ),

  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) =>
    api.put<ApiResponse<void>>(
      `${V1_PREFIX}/users/me/password`,
      payload,
    ),

  getNotificationSettings: () =>
    api.get<ApiResponse<NotificationSettings>>(
      `${V1_PREFIX}/users/me/settings`,
    ),

  updateNotificationSettings: (payload: NotificationSettings) =>
    api.put<ApiResponse<void>>(
      `${V1_PREFIX}/users/me/settings`,
      payload,
    ),
};

// ================== DEFAULT EXPORT (OPTIONAL) ==================

export default api;

