import { create } from 'zustand';
import { apiClient } from '../lib/api-client';

export interface AdminUser {
  username: string;
  id?: number;
  created_at?: string;
  ip_address?: string;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  checkAuth: () => Promise<boolean>;
  setAuth: (user: AdminUser) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const res = await apiClient.get('/api/v1/admin/me');
      if (res.status === 'success' && res.data) {
        set({
          user: res.data,
          isAuthenticated: true,
          isCheckingAuth: false,
        });
        return true;
      }
    } catch {
      // 401 or network error -> not authenticated
    }

    set({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: false,
    });
    return false;
  },

  setAuth: (user: AdminUser) => {
    set({
      user,
      isAuthenticated: true,
      isCheckingAuth: false,
    });
  },

  logout: async () => {
    try {
      await apiClient.post('/api/v1/admin/logout');
    } catch {}

    set({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: false,
    });

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
