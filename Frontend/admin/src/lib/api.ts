// 📄 Vị trí file: src/lib/api.ts (Bên dự án Vite Admin)
import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/zustand/useAuthStore';

// Next.js proxy URL (môi trường dev)
const NEXTJS_PROXY_URL = 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${NEXTJS_PROXY_URL}/api/v1`,
  withCredentials: true, // Trình duyệt tự gửi cookie (accessToken, refreshToken) kèm mỗi request
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

// ─── Refresh token queue (tránh gọi refresh song song) ───
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// ─── Request interceptor: gắn accessToken vào Authorization header ───
apiClient.interceptors.request.use((config) => {
  // Đọc token từ store (luôn mới nhất sau refresh) hoặc cookie dự phòng
  const token =
    useAuthStore.getState().accessToken ||
    Cookies.get('adminAccessToken') ||
    Cookies.get('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: tự động refresh khi token hết hạn ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Chỉ bắt 401 Unauthorized (token hết hạn) — KHÔNG bắt 403 Forbidden (thiếu quyền)
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED';
    const isAuthError = isExpired || error.response?.status === 401;

    if (!isAuthError || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Xếp hàng nếu đang có refresh khác chạy
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

    // Lưu lại giá trị token trước khi thực hiện refresh để đối chiếu race condition đa tab
    originalRequest._lastRefreshedBefore = Cookies.get('lastRefreshedToken') || '';

    try {
      // Gọi refresh qua proxy với body rỗng.
      // Trình duyệt tự đính kèm cookie refreshToken (HttpOnly) nhờ withCredentials: true.
      // Proxy forward cookie lên backend, backend trả token mới.
      // Proxy tự set lại Set-Cookie bền vững (Max-Age=7 ngày) về trình duyệt.
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

      if (!newToken) {
        throw new Error('No access token returned from refresh');
      }

      // QUAN TRỌNG: Cập nhật token mới vào cookie dùng chung để đồng bộ đa tab (Client và Admin)
      const isSecure = window.location.protocol === 'https:';
      Cookies.set('lastRefreshedToken', newToken, {
        expires: 7,
        path: '/',
        sameSite: 'lax',
        secure: isSecure,
      });

      // Luôn cập nhật token mới vào cookie và store của Admin
      const currentUser = newUser || useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(currentUser, newToken);
      } else {
        Cookies.set('adminAccessToken', newToken, {
          expires: 7,
          path: '/',
          sameSite: 'lax',
          secure: isSecure,
        });
        useAuthStore.setState({ accessToken: newToken, isAuthenticated: true });
      }

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Lưu chi tiết lỗi vào localStorage trước khi chuyển hướng để tránh mất log
      let status: number | null = null;
      try {
        const isAxiosErr = axios.isAxiosError(refreshError);
        status = (isAxiosErr && refreshError.response) ? refreshError.response.status : null;
        const errDetail = {
          timestamp: new Date().toISOString(),
          status: status || 'unknown',
          data: isAxiosErr ? refreshError.response?.data : null,
          message: refreshError instanceof Error ? refreshError.message : String(refreshError),
          url: isAxiosErr ? refreshError.config?.url : '',
        };
        console.error('[Admin API Client] Refresh Token Failed:', errDetail);
        localStorage.setItem('last_auth_error_admin', JSON.stringify(errDetail));
      } catch (e) {
        console.error('[Admin API Client] Failed to save error details:', e);
      }

      // ─── GIẢI QUYẾT RACE CONDITION MULTI-TAB (Client & Admin) ───
      // Nếu có tab khác (Client hoặc Admin) đã refresh thành công trước và cập nhật cookie mới,
      // ta đồng bộ token mới đó vào store của tab này và chạy tiếp mà không logout.
      const lastRefreshedAfter = Cookies.get('lastRefreshedToken') || '';
      const wasRefreshedByOther = lastRefreshedAfter && lastRefreshedAfter !== originalRequest._lastRefreshedBefore;

      if (wasRefreshedByOther) {
        console.log('[Admin API Client] Another tab (Client or Admin) has successfully refreshed the token. Syncing and retrying original request.');
        useAuthStore.setState({ accessToken: lastRefreshedAfter, isAuthenticated: true });
        originalRequest.headers.Authorization = `Bearer ${lastRefreshedAfter}`;
        return apiClient(originalRequest);
      }

      // Chỉ đăng xuất khi lỗi xác thực thực sự (401 Unauthorized, 403 Forbidden, 400 Bad Request)
      // và KHÔNG có tab nào khác đã cập nhật token mới.
      // Nếu là lỗi mạng, timeout (status = null) hoặc lỗi server tạm thời (5xx) -> Giữ nguyên session
      const isAuthFailure = status === 401 || status === 403 || status === 400;
      if (isAuthFailure) {
        useAuthStore.getState().logout();
      } else {
        console.warn('[Admin API Client] Temporary network or server error. Retaining session (no logout).');
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);