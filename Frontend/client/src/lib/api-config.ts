// 📄 Vị trí file: src/utils/apiClient.ts (hoặc file chứa apiClient hiện tại của bạn)
import axios from 'axios';
import { store } from '../store/redux/store';
import { updateAccessToken, clearCredentials } from '../store/redux/authSlice';
import { useAuthStore } from '../store/zustand/useAuthStore';

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP || 'http://localhost:8080',
  ENDPOINTS: {
    PRODUCTS: '/api/v1/products',
    CATEGORIES: '/api/v1/categories',
    SUGGESTIONS: '/api/v1/products/suggest',
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      REFRESH: '/api/v1/auth/refresh',
    }
  }
};

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // BẮT BUỘC: để browser gửi kèm cookies
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

// ─── Refresh token queue (Chống nghẽn khi nhiều API gọi cùng lúc lúc hết hạn) ───
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// ─── Request interceptor ───
apiClient.interceptors.request.use((config) => {
  return config;
});

// ─── Response interceptor: Giải cứu khi treo máy ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED';
    const isAuthError = isExpired || error.response?.status === 401 || error.response?.status === 403;
    const user = useAuthStore.getState().user;

    // Kiểm tra xem trình duyệt có lưu cookie token nào không
    const hasToken = typeof window !== 'undefined' &&
      (document.cookie.includes('accessToken=') || document.cookie.includes('adminAccessToken=') || document.cookie.includes('refreshToken='));

    // Điều kiện dừng: Không phải lỗi auth, hoặc request này đã là retry rồi, hoặc là Guest hoàn toàn
    if (!isAuthError || originalRequest._retry || (!user && !hasToken)) {
      return Promise.reject(error);
    }

    // ⏳ Nếu đang có một API khác đi xin cấp lại token rồi -> Xếp hàng đợi
    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          // Khi hàng đợi được thông, chạy lại request với token mới (nếu có)
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Đánh dấu request này bắt đầu chu kỳ giải cứu
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Gọi refresh token qua proxy
      const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });

      // Lấy Access Token trả về truyền vào Redux Store để đồng bộ trạng thái RAM
      const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
      if (newAccessToken) {
        store.dispatch(updateAccessToken(newAccessToken));
      }

      // Thông báo giải phóng toàn bộ các request đang nghẽn trong hàng đợi
      processQueue(null, newAccessToken || "");

      // Thực thi lại request gốc bị lỗi ban nãy
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Nếu giải cứu thất bại (Refresh token hết hạn thực sự sau nhiều ngày treo máy)
      processQueue(refreshError, null);

      // Xóa sạch trạng thái auth trong RAM (Redux + Zustand)
      store.dispatch(clearCredentials());
      useAuthStore.getState().clearUser();

      // Xóa cookies thủ công để dọn sạch rác hệ thống
      if (typeof window !== 'undefined') {
        document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "adminAccessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

        // Chỉ đá về login nếu đang cố ở các trang bắt buộc bảo mật
        const pathname = window.location.pathname;
        const protectedPaths = ['/profile', '/admin', '/orders'];
        const isProtected = protectedPaths.some(path => pathname.startsWith(path));
        if (isProtected) {
          window.location.href = '/login?logout=true';
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);