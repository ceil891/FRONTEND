export interface BackendBaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// LƯU Ý: Enum phải được gán giá trị String, nếu không bạn sẽ bị lỗi so sánh khi Đăng nhập
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface BackendSize {
  id: number;
  name: string;
  description?: string | null;
  status: string; 
}

export interface BackendColor {
  id: number;
  name: string;
  hexCode: string;
  status: string; 
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  storeId?: string | null; 
  isActive: boolean;
  avatar?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number; 
}

export interface BackendUnit {
  id: number;
  code: string; 
  name: string; 
  description?: string; 
  status: string; 
}

export interface BackendSupplier {
  id: number;
  supplierCode: string; 
  supplierName: string; 
  contactName?: string; 
  phone?: string;
  email?: string;
  address?: string;
  debtAmount: number; 
  status: string; 
}

export interface BackendCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}