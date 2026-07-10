import axios from 'axios';
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
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (err: any) => void }> = [];
let lastRefreshTime = 0;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

// ─── Request interceptor ───
apiClient.interceptors.request.use((config) => {
  // Client App luôn dùng 'lastRefreshedToken' (không dùng adminAccessToken/adminRefreshToken)
  (config as any)._tokenSent = Cookies.get('lastRefreshedToken') || '';
  return config;
});

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

// ─── Response interceptor: Tự động refresh token bằng Cookie ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    // Client App luôn dùng 'lastRefreshedToken' – không bao giờ dùng adminAccessToken
    const LAST_REFRESHED_KEY = 'lastRefreshedToken';
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED';

    // Chỉ coi 403 là lỗi Auth (cần refresh) nếu token thực sự hết hạn hoặc không có token.
    // Nếu token vẫn còn hạn mà bị 403 -> lỗi phân quyền (Forbidden) thông thường, không refresh.
    let isAuthError = false;
    if (status === 401 || isExpired) {
      isAuthError = true;
    } else if (status === 403) {
      // Dùng accessToken từ Zustand store, nếu không có thì đọc từ cookie client
      // KHÔNG dùng adminAccessToken vì đây là Client App
      const { useAuthStore } = await import('../store/zustand/useAuthStore');
      const token = useAuthStore.getState().accessToken || Cookies.get(LAST_REFRESHED_KEY);
      
      if (!token || isTokenExpired(token)) {
        isAuthError = true;
      } else {
        console.warn('[Client API] Legitimate 403 Forbidden (Permission denied). Bypassing refresh.');
      }
    }

    // Tránh loop vô hạn nếu request này đã retry hoặc không phải lỗi Auth
    if (!isAuthError || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu vừa mới refresh thành công trong vòng 5 giây qua, chỉ cần retry trực tiếp
    const now = Date.now();
    if (now - lastRefreshTime < 5000) {
      console.log('[Client API] Refresh occurred less than 5s ago. Retrying original request directly.');
      originalRequest._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return apiClient(originalRequest);
    }

    // ─── KIỂM TRA ĐỒNG BỘ ĐA TAB TRƯỚC KHI REFRESH ───
    // Nếu token trong cookie đã thay đổi so với token lúc gửi request,
    // nghĩa là có tab khác đã refresh thành công. Ta chỉ cần retry lại request gốc.
    const tokenSent = originalRequest._tokenSent || '';
    const currentToken = Cookies.get(LAST_REFRESHED_KEY) || '';
    if (currentToken && currentToken !== tokenSent) {
      console.log('[Client API] Token has been refreshed by another tab. Retrying original request.');
      originalRequest._retry = true;
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${currentToken}`;
      }
      return apiClient(originalRequest);
    }

    // Nếu đang có một tiến trình refresh token khác đang chạy -> Xếp hàng đợi
    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
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
      const newUser = responseData?.data?.user || responseData?.user;
      if (newToken) {
        Cookies.set('lastRefreshedToken', newToken, { path: '/' });
        // Đồng bộ thông tin cá nhân mới và token mới của user vào Zustand Store
        const { useAuthStore } = await import('../store/zustand/useAuthStore');
        const currentUser = useAuthStore.getState().user;
        useAuthStore.getState().setUser(newUser || currentUser, newToken);
      }

      lastRefreshTime = Date.now(); // Cập nhật thời điểm refresh thành công
      processQueue(null, newToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Kiểm tra xem có phải lỗi do refresh token đã được sử dụng bởi tab khác hay không
      const isAxiosErr = axios.isAxiosError(refreshError);
      const errMsg = isAxiosErr ? refreshError.response?.data?.message : '';
      const isReplayedToken = errMsg === 'Refresh token đã được sử dụng';

      if (isReplayedToken) {
        console.log('[Client API] Refresh token already used by another tab. Waiting for cookie sync and retrying...');
        
        // Polling nhanh mỗi 100ms trong tối đa 1.5s để chờ cookie đồng bộ từ tab khác
        let checkInterval = 100;
        let maxWait = 1500;
        let waited = 0;
        const initialCookie = originalRequest._lastRefreshedBefore || '';
        
        while (waited < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          waited += checkInterval;
          const newCookieVal = Cookies.get('lastRefreshedToken') || '';
          if (newCookieVal && newCookieVal !== initialCookie) {
            console.log(`[Client API] Cookie synced after ${waited}ms.`);
            break;
          }
        }
        
        const finalToken = Cookies.get('lastRefreshedToken') || '';
        if (originalRequest.headers && finalToken) {
          originalRequest.headers.Authorization = `Bearer ${finalToken}`;
        }
        processQueue(null, finalToken);
        return apiClient(originalRequest);
      }

      // Đối với các lỗi khác, kiểm tra nhanh (polling) xem có tab nào khác vừa mới refresh thành công hay không
      let checkInterval = 100;
      let maxWait = 1000;
      let waited = 0;
      const initialCookie = originalRequest._lastRefreshedBefore || '';
      let wasRefreshedByOther = false;
      
      while (waited < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        waited += checkInterval;
        const lastRefreshedAfter = Cookies.get('lastRefreshedToken') || '';
        if (lastRefreshedAfter && lastRefreshedAfter !== initialCookie) {
          wasRefreshedByOther = true;
          break;
        }
      }

      if (wasRefreshedByOther) {
        console.log('[Client API] Another tab has successfully refreshed the token. Syncing and retrying.');
        const finalToken = Cookies.get('lastRefreshedToken') || '';
        if (originalRequest.headers && finalToken) {
          originalRequest.headers.Authorization = `Bearer ${finalToken}`;
        }
        processQueue(null, finalToken);
        return apiClient(originalRequest);
      }

      processQueue(refreshError);

      // Lưu chi tiết lỗi vào localStorage trước khi chuyển hướng để tránh mất log
      let failStatus: number | null = null;
      let failedUrl = '';
      if (typeof window !== 'undefined') {
        try {
          failStatus = (isAxiosErr && refreshError.response) ? refreshError.response.status : null;
          failedUrl = isAxiosErr && refreshError.config?.url ? refreshError.config.url : '';
          const errDetail = {
            timestamp: new Date().toISOString(),
            status: failStatus || 'unknown',
            data: isAxiosErr ? refreshError.response?.data : null,
            message: refreshError instanceof Error ? refreshError.message : String(refreshError),
            url: failedUrl,
          };
          console.error('[Client API] Token Refresh / Retry Failed:', errDetail);
          localStorage.setItem('last_auth_error_client', JSON.stringify(errDetail));
        } catch (e) {
          console.error('[Client API] Failed to save error details:', e);
        }
      }

      // CHỈ CƯỠNG CHẾ ĐĂNG XUẤT nếu chính request refresh token thất bại!
      // Không logout khi originalRequest bị 403 do phân quyền.
      const isRefreshEndpoint = failedUrl.includes('/auth/refresh');
      const isAuthFailure = failStatus === 401 || failStatus === 403 || failStatus === 400;

      if (isAuthFailure && isRefreshEndpoint) {
        // Báo cho backend thu hồi token/session trên server trước khi xóa ở client
        try {
          await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
        } catch (e) {
          console.warn('[Client API] Failed to call backend logout on refresh failure', e);
        }

        try {
          const { useAuthStore } = await import('../store/zustand/useAuthStore');
          useAuthStore.getState().clearUser();
        } catch { }
        try {
          await signOut({ redirect: false });
        } catch { }

        if (typeof window !== 'undefined') {
          // Chỉ xóa cookie của Client App, không xóa cookie của Admin App
          document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          document.cookie = "refreshToken=; path=/api/v1/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          document.cookie = "lastRefreshedToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

          const pathname = window.location.pathname;
          const protectedPaths = ['/profile', '/orders'];
          const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
          if (isProtected) {
            window.location.href = '/login';
          }
        }
      } else {
        console.warn('[Client API] Temporary network or server error. Retaining session (no logout).');
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
