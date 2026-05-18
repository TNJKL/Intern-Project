import { cookies } from 'next/headers';
import { API_CONFIG } from './api-config';

const API_URL = API_CONFIG.BASE_URL;

/**
 * Gọi API từ Server Side.
 * Sử dụng accessToken trực tiếp từ Cookie do Backend quản lý.
 */
export async function getServerApi(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  // Đọc accessToken hoặc adminAccessToken từ cookie
  const accessTokenCookie = cookieStore.get('accessToken');
  const adminAccessTokenCookie = cookieStore.get('adminAccessToken');
  const accessToken = accessTokenCookie?.value || adminAccessTokenCookie?.value;

  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Thiết lập Timeout 5 giây để tránh treo trang quá lâu
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    signal: controller.signal,
    cache: 'no-store',
  };

  // Mặc định không cache để dữ liệu luôn mới (quan trọng khi đồng bộ giữa Admin và Client)
  if (!fetchOptions.method || fetchOptions.method === 'GET') {
    if (!fetchOptions.cache && !fetchOptions.next) {
      fetchOptions.next = { revalidate: 0 }; 
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const isExpired = errorData?.errorCode === 'TOKEN_EXPIRED' || response.status === 401 || response.status === 403;

      if (isExpired) {
        const refreshToken = cookieStore.get('refreshToken')?.value;
        if (refreshToken) {
          // Thử refresh token ngay tại Server
          try {
            const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cookie': `refreshToken=${refreshToken}`,
                'ngrok-skip-browser-warning': 'true'
              }
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newToken = refreshData?.data?.accessToken || refreshData?.accessToken;
              if (newToken) {
                // Thử gọi lại request gốc với token mới
                headers.set('Authorization', `Bearer ${newToken}`);
                const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...fetchOptions, headers });
                if (retryResponse.ok) return retryResponse.json();
              }
            }
          } catch (refreshErr) {
            console.error('[SSR Refresh Error]', refreshErr);
          }
        }
        return { success: false, data: [], message: 'Unauthorized' };
      }
      console.error(`[SSR ERROR] ${endpoint} (${response.status})`);
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name !== 'AbortError') {
      console.error(`[SSR ERROR] ${endpoint}: ${error.message}`);
    }
    throw error;
  }
}
