import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

// ─── Refresh token queue (tránh nhiều request refresh cùng lúc) ───
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// ─── Request interceptor: gắn access token ───
apiClient.interceptors.request.use((config) => {
  let token = useAuthStore.getState().accessToken;

  // Fallback khi store chưa hydrate
  if (!token) {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.accessToken ?? null;
      }
    } catch (_) { }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: tự động refresh khi 401 ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý cả 401 (Unauthorized) và 403 (Forbidden) vì một số backend trả về 403 khi token hết hạn
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;

    if (!isAuthError || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu đang refresh → đưa request vào queue chờ
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

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      // Gọi refresh bằng axios thuần (không qua apiClient để tránh vòng lặp)
      const { data } = await axios.post(
        '/api/v1/auth/refresh',
        { refreshToken },
        { 
          headers: { 
            'Content-Type': 'application/json', 
            'ngrok-skip-browser-warning': '69420' 
          } 
        }
      );

      const newAccessToken: string = data?.data?.accessToken ?? data?.accessToken;
      const newRefreshToken: string = data?.data?.refreshToken ?? data?.refreshToken ?? refreshToken;

      const { user, setAuth } = useAuthStore.getState();
      setAuth(user!, newAccessToken, newRefreshToken);

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
