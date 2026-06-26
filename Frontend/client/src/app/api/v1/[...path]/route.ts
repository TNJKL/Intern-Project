// 📄 src/app/api/v1/[...path]/route.ts
// Catch-all proxy: chuyển tiếp mọi request /api/v1/* sang backend
//
// Thiết kế:
//  - Chuyển tiếp nguyên vẹn Cookie từ trình duyệt gửi lên (accessToken, refreshToken)
//  - Backend đọc refreshToken từ cookie (không cần body)
//  - Khi auth/refresh hoặc auth/login thành công: tự tạo Set-Cookie bền vững (Max-Age=7 ngày)

import { NextRequest, NextResponse } from 'next/server';
import { getGuestAccessToken } from '@/lib/guest-auth';

const BACKEND_URL = process.env.GLOBAL_BACKEND_IP || 'http://localhost:8080';

// Danh sách origin được phép (admin + client dev)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
  return list;
}

function serializeCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function rewriteSetCookieHeader(cookieStr: string, fromAdmin: boolean): string {
  const isDelete = /Max-Age=0/i.test(cookieStr) || /expires=Thu, 01 Jan 1970/i.test(cookieStr);

  let name = '';
  let value = '';
  const match = cookieStr.match(/^\s*([^=;]+)\s*=\s*([^;]*)/);
  if (match) {
    name = match[1].trim();
    value = match[2].trim();
  }

  if (!name) return cookieStr;

  let targetName = name;
  let isHttpOnly = true;

  if (fromAdmin) {
    if (name === 'accessToken') {
      targetName = 'adminAccessToken';
      isHttpOnly = false; // Admin needs to read accessToken via js-cookie
    } else if (name === 'refreshToken') {
      targetName = 'adminRefreshToken';
      isHttpOnly = true;
    } else if (name === 'adminAccessToken') {
      isHttpOnly = false;
    } else if (name === 'adminRefreshToken') {
      isHttpOnly = true;
    }
  } else {
    // Client
    if (name === 'accessToken' || name === 'refreshToken') {
      isHttpOnly = true;
    }
  }

  // Xác định Path cho cookie:
  // - refreshToken và adminRefreshToken dùng path mặc định là '/api/v1/auth'
  // - Các cookie khác dùng path mặc định là '/'
  // Nếu trong cookieStr gốc có sẵn Path thì ưu tiên sử dụng Path gốc đó.
  let path = (targetName === 'refreshToken' || targetName === 'adminRefreshToken') ? '/api/v1/auth' : '/';
  const pathMatch = cookieStr.match(/Path\s*=\s*([^;]+)/i);
  if (pathMatch) {
    path = pathMatch[1].trim();
  }

  // Build new cookie string
  let newCookie = `${targetName}=${value}; Path=${path}; SameSite=Lax`;
  if (isHttpOnly) {
    newCookie += '; HttpOnly';
  }
  if (isDelete) {
    newCookie += '; Max-Age=0';
  } else {
    newCookie += '; Max-Age=604800'; // 7 ngày
  }

  if (process.env.NODE_ENV === 'production') {
    newCookie += '; Secure';
  }

  return newCookie;
}

// Xử lý OPTIONS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const fromAdmin = origin.includes('localhost:5173') || referer.includes('localhost:5173');

  const cookieHeader = request.headers.get('cookie') || '';
  const cookiesMap = parseCookies(cookieHeader);
  const hasAdminCookie = !!(cookiesMap['adminAccessToken'] || cookiesMap['adminRefreshToken']);
  let isForAdmin = fromAdmin || hasAdminCookie;

  const corsHeaders = getCorsHeaders(origin);

  try {
    // ── Xây dựng URL backend ────────────────────────────────────────────────
    const pathStr = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

    // ── Đọc body gốc từ request (nếu có) ────────────────────────────────────
    let body: ArrayBuffer | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.arrayBuffer();
      } catch {
        body = undefined;
      }
    }

    // ── Chuẩn bị headers để forward ────────────────────────────────────────
    const forwardHeaders: Record<string, string> = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      'ngrok-skip-browser-warning': '69420',
    };

    // Forward Authorization header nếu client gửi lên (ví dụ: Admin App gửi Bearer)
    const authorization = request.headers.get('authorization');
    if (authorization) {
      forwardHeaders['Authorization'] = authorization;
    }

    // Forward Cookie của trình duyệt, đổi tên cookie cho Admin App để cô lập
    let hasAccessToken = false;

    if (cookieHeader) {
      if (isForAdmin) {
        const mappedCookies: Record<string, string> = {};

        // Map admin specific cookies to standard names backend expects
        if (cookiesMap['adminAccessToken']) {
          mappedCookies['accessToken'] = cookiesMap['adminAccessToken'];
          hasAccessToken = true;
        }
        if (cookiesMap['adminRefreshToken']) {
          mappedCookies['refreshToken'] = cookiesMap['adminRefreshToken'];
        }

        // Copy other cookies EXCEPT client's accessToken/refreshToken
        Object.entries(cookiesMap).forEach(([key, val]) => {
          if (key !== 'accessToken' && key !== 'refreshToken' && key !== 'adminAccessToken' && key !== 'adminRefreshToken') {
            mappedCookies[key] = val;
          }
        });

        forwardHeaders['Cookie'] = serializeCookies(mappedCookies);
      } else {
        forwardHeaders['Cookie'] = cookieHeader;
        if (cookiesMap['accessToken']) {
          hasAccessToken = true;
        }
      }
    }

    // Nếu là truy vấn voucher của khách vãng lai (không đăng nhập) -> Sử dụng tài khoản khách hệ thống ở background
    if (pathStr === 'admin/vouchers' && !authorization && !hasAccessToken) {
      try {
        const guestToken = await getGuestAccessToken();
        if (guestToken) {
          forwardHeaders['Authorization'] = `Bearer ${guestToken}`;
        }
      } catch (e) {
        console.error('[API Proxy] Không thể lấy token khách vãng lai:', e);
      }
    }

    // ── Gửi request đến backend ─────────────────────────────────────────────
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: body || undefined,
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await backendResponse.text();

    // ── Chuẩn bị headers cho response trả về client ─────────────────────────
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', backendResponse.headers.get('content-type') || 'application/json');

    // Đính kèm CORS
    Object.entries(corsHeaders).forEach(([key, val]) => {
      responseHeaders.set(key, val);
    });

    // ── Khi auth/refresh hoặc auth/login thành công: set cookie bền vững ────
    // Backend Springboot trả token trong JSON body (không phải Set-Cookie header)
    // → Proxy tự tạo Set-Cookie với Max-Age=7 ngày
    if ((pathStr === 'auth/refresh' || pathStr === 'auth/login') && backendResponse.ok) {
      try {
        const data = JSON.parse(responseText);
        const newAccessToken = data?.data?.accessToken || data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;
        const user = data?.data?.user || data?.user;
        const role = user?.role?.toUpperCase();
        if (role === 'ADMIN' || role === 'STAFF') {
          isForAdmin = true;
        }

        if (newAccessToken) {
          const accessCookie = rewriteSetCookieHeader(`accessToken=${newAccessToken}`, isForAdmin);
          responseHeaders.append('Set-Cookie', accessCookie);
          if (newRefreshToken) {
            const refreshCookie = rewriteSetCookieHeader(`refreshToken=${newRefreshToken}`, isForAdmin);
            responseHeaders.append('Set-Cookie', refreshCookie);

            // Xóa cookie refreshToken bị thừa ở Path=/ để tránh xung đột Path (Cookie Collision)
            const deleteTargetName = isForAdmin ? 'adminRefreshToken' : 'refreshToken';
            const deleteSecure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
            responseHeaders.append('Set-Cookie', `${deleteTargetName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${deleteSecure}`);
          }

          // ── Set tracking cookie (non-HttpOnly) để Axios interceptor đọc được ──
          // Interceptor dùng cookie này để kiểm tra token có thực sự hết hạn không
          // trước khi quyết định có nên refresh hay không (tránh logout nhầm khi 403 phân quyền)
          const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
          const trackingCookieName = isForAdmin ? 'adminLastRefreshedToken' : 'lastRefreshedToken';
          responseHeaders.append(
            'Set-Cookie',
            `${trackingCookieName}=${newAccessToken}; Path=/; Max-Age=604800; SameSite=Lax${secureFlag}`
            // Không có HttpOnly → JS có thể đọc để check expiry
          );
        }
      } catch {
        // Không parse được JSON – bỏ qua, vẫn trả về response bình thường
      }
    }

    // ── Chuyển tiếp Set-Cookie từ backend (nếu có), đảm bảo hạn dùng 7 ngày ─
    const setCookieValues = backendResponse.headers.getSetCookie();
    if (setCookieValues.length > 0) {
      setCookieValues.forEach((c) => {
        responseHeaders.append('Set-Cookie', rewriteSetCookieHeader(c, isForAdmin));
      });
    } else {
      const setCookie = backendResponse.headers.get('set-cookie');
      if (setCookie) {
        responseHeaders.set('Set-Cookie', rewriteSetCookieHeader(setCookie, isForAdmin));
      }
    }

    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('[API Proxy] Error:', error?.message);
    return NextResponse.json(
      { success: false, message: 'Backend không phản hồi', error: error?.message },
      { status: 503, headers: corsHeaders }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;

