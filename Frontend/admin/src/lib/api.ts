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
let lastRefreshTime = 0;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// ─── Request interceptor: gắn accessToken vào Authorization header ───
apiClient.interceptors.request.use((config) => {
  const cookieToken = Cookies.get('adminAccessToken');
  const isAuthenticated = useAuthStore.getState().isAuthenticated;

  // Nếu Zustand store nghĩ là đã đăng nhập nhưng cookie không tồn tại
  if (isAuthenticated && !cookieToken) {
    console.warn('[Admin API Client] adminAccessToken cookie is missing. Syncing logout...');
    useAuthStore.getState().logout(false);
    return Promise.reject(new axios.Cancel('Session expired or logged out from another tab'));
  }

  // Đọc token từ store (luôn mới nhất sau refresh) hoặc cookie dự phòng
  const token = useAuthStore.getState().accessToken || cookieToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ghi nhận token đã gửi tại thời điểm gửi request
  (config as any)._tokenSent = token || '';
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
    const jsonPayload = atob(base64);
    
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp !== 'number') return true;
    // Hết hạn hoặc sẽ hết hạn trong vòng 5 giây tới
    return payload.exp * 1000 < Date.now() + 5000;
  } catch (e) {
    return true;
  }
}

// ─── Response interceptor: tự động refresh khi token hết hạn ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isExpired = error.response?.data?.errorCode === 'TOKEN_EXPIRED';

    // Chỉ coi 403 là lỗi Auth (cần refresh) nếu token thực sự hết hạn hoặc không có token.
    // Nếu token vẫn còn hạn mà bị 403 -> lỗi phân quyền (Forbidden) thông thường, không refresh.
    let isAuthError = false;
    if (status === 401 || isExpired) {
      isAuthError = true;
    } else if (status === 403) {
      const token =
        useAuthStore.getState().accessToken ||
        Cookies.get('adminAccessToken') ||
        Cookies.get('adminLastRefreshedToken') ||
        Cookies.get('lastRefreshedToken') ||
        Cookies.get('accessToken');
      
      if (!token || isTokenExpired(token)) {
        isAuthError = true;
      } else {
        console.warn('[Admin API Client] Legitimate 403 Forbidden (Permission denied). Bypassing refresh.');
      }
    }

    if (!isAuthError || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu vừa mới refresh thành công trong vòng 5 giây qua, chỉ cần retry trực tiếp
    const now = Date.now();
    if (now - lastRefreshTime < 5000) {
      console.log('[Admin API Client] Refresh occurred less than 5s ago. Retrying original request directly.');
      originalRequest._retry = true;
      const currentToken = Cookies.get('adminLastRefreshedToken') || '';
      if (currentToken) {
        useAuthStore.setState({ accessToken: currentToken, isAuthenticated: true });
        originalRequest.headers.Authorization = `Bearer ${currentToken}`;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      return apiClient(originalRequest);
    }

    // ─── KIỂM TRA ĐỒNG BỘ ĐA TAB TRƯỚC KHI REFRESH ───
    const tokenSent = originalRequest._tokenSent || '';
    const currentToken = Cookies.get('adminLastRefreshedToken') || '';
    if (currentToken && currentToken !== tokenSent) {
      console.log('[Admin API Client] Token has been refreshed by another tab/app. Syncing and retrying original request.');
      useAuthStore.setState({ accessToken: currentToken, isAuthenticated: true });
      originalRequest.headers.Authorization = `Bearer ${currentToken}`;
      originalRequest._retry = true;
      return apiClient(originalRequest);
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
    originalRequest._lastRefreshedBefore = Cookies.get('adminLastRefreshedToken') || '';

    try {
      // Gọi API refresh của backend qua proxy
      const response = await axios.post(
        `${NEXTJS_PROXY_URL}/api/v1/auth/refresh`,
        {},
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

      // QUAN TRỌNG: Cập nhật token mới vào cookie dùng chung để đồng bộ đa tab Admin
      const isSecure = window.location.protocol === 'https:';
      Cookies.set('adminLastRefreshedToken', newToken, {
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

      lastRefreshTime = Date.now(); // Cập nhật thời điểm refresh thành công
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Kiểm tra xem có phải lỗi do refresh token đã được sử dụng bởi tab khác hay không
      const isAxiosErr = axios.isAxiosError(refreshError);
      const errMsg = isAxiosErr ? refreshError.response?.data?.message : '';
      const isReplayedToken = errMsg === 'Refresh token đã được sử dụng';

      // ─── HANDLER: Refresh token đã bị tab/app khác dùng trước ───
      // Giải pháp: đợi tab khác hoàn tất refresh → gọi lại /api/v1/auth/refresh để lấy token mới
      // KHÔNG bỏ cuộc / reject → người dùng không cần F5
      if (isReplayedToken) {
        console.log('[Admin API Client] Refresh token already used by another source. Waiting then retrying refresh...');
        
        // Helper: thử gọi refresh và lấy token mới
        const tryGetNewTokenFromRefresh = async (): Promise<string | null> => {
          try {
            const res = await axios.post(
              `${NEXTJS_PROXY_URL}/api/v1/auth/refresh`,
              {},
              { withCredentials: true, headers: { 'ngrok-skip-browser-warning': '69420' } }
            );
            return res.data?.data?.accessToken || res.data?.accessToken || null;
          } catch {
            return null;
          }
        };

        // Lần 1: đợi 2 giây để Client hoàn tất refresh → refreshToken cookie mới được set
        await new Promise((resolve) => setTimeout(resolve, 2000));
        let newToken = await tryGetNewTokenFromRefresh();

        // Lần 2 (fallback): đợi thêm 2 giây nếu lần 1 vẫn thất bại
        if (!newToken) {
          console.log('[Admin API Client] refresh still failing, waiting 2 more seconds...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          newToken = await tryGetNewTokenFromRefresh();
        }

        if (newToken) {
          console.log('[Admin API Client] refresh succeeded after wait. Syncing store and retrying original request.');
          const isSecure = window.location.protocol === 'https:';
          Cookies.set('adminLastRefreshedToken', newToken, { expires: 7, path: '/', sameSite: 'lax', secure: isSecure });
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setAuth(currentUser, newToken);
          } else {
            useAuthStore.setState({ accessToken: newToken, isAuthenticated: true });
          }
          lastRefreshTime = Date.now();
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }

        // Thực sự thất bại sau cả 2 lần → mới reject
        console.warn('[Admin API Client] Could not obtain new token after waiting. Giving up.');
        processQueue(refreshError, null);
        useAuthStore.getState().logout(false);
        return Promise.reject(refreshError);
      }

      // Đối với các lỗi khác, kiểm tra xem có tab nào khác vừa mới refresh thành công hay không
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const lastRefreshedAfter = Cookies.get('adminLastRefreshedToken') || '';
      const wasRefreshedByOther = lastRefreshedAfter && lastRefreshedAfter !== originalRequest._lastRefreshedBefore;

      if (wasRefreshedByOther) {
        console.log('[Admin API Client] Another tab has successfully refreshed the token. Syncing and retrying original request.');
        useAuthStore.setState({ accessToken: lastRefreshedAfter, isAuthenticated: true });
        processQueue(null, lastRefreshedAfter);
        originalRequest.headers.Authorization = `Bearer ${lastRefreshedAfter}`;
        return apiClient(originalRequest);
      }

      processQueue(refreshError, null);

      // Lưu chi tiết lỗi vào localStorage trước khi chuyển hướng để tránh mất log
      let status: number | null = null;
      let failedUrl = '';
      try {
        status = (isAxiosErr && refreshError.response) ? refreshError.response.status : null;
        failedUrl = isAxiosErr && refreshError.config?.url ? refreshError.config.url : '';
        const errDetail = {
          timestamp: new Date().toISOString(),
          status: status || 'unknown',
          data: isAxiosErr ? refreshError.response?.data : null,
          message: refreshError instanceof Error ? refreshError.message : String(refreshError),
          url: failedUrl,
        };
        console.error('[Admin API Client] Token Refresh / Retry Failed:', errDetail);
        localStorage.setItem('last_auth_error_admin', JSON.stringify(errDetail));
      } catch (e) {
        console.error('[Admin API Client] Failed to save error details:', e);
      }

      // NẾU lỗi xảy ra khi đang cố gắng refresh token -> thực sự là phiên đã hết hạn.
      // NẾU lỗi xảy ra sau khi refresh thành công (khi gọi lại originalRequest) -> có thể là lỗi 403 (không đủ quyền) hoặc 400 (Bad Request) của originalRequest.
      // Chúng ta CHỈ CƯỠNG CHẾ ĐĂNG XUẤT nếu request bị lỗi chính là request refresh token!
      const isRefreshEndpoint = failedUrl.includes('/auth/refresh') || failedUrl.includes('/session-token');
      const isAuthFailure = status === 401 || status === 403 || status === 400;

      if (isAuthFailure && isRefreshEndpoint) {
        useAuthStore.getState().logout(false);
      } else {
        console.warn('[Admin API Client] Temporary network or server error. Retaining session (no logout).');
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);