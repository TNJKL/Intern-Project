import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import axios from 'axios';
import type { User } from '@/types/user';
import { userService } from '@/services/user.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  silentRefresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: Cookies.get('adminAccessToken') || null,
      refreshToken: Cookies.get('adminRefreshToken') || null,
      isAuthenticated: !!Cookies.get('adminAccessToken'),
      
      setAuth: (user, accessToken, _refreshToken) => {
        Cookies.set('adminAccessToken', accessToken, { expires: 7, path: '/' });
        set({ user, accessToken, refreshToken: null, isAuthenticated: true });
      },
      
      logout: () => {
        Cookies.remove('adminAccessToken', { path: '/' });
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        window.location.href = `http://localhost:3000/login?logout=true&t=${Date.now()}`;
      },

      fetchUser: async () => {
        try {
          const response = await userService.getProfile();
          const userData = response.data || response;
          set({ user: userData, isAuthenticated: true });
        } catch (error: any) {
          console.error('Failed to fetch user profile:', error);
          
          // Chỉ logout nếu lỗi là 401 (Hết hạn) hoặc 403 (Không có quyền)
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            Cookies.remove('adminAccessToken', { path: '/' });
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          }
        }
      },

      silentRefresh: async () => {
        try {
          const isDev = import.meta.env.DEV;
          const refreshUrl = isDev ? 'http://localhost:3000/api/v1/auth/refresh' : '/api/v1/auth/refresh';

          const response = await axios.post(refreshUrl, {}, {
            withCredentials: true,
            headers: {
              'ngrok-skip-browser-warning': '69420',
            }
          });
          const responseData = response.data;
          const newToken = responseData?.data?.accessToken || responseData?.accessToken;
          const user = responseData?.data?.user || responseData?.user;

          if (newToken && user && user.role?.toUpperCase() === 'ADMIN') {
            Cookies.set('adminAccessToken', newToken, { expires: 7, path: '/' });
            set({ user, accessToken: newToken, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (error) {
          console.error('[AuthStore] Silent refresh failed:', error);
          return false;
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
