import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/zustand/useAuthStore';

export const apiClient = axios.create({
  baseURL: '/api/v1',
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
  const token = useAuthStore.getState().accessToken || Cookies.get('adminAccessToken');

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
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED';
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

      if (!newToken) {
        throw new Error('No access token returned from refresh');
      }

      // Cập nhật Zustand Store và Cookie cho Admin
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(currentUser, newToken, "");
      }

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
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
