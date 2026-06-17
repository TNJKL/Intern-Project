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

// Hàm dừng đồng bộ (sleep)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Hàm kiểm tra thời hạn JWT
function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    let jsonPayload: string;
    if (typeof window === 'undefined') {
      jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      jsonPayload = atob(base64);
    }
    
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp !== 'number') return true;
    // Hết hạn hoặc sẽ hết hạn trong vòng 5 giây tới
    return payload.exp * 1000 < Date.now() + 5000;
  } catch (e) {
    return true;
  }
}

// ─── Request interceptor ───
apiClient.interceptors.request.use((config) => config);

// ─── Response interceptor: Tự động refresh token bằng Cookie ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED';
    
    // Chỉ coi 403 là lỗi Auth (cần refresh) nếu token thực sự hết hạn hoặc không có token.
    // Nếu token vẫn còn hạn mà bị 403 -> lỗi phân quyền (Forbidden) thông thường, không refresh/logout.
    let isAuthError = false;
    if (status === 401) {
      isAuthError = true;
    } else if (status === 403) {
      const token = store.getState().auth.accessToken || Cookies.get('lastRefreshedToken');
      if (isExpired || !token || isTokenExpired(token)) {
        isAuthError = true;
      } else {
        console.warn('[Client API Client] Legitimate 403 Forbidden (Permission denied). Bypassing refresh/logout.');
      }
    }

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
      // Chờ 1000ms để nếu có tab khác đang refresh song song và thành công, 
      // tab đó có đủ thời gian ghi cookie mới. Sau đó kiểm tra lại.
      await sleep(1000);

      const lastRefreshedAfter = Cookies.get('lastRefreshedToken') || '';
      const wasRefreshedByOther = lastRefreshedAfter && lastRefreshedAfter !== originalRequest._lastRefreshedBefore;

      if (wasRefreshedByOther) {
        console.log('[Client API Client] Another tab has successfully refreshed the token. Syncing and retrying.');
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
          // Xóa tạm thời cookie ở client side
          document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          document.cookie = "refreshToken=; path=/api/v1/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
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
