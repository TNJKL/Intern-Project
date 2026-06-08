// 📄 Vị trí file: src/lib/api.ts (Bên dự án Vite Admin)
import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/zustand/useAuthStore';

// Xác định domain của Next.js Server gánh proxy (môi trường dev thường là http://localhost:3000)
const NEXTJS_PROXY_URL = 'http://localhost:3000';

export const apiClient = axios.create({
  // Sử dụng URL tuyệt đối trỏ sang Next.js để proxy bên đó xử lý viết lại rewrite xuống NestJS
  baseURL: `${NEXTJS_PROXY_URL}/api/v1`,
  withCredentials: true,
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

// ─── Request interceptor ───
apiClient.interceptors.request.use((config) => {
  // Lấy token đồng bộ từ cookie để khớp hoàn toàn với Next.js Proxy Middleware
  const token = Cookies.get('adminAccessToken') || Cookies.get('accessToken') || useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nhận diện mã lỗi TOKEN_EXPIRED từ Backend hoặc mã TOKEN_EXPIRED_NEED_REFRESH cứu vãn từ proxy.ts
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED' || error.response?.data?.code === 'TOKEN_EXPIRED_NEED_REFRESH';
    const isAuthError = isExpired || error.response?.status === 401 || error.response?.status === 403;

    if (!isAuthError || originalRequest._retry) {
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
      // ✅ SỬA LỖI ĐƯỜNG DẪN: Ép URL tuyệt đối chạy qua cổng của Next.js Proxy
      const refreshUrl = `${NEXTJS_PROXY_URL}/api/auth/session-token`;

      const response = await axios.get(refreshUrl, {
        withCredentials: true, // Ép trình duyệt đính kèm cookie của Next.js (chứa refreshToken) lên
        headers: {
          'ngrok-skip-browser-warning': '69420',
        }
      });

      const responseData = response.data;
      const newToken = responseData?.accessToken;

      if (!newToken || responseData?.error === 'RefreshTokenError') {
        throw new Error('No access token returned from proxy refresh');
      }

      // Cập nhật lại trạng thái Auth mới vào Zustand
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(currentUser, newToken);
      }

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Khi Refresh Token chết hẳn (quá hạn 7 ngày), dọn sạch cookie và ép quay về trang đăng nhập
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);