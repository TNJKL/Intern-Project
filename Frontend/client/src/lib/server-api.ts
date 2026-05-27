import { cookies } from 'next/headers';
import { API_CONFIG } from './api-config';

const API_URL = API_CONFIG.BASE_URL;

/**
 * Gọi API từ Server Side (Server Components, layout.tsx, page.tsx).
 * Đọc accessToken từ Cookie và gắn vào Authorization header.
 *
 * Lưu ý về Refresh Token:
 * - Luồng refresh token được xử lý hoàn toàn bởi Middleware (proxy.ts).
 * - proxy.ts phát hiện accessToken hết hạn, gọi refresh, set cookie mới
 *   và redirect về trang hiện tại TRƯỚC khi Server Component này render.
 * - Do đó, server-api.ts KHÔNG cần tự refresh lại, vì:
 *   1. Nếu proxy.ts đã chạy → accessToken đã hợp lệ khi hàm này chạy.
 *   2. Nếu server-api.ts tự refresh → không thể ghi cookie mới trở lại
 *      browser (Server Component render phase không hỗ trợ Set-Cookie),
 *      nên token mới đó bị bỏ đi và lần sau vẫn bị 401.
 */
export async function getServerApi(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();

  // Đọc accessToken hoặc adminAccessToken từ cookie
  const accessTokenCookie = cookieStore.get('accessToken');
  const adminAccessTokenCookie = cookieStore.get('adminAccessToken');
  let accessToken = accessTokenCookie?.value || adminAccessTokenCookie?.value;

  // Tránh gửi chuỗi malformed 'undefined' hoặc 'null' lên Backend
  if (accessToken === 'undefined' || accessToken === 'null') {
    accessToken = undefined;
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Timeout 15 giây để tránh treo trang khi backend chậm
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    signal: controller.signal,
    cache: 'no-store',
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      // 401/403 là trường hợp bình thường khi chưa đăng nhập → im lặng, không log
      if (response.status === 401 || response.status === 403) {
        return { success: false, data: null, message: 'Unauthorized', status: response.status };
      }

      const errorData = await response.json().catch(() => ({}));
      console.error(`[SSR ERROR] ${endpoint} (${response.status})`, errorData);
      
      // Không throw error gây sập trang, trả về kết quả lỗi an toàn để UI tự xử lý
      return { 
        success: false, 
        data: null, 
        message: errorData?.message || `API Error: ${response.status}`,
        status: response.status 
      };
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name !== 'AbortError') {
      console.error(`[SSR ERROR] ${endpoint}: ${error.message}`);
    }
    // Trả về kết quả lỗi an toàn thay vì throw gây sập trang
    return { success: false, data: null, message: error.message };
  }
}
