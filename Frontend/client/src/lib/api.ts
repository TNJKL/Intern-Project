import axios from 'axios';
import { store } from '../store/redux/store';
import { clearCredentials } from '../store/redux/authSlice';
import { signOut } from 'next-auth/react';
import Cookies from 'js-cookie';

/**
 * 📄 src/lib/api.ts
 *
 * Client-side Axios instance sử dụng hoàn toàn Cookie của trình duyệt.
 *  - withCredentials: true bắt buộc để tự gửi cookie (accessToken, refreshToken).
 *  - Response interceptor tự động bắt 401 để "ra tín hiệu" refresh token mà không cần truyền body.
 */

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // BẮT BUỘC: để trình duyệt tự đính kèm cookie
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

// ─── Request interceptor ───
apiClient.interceptors.request.use((config) => config);

// ─── Response interceptor: Tự động refresh token bằng Cookie ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthError = status === 401 || status === 403;

    // Tránh loop vô hạn nếu request này đã retry hoặc không phải lỗi Auth
    if (!isAuthError || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu đang có một tiến trình refresh token khác đang chạy -> Xếp hàng đợi
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    // Lưu lại giá trị token trước khi thực hiện refresh để đối chiếu race condition đa tab
    originalRequest._lastRefreshedBefore = Cookies.get('lastRefreshedToken') || '';

    try {
      // "Ra tín hiệu" refresh token: gửi POST rỗng sang endpoint của backend qua proxy.
      // Trình duyệt sẽ tự động gửi kèm cookie refreshToken.
      // Backend phản hồi và Set-Cookie cặp accessToken + refreshToken mới, proxy sẽ trả về cho trình duyệt lưu.
      const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });

      const responseData = res.data;
      const newToken = responseData?.data?.accessToken || responseData?.accessToken;
      if (newToken) {
        Cookies.set('lastRefreshedToken', newToken, { path: '/' });
      }

      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      // Lưu chi tiết lỗi vào localStorage trước khi chuyển hướng để tránh mất log
      let status: number | null = null;
      if (typeof window !== 'undefined') {
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
          console.error('[API Client] Refresh Token Failed:', errDetail);
          localStorage.setItem('last_auth_error_client', JSON.stringify(errDetail));
        } catch (e) {
          console.error('[API Client] Failed to save error details:', e);
        }
      }

      // ─── GIẢI QUYẾT RACE CONDITION MULTI-TAB (Client & Admin) ───
      // Nếu có tab khác đã refresh thành công trước và cập nhật cookie mới,
      // ta chạy tiếp request gốc mà không logout (cookie HttpOnly mới đã được cập nhật).
      const lastRefreshedAfter = Cookies.get('lastRefreshedToken') || '';
      const wasRefreshedByOther = lastRefreshedAfter && lastRefreshedAfter !== originalRequest._lastRefreshedBefore;

      if (wasRefreshedByOther) {
        console.log('[Client API Client] Another tab (Client or Admin) has successfully refreshed the token. Syncing and retrying original request.');
        return apiClient(originalRequest);
      }

      // Chỉ đăng xuất khi lỗi xác thực thực sự (401 Unauthorized, 403 Forbidden, 400 Bad Request)
      // và KHÔNG có tab nào khác đã cập nhật token mới.
      // Nếu là lỗi mạng, timeout (status = null) hoặc lỗi server tạm thời (5xx) -> Giữ nguyên session
      const isAuthFailure = status === 401 || status === 403 || status === 400;
      if (isAuthFailure) {
        store.dispatch(clearCredentials());
        try {
          await signOut({ redirect: false });
        } catch {}

        if (typeof window !== 'undefined') {
          // Xóa tạm thời cookie ở client side (chỉ xóa được nếu cookie không phải HttpOnly, 
          // nhưng ghi đè hết hạn là best practice để dọn dẹp)
          document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          document.cookie = "lastRefreshedToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

          const pathname = window.location.pathname;
          const protectedPaths = ['/profile', '/orders', '/admin'];
          const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
          if (isProtected) {
            window.location.href = '/login';
          }
        }
      } else {
        console.warn('[Client API Client] Temporary network or server error. Retaining session (no logout).');
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
