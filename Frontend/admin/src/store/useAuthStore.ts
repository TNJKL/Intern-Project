import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { User } from '@/types/user';
import { userService } from '@/services/userService';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
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
          // Backend trả về data.data hoặc data tùy cấu hình
          const userData = response.data || response;
          set({ user: userData, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Nếu lỗi 401/403 thì Interceptor sẽ xử lý refresh, 
          // nhưng nếu vẫn lỗi thì có thể cần logout ở đây.
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
