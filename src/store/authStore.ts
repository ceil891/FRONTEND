import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, LoginResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  isSuperAdmin: () => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (response: LoginResponse) => {
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      hasRole: (role: UserRole) => {
        const user = get().user;
        return user?.role === role;
      },
      isSuperAdmin: () => {
        const user = get().user;
        return user?.role === UserRole.SUPER_ADMIN;
      },
      hasAnyRole: (roles: UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === UserRole.SUPER_ADMIN) return true; // Super admin có tất cả quyền
        return roles.includes(user.role);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
