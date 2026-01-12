// ============================================
// ENTITY DEFINITIONS - QUẢN LÝ CHUỖI CỬA HÀNG BÁN LẺ
// ============================================

// ========== ENUMS ==========
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',           // Nhân viên bán hàng
  MANAGER = 'MANAGER',       // Quản lý cửa hàng
  ADMIN = 'ADMIN',           // Quản trị viên hệ thống
  SUPER_ADMIN = 'SUPER_ADMIN' // Siêu quản trị viên - quản lý tất cả
}

export enum PaymentMethod {
  CASH = 'CASH',             // Tiền mặt
  QR_CODE = 'QR_CODE',       // QR Code
  CARD = 'CARD'              // Thẻ
}

export enum OrderStatus {
  PENDING = 'PENDING',       // Chờ xử lý
  PROCESSING = 'PROCESSING', // Đang xử lý
  COMPLETED = 'COMPLETED',   // Hoàn thành
  CANCELLED = 'CANCELLED'    // Đã hủy
}

export enum InventoryTransactionType {
  IMPORT = 'IMPORT',         // Nhập kho
  EXPORT = 'EXPORT',         // Xuất kho
  TRANSFER = 'TRANSFER',     // Điều chuyển kho
  ADJUSTMENT = 'ADJUSTMENT'  // Điều chỉnh
}

export enum AIRecommendationType {
  LOW_STOCK = 'LOW_STOCK',           // Cảnh báo tồn kho thấp
  DEMAND_PREDICTION = 'DEMAND_PREDICTION', // Dự đoán nhu cầu
  SLOW_MOVING = 'SLOW_MOVING',       // Sản phẩm bán chậm
  REVENUE_ANOMALY = 'REVENUE_ANOMALY', // Bất thường doanh thu
  TRANSFER_SUGGESTION = 'TRANSFER_SUGGESTION' // Đề xuất điều chuyển
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

// ========== CORE ENTITIES ==========

/**
 * Store Entity - Cửa hàng/Chi nhánh
 */
export interface Store {
  id: string;
  code: string;              // Mã cửa hàng
  name: string;              // Tên cửa hàng
  address: string;           // Địa chỉ
  phone: string;             // Số điện thoại
  email?: string;            // Email
  managerId?: string;        // ID quản lý cửa hàng
  isActive: boolean;         // Trạng thái hoạt động
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Entity - Người dùng hệ thống
 */
export interface User {
  id: string;
  email: string;
  password?: string;         // Chỉ có khi tạo mới, không trả về khi query
  fullName: string;
  phone: string;
  role: UserRole;
  storeId?: string;         // Cửa hàng làm việc (null nếu là Admin)
  isActive: boolean;
  avatar?: string;           // URL ảnh đại diện
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category Entity - Danh mục sản phẩm
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;         // Danh mục cha (hỗ trợ danh mục đa cấp)
  image?: string;           // URL ảnh danh mục
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Entity - Sản phẩm
 */
export interface Product {
  id: string;
  code: string;             // Mã sản phẩm (SKU)
  name: string;
  description?: string;
  categoryId: string;
  image?: string;           // URL ảnh sản phẩm
  price: number;            // Giá bán
  costPrice?: number;       // Giá nhập (để tính lợi nhuận)
  unit: string;             // Đơn vị tính (cái, kg, thùng...)
  barcode?: string;         // Mã vạch
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inventory Entity - Tồn kho theo cửa hàng
 */
export interface Inventory {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;         // Số lượng tồn kho
  minStock: number;         // Mức tồn kho tối thiểu (ngưỡng cảnh báo)
  maxStock: number;         // Mức tồn kho tối đa
  lastUpdated: Date;
}

/**
 * InventoryTransaction Entity - Giao dịch kho
 */
export interface InventoryTransaction {
  id: string;
  storeId: string;
  productId: string;
  type: InventoryTransactionType;
  quantity: number;         // Số lượng (dương cho nhập, âm cho xuất)
  fromStoreId?: string;     // Cửa hàng nguồn (nếu là điều chuyển)
  toStoreId?: string;       // Cửa hàng đích (nếu là điều chuyển)
  reason?: string;          // Lý do
  createdBy: string;        // User ID
  createdAt: Date;
}

/**
 * Order Entity - Đơn hàng/Hóa đơn
 */
export interface Order {
  id: string;
  orderNumber: string;      // Số hóa đơn
  storeId: string;
  staffId: string;          // Nhân viên bán hàng
  customerId?: string;      // Khách hàng (nếu có)
  customerName?: string;    // Tên khách hàng (nếu không đăng ký)
  customerPhone?: string;  // SĐT khách hàng
  subtotal: number;         // Tổng tiền trước giảm giá
  discount: number;         // Số tiền giảm giá
  total: number;            // Tổng tiền sau giảm giá
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes?: string;           // Ghi chú
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OrderDetail Entity - Chi tiết đơn hàng
 */
export interface OrderDetail {
  id: string;
  orderId: string;
  productId: string;
  productName: string;      // Lưu tên sản phẩm tại thời điểm bán (để báo cáo chính xác)
  quantity: number;
  unitPrice: number;        // Giá tại thời điểm bán
  discount: number;         // Giảm giá cho sản phẩm này
  total: number;            // Tổng tiền = (unitPrice * quantity) - discount
}

/**
 * Promotion Entity - Khuyến mãi
 */
export interface Promotion {
  id: string;
  code: string;             // Mã khuyến mãi
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED'; // Loại giảm giá: % hoặc số tiền cố định
  discountValue: number;    // Giá trị giảm (% hoặc số tiền)
  minPurchase?: number;     // Giá trị đơn hàng tối thiểu
  maxDiscount?: number;     // Giảm giá tối đa (nếu là %)
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AIRecommendation Entity - Đề xuất từ AI-Agent
 */
export interface AIRecommendation {
  id: string;
  type: AIRecommendationType;
  storeId?: string;         // Cửa hàng liên quan (null nếu là toàn hệ thống)
  productId?: string;       // Sản phẩm liên quan
  title: string;            // Tiêu đề đề xuất
  message: string;          // Nội dung chi tiết
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: Record<string, any>; // Dữ liệu bổ sung (JSON)
  isRead: boolean;
  isResolved: boolean;      // Đã xử lý chưa
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * Notification Entity - Thông báo hệ thống
 */
export interface Notification {
  id: string;
  userId: string;           // Người nhận
  type: NotificationType;
  title: string;
  message: string;
  link?: string;            // Link liên kết (nếu có)
  isRead: boolean;
  createdAt: Date;
}

/**
 * ActivityLog Entity - Nhật ký hoạt động
 */
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;           // Hành động (CREATE_ORDER, UPDATE_INVENTORY...)
  entityType: string;       // Loại entity (Order, Product, Inventory...)
  entityId: string;         // ID của entity
  details?: Record<string, any>; // Chi tiết thay đổi
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * WorkShift Entity - Ca làm việc
 */
export interface WorkShift {
  id: string;
  storeId: string;
  userId: string;
  shiftDate: Date;          // Ngày làm việc
  startTime: Date;          // Giờ bắt đầu
  endTime?: Date;           // Giờ kết thúc (null nếu chưa kết thúc)
  notes?: string;
  createdAt: Date;
}

// ========== DTOs & VIEW MODELS ==========

/**
 * Dashboard Statistics - Thống kê dashboard
 */
export interface DashboardStats {
  totalRevenue: number;     // Tổng doanh thu
  totalOrders: number;      // Tổng số đơn hàng
  totalProducts: number;    // Tổng số sản phẩm
  lowStockProducts: number; // Số sản phẩm sắp hết hàng
  pendingRecommendations: number; // Số đề xuất chưa xử lý
  revenueGrowth: number;    // % tăng trưởng doanh thu
  orderGrowth: number;      // % tăng trưởng đơn hàng
}

/**
 * Revenue Report - Báo cáo doanh thu
 */
export interface RevenueReport {
  period: string;           // Kỳ báo cáo (ngày/tháng/năm)
  revenue: number;
  orders: number;
  averageOrderValue: number;
  profit?: number;          // Lợi nhuận (nếu có costPrice)
  profitMargin?: number;    // Tỷ suất lợi nhuận (%)
}

/**
 * Product Sales Report - Báo cáo bán hàng theo sản phẩm
 */
export interface ProductSalesReport {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit?: number;
}

/**
 * Store Comparison - So sánh cửa hàng
 */
export interface StoreComparison {
  storeId: string;
  storeName: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growth: number;           // % tăng trưởng
}

/**
 * Demand Prediction - Dự đoán nhu cầu
 */
export interface DemandPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;  // Nhu cầu dự đoán
  recommendedOrder: number; // Số lượng đề xuất nhập
  confidence: number;       // Độ tin cậy (0-100%)
  period: string;           // Kỳ dự đoán (7 ngày, 30 ngày...)
}

/**
 * Login Request/Response
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;        // Thời gian hết hạn (giây)
}
