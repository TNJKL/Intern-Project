// 📄 src/app/api/auth/session-token/route.ts
//
// Endpoint nội bộ phục vụ Admin App (localhost:5173) lấy accessToken mới.
// Admin gọi GET /api/auth/session-token với withCredentials: true
// → Server đọc refreshToken từ cookie HttpOnly → gọi backend → trả về token mới
// → Proxy tự set lại cookie accessToken/refreshToken bền vững cho trình duyệt

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';

const BACKEND_URL = process.env.GLOBAL_BACKEND_IP || 'http://localhost:8080';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      // Thử lấy từ NextAuth session nếu cookie không có
      const session = await auth();
      if (!session?.refreshToken) {
        return NextResponse.json(
          { error: 'RefreshTokenError', message: 'No refresh token available' },
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }

    // Lấy cookie header từ request để forward xuống backend
    const cookieHeader = request.headers.get('cookie') || '';

    // Gọi backend refresh endpoint — backend đọc refreshToken từ Cookie header
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error('[session-token] Backend refresh thất bại:', backendRes.status, errText);
      return NextResponse.json(
        { error: 'RefreshTokenError', message: 'Token refresh failed' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const data = await backendRes.json();
    const newAccessToken = data?.data?.accessToken || data?.accessToken;
    const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;
    const user = data?.data?.user || data?.user;

    if (!newAccessToken) {
      return NextResponse.json(
        { error: 'RefreshTokenError', message: 'No access token in response' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Tạo response với Set-Cookie bền vững (HttpOnly, 7 ngày)
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';

    const responseHeaders = new Headers(CORS_HEADERS);
    responseHeaders.append(
      'Set-Cookie',
      `accessToken=${newAccessToken}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax${secureFlag}`
    );
    if (newRefreshToken) {
      responseHeaders.append(
        'Set-Cookie',
        `refreshToken=${newRefreshToken}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax${secureFlag}`
      );
    }
    responseHeaders.set('Content-Type', 'application/json');

    return new NextResponse(
      JSON.stringify({ accessToken: newAccessToken, user }),
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    console.error('[session-token] Lỗi:', error?.message);
    return NextResponse.json(
      { error: 'RefreshTokenError', message: error?.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
