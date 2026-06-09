// 📄 src/app/api/v1/[...path]/route.ts
// Catch-all proxy: chuyển tiếp mọi request /api/v1/* sang backend
// 
// Thiết kế cookie-only thuần túy:
//  - Chuyển tiếp nguyên vẹn Cookie từ trình duyệt gửi lên (accessToken, refreshToken)
//  - Chuyển tiếp nguyên vẹn Set-Cookie từ backend trả về để trình duyệt cập nhật cookie

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
    const cookie = request.headers.get('cookie');
    if (cookie) {
      forwardHeaders['Cookie'] = cookie;
    }

    // Lấy body (nếu có)
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }

    // Nếu gọi API refresh token của backend qua proxy
    if (pathStr === 'auth/refresh' && request.method === 'POST') {
      let hasRefreshTokenInBody = false;
      if (body) {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.refreshToken) {
            hasRefreshTokenInBody = true;
          }
        } catch {}
      }

      if (!hasRefreshTokenInBody) {
        const cookieHeader = request.headers.get('cookie') || '';
        const getCookie = (name: string) => {
          const match = cookieHeader.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'));
          return match ? decodeURIComponent(match[2]) : null;
        };
        const refreshToken = getCookie('refreshToken');
        if (refreshToken) {
          body = JSON.stringify({ refreshToken });
          forwardHeaders['Content-Type'] = 'application/json';
        }
      }
    }

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

    // Chuyển tiếp nguyên vẹn Set-Cookie từ backend để trình duyệt tự động cập nhật
    // Đồng thời ép thời hạn Max-Age (7 ngày) cho accessToken và refreshToken để tránh biến thành Session Cookie
    const setCookieHeaders = backendResponse.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((c) => {
        let processedCookie = c;
        const isTokenCookie = c.toLowerCase().includes('accesstoken=') || c.toLowerCase().includes('refreshtoken=');
        if (isTokenCookie && !c.includes('Max-Age=') && !c.includes('Expires=')) {
          processedCookie = `${c}; Max-Age=${7 * 24 * 60 * 60}`;
        }
        responseHeaders.append('Set-Cookie', processedCookie);
      });
    } else {
      const setCookie = backendResponse.headers.get('set-cookie');
      if (setCookie) {
        let processedCookie = setCookie;
        const isTokenCookie = setCookie.toLowerCase().includes('accesstoken=') || setCookie.toLowerCase().includes('refreshtoken=');
        if (isTokenCookie && !setCookie.includes('Max-Age=') && !setCookie.includes('Expires=')) {
          processedCookie = `${setCookie}; Max-Age=${7 * 24 * 60 * 60}`;
        }
        responseHeaders.set('Set-Cookie', processedCookie);
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
