import axios from 'axios';
import { store } from '../store/redux/store';
import { updateAccessToken, clearCredentials } from '../store/redux/authSlice';
import { useAuthStore } from '../store/zustand/useAuthStore';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // BẮT BUỘC: để browser gửi kèm refreshToken cookie
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

// ─── Refresh token queue ───
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// ─── Request interceptor: Không cần gắn Token thủ công nữa, Proxy sẽ tự làm ───
apiClient.interceptors.request.use((config) => {
  return config;
});

// ─── Response interceptor ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED';
    const isAuthError = isExpired || error.response?.status === 401 || error.response?.status === 403;
    const user = useAuthStore.getState().user;

    if (!isAuthError || originalRequest._retry || !user) {
      if (isAuthError && !user && typeof window !== 'undefined') {
        document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "adminAccessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Chỉ cần "ra tín hiệu" bằng cách gọi POST tới refresh. 
      // Browser sẽ tự gửi refreshToken cookie và tự nhận Set-Cookie mới từ Backend.
      await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });

      processQueue(null, ""); 
      // Retry request gốc — lúc này browser đã có accessToken cookie mới
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Xóa toàn bộ trạng thái auth khỏi RAM
      store.dispatch(clearCredentials());
      
      // Chỉ chuyển hướng về login nếu đang truy cập một trang được bảo vệ
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const protectedPaths = ['/profile', '/admin', '/orders'];
        const isProtected = protectedPaths.some(path => pathname.startsWith(path));
        if (isProtected) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
