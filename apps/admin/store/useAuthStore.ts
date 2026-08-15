import { create } from 'zustand';

export interface AdminUser {
  username: string;
  id?: number;
  created_at?: string;
}

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  csrfToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: { user: AdminUser; accessToken: string; csrfToken?: string }) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('admin_user') || 'null') : null,
  accessToken: typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null,
  csrfToken: typeof window !== 'undefined' ? sessionStorage.getItem('admin_csrf') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!sessionStorage.getItem('admin_token') : false,
  isLoading: false,

  setAuth: ({ user, accessToken, csrfToken }) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_token', accessToken);
      sessionStorage.setItem('admin_user', JSON.stringify(user));
      if (csrfToken) {
        sessionStorage.setItem('admin_csrf', csrfToken);
      }
    }
    set({
      user,
      accessToken,
      csrfToken: csrfToken || null,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_csrf');
    }
    set({
      user: null,
      accessToken: null,
      csrfToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
