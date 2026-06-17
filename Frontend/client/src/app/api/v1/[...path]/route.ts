// 📄 src/app/api/v1/[...path]/route.ts
// Catch-all proxy: chuyển tiếp mọi request /api/v1/* sang backend
//
// Thiết kế:
//  - Chuyển tiếp nguyên vẹn Cookie từ trình duyệt gửi lên (accessToken, refreshToken)
//  - Backend đọc refreshToken từ cookie (không cần body)
//  - Khi auth/refresh hoặc auth/login thành công: tự tạo Set-Cookie bền vững (Max-Age=7 ngày)

import { NextRequest, NextResponse } from 'next/server';

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

/** Đảm bảo cookie accessToken (Path=/) / refreshToken (Path=/api/v1/auth) luôn có Max-Age=7 ngày */
function ensurePersistentCookie(cookieStr: string): string {
  if (!cookieStr.includes('accessToken') && !cookieStr.includes('refreshToken')) {
    return cookieStr;
  }
  
  // Kiểm tra xem đây có phải là cookie xóa (Max-Age=0 hoặc giá trị trống/đã hết hạn)
  const isDelete = /Max-Age=0/i.test(cookieStr) || /expires=Thu, 01 Jan 1970/i.test(cookieStr);
  const isRefresh = cookieStr.includes('refreshToken');
  
  // Xóa sạch các thuộc tính cũ để tránh trùng lặp
  let c = cookieStr
    .replace(/;\s*Max-Age=[^;]*/gi, '')
    .replace(/;\s*Expires=[^;]*/gi, '')
    .replace(/;\s*Path=[^;]*/gi, '')
    .replace(/;\s*HttpOnly/gi, '');
  
  const pathStr = isRefresh ? '/api/v1/auth' : '/';
  
  if (isDelete) {
    c += `; Path=${pathStr}; HttpOnly; Max-Age=0`;
  } else {
    c += `; Path=${pathStr}; HttpOnly; Max-Age=604800`; // 7 ngày
  }
  
  if (!/;\s*SameSite=/i.test(c)) c += '; SameSite=Lax';
  return c;
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
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // ── Xây dựng URL backend ────────────────────────────────────────────────
    const pathStr = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

    // ── Đọc body gốc từ request (nếu có) ────────────────────────────────────
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text();
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

    // Forward nguyên vẹn Cookie của trình duyệt (chứa accessToken, refreshToken)
    const cookieHeader = request.headers.get('cookie') || '';
    if (cookieHeader) {
      forwardHeaders['Cookie'] = cookieHeader;
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
    // → Proxy tự tạo Set-Cookie với Max-Age=7 ngày, HttpOnly
    if ((pathStr === 'auth/refresh' || pathStr === 'auth/login') && backendResponse.ok) {
      try {
        const data = JSON.parse(responseText);
        const newAccessToken = data?.data?.accessToken || data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;

        if (newAccessToken) {
          const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
          responseHeaders.append(
            'Set-Cookie',
            `accessToken=${newAccessToken}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax${secureFlag}`
          );
          if (newRefreshToken) {
            responseHeaders.append(
              'Set-Cookie',
              `refreshToken=${newRefreshToken}; Path=/api/v1/auth; HttpOnly; Max-Age=604800; SameSite=Lax${secureFlag}`
            );
          }
        }
      } catch {
        // Không parse được JSON – bỏ qua, vẫn trả về response bình thường
      }
    }

    // ── Chuyển tiếp Set-Cookie từ backend (nếu có), đảm bảo hạn dùng 7 ngày ─
    const setCookieValues = backendResponse.headers.getSetCookie();
    if (setCookieValues.length > 0) {
      setCookieValues.forEach((c) => {
        responseHeaders.append('Set-Cookie', ensurePersistentCookie(c));
      });
    } else {
      const setCookie = backendResponse.headers.get('set-cookie');
      if (setCookie) {
        responseHeaders.set('Set-Cookie', ensurePersistentCookie(setCookie));
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
