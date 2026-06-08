// 📄 Vị trí file: src/store/zustand/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import axios from 'axios';
import type { User } from '@/types/user';
import { userService } from '@/services/user.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  silentRefresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: Cookies.get('adminAccessToken') || Cookies.get('accessToken') || null,
      isAuthenticated: !!(Cookies.get('adminAccessToken') || Cookies.get('accessToken')),

      setAuth: (user, accessToken) => {
        const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || window.location.pathname.startsWith('/admin');

        const isSecure = window.location.protocol === 'https:';
        if (isAdmin) {
          Cookies.set('adminAccessToken', accessToken, { expires: 7, path: '/', sameSite: 'lax', secure: isSecure });
        } else {
          Cookies.set('accessToken', accessToken, { expires: 7, path: '/', sameSite: 'lax', secure: isSecure });
        }

        set({ user, accessToken, isAuthenticated: true });
      },

      logout: () => {
        Cookies.remove('adminAccessToken', { path: '/' });
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });

        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = `http://localhost:3000/login?logout=true&t=${Date.now()}`;
      },

      fetchUser: async () => {
        try {
          const response = await userService.getProfile();
          const userData = response.data || response;
          set({ user: userData, isAuthenticated: true });
        } catch (error: any) {
          console.error('Failed to fetch user profile:', error);
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            Cookies.remove('adminAccessToken', { path: '/' });
            Cookies.remove('accessToken', { path: '/' });
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        }
      },

      silentRefresh: async () => {
        try {
          const refreshUrl = 'http://localhost:3000/api/auth/session-token';
          const response = await axios.get(refreshUrl, {
            withCredentials: true,
            headers: {
              'ngrok-skip-browser-warning': '69420',
            }
          });

          const responseData = response.data;
          const newToken = responseData?.accessToken;
          const user = responseData?.user;

          if (newToken && responseData?.error !== 'RefreshTokenError') {
            const currentUser = user || get().user;
            if (currentUser) {
              get().setAuth(currentUser, newToken);
            } else {
              set({ accessToken: newToken, isAuthenticated: true });
            }
            return true;
          }
          return false;
        } catch (error) {
          console.error('[AuthStore] Silent refresh thông qua Proxy thất bại:', error);
          return false;
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }), // Chỉ cache thông tin user, không cache Token tĩnh
    }
  )
);