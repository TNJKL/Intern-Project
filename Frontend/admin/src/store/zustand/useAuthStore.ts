// 📄 Vị trí file: src/store/zustand/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import axios from 'axios';
import type { User } from '@/types/user';
import { userService } from '@/services/user.service';

const NEXTJS_PROXY_URL = 'http://localhost:3000';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: (manual?: boolean) => void;
  fetchUser: () => Promise<void>;
  silentRefresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      // Đọc từ cookie non-HttpOnly (adminAccessToken) khi khởi tạo
      accessToken: Cookies.get('adminAccessToken') || null,
      isAuthenticated: !!Cookies.get('adminAccessToken'),

      setAuth: (user, accessToken) => {
        const isSecure = window.location.protocol === 'https:';
        // Lưu accessToken dưới dạng non-HttpOnly để request interceptor đọc được
        // refreshToken là HttpOnly — được proxy set, không cần xử lý ở đây
        Cookies.set('adminAccessToken', accessToken, {
          expires: 7,
          path: '/',
          sameSite: 'lax',
          secure: isSecure,
        });
        set({ user, accessToken, isAuthenticated: true });
      },

      logout: () => {
        // Chỉ xóa cookie non-HttpOnly mà js-cookie có quyền xóa
        // HttpOnly cookies (accessToken, refreshToken) do server quản lý
        Cookies.remove('adminAccessToken', { path: '/' });
        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = `http://localhost:3000/login?logout=true&t=${Date.now()}`;
      },

      fetchUser: async () => {
        try {
          const response = await userService.getProfile();
          const userData = response.data || response;
          set({ user: userData, isAuthenticated: true });
        } catch (error: any) {
          console.error('[AuthStore] fetchUser thất bại:', error);
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            Cookies.remove('adminAccessToken', { path: '/' });
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        }
      },

      silentRefresh: async () => {
        try {
          // Gọi refresh qua proxy với body rỗng.
          // Trình duyệt tự gửi kèm cookie refreshToken (HttpOnly) nhờ withCredentials: true.
          // Proxy forward cookie lên backend, backend xác thực và trả token mới.
          const response = await axios.post(
            `${NEXTJS_PROXY_URL}/api/v1/auth/refresh`,
            {}, // body rỗng
            {
              withCredentials: true,
              headers: { 'ngrok-skip-browser-warning': '69420' },
            }
          );

          const responseData = response.data;
          const newToken = responseData?.data?.accessToken || responseData?.accessToken;
          const newUser = responseData?.data?.user || responseData?.user;

          if (newToken) {
            const currentUser = newUser || get().user;
            if (currentUser) {
              get().setAuth(currentUser, newToken);
            } else {
              const isSecure = window.location.protocol === 'https:';
              Cookies.set('adminAccessToken', newToken, {
                expires: 7,
                path: '/',
                sameSite: 'lax',
                secure: isSecure,
              });
              set({ accessToken: newToken, isAuthenticated: true });
            }
            return true;
          }
          return false;
        } catch (error) {
          console.error('[AuthStore] Silent refresh thất bại:', error);
          return false;
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Chỉ cache user info, không cache token (token luôn đọc từ cookie)
      partialize: (state) => ({ user: state.user }),
    }
  )
);