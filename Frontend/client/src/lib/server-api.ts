import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://morbidity-stucco-grower.ngrok-free.dev';

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

  console.log(`[SSR Fetch] URL: ${API_URL}${endpoint}`);
  if (accessToken) {
    console.log(`[SSR Auth] Found cookie: ${accessTokenCookie ? 'accessToken' : 'adminAccessToken'}`);
    console.log(`[SSR Auth] Token preview: ${accessToken.substring(0, 10)}...`);
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Chỉ thêm Authorization nếu có token
  if (accessToken) {
    console.log(`[SSR Auth] Sending token for: ${endpoint}`);
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    console.log(`[SSR Auth] No token sent for: ${endpoint}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.log(`[SSR Auth] Access denied for ${endpoint} (Status: ${response.status})`);
      return { success: false, data: [], message: 'Unauthorized' };
    }
    
    console.error(`[SSR API Error] ${endpoint}: ${response.status} ${response.statusText}`);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  console.log(`[SSR API Success] ${endpoint}: 200 OK`);
  return response.json();
}
