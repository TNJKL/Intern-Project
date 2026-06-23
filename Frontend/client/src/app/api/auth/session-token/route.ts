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

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    // Ưu tiên đọc adminRefreshToken trước (vì đây là token của Admin)
    const adminRefreshToken = cookieStore.get('adminRefreshToken')?.value;
    const clientRefreshToken = cookieStore.get('refreshToken')?.value;
    const refreshToken = adminRefreshToken || clientRefreshToken;

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

    // Hàm gọi backend để refresh token với một refreshToken cụ thể
    const callBackendRefresh = async (tokenValue: string): Promise<Response> => {
      return fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
          // Chỉ gửi đúng 1 refreshToken, không gửi cả 2 để tránh xung đột
          'Cookie': `refreshToken=${tokenValue}`,
        },
        signal: AbortSignal.timeout(10000),
      });
    };

    // Ưu tiên dùng adminRefreshToken
    let backendRes = await callBackendRefresh(refreshToken!);

    // Nếu adminRefreshToken đã bị dùng và có clientRefreshToken, thử với clientRefreshToken
    if (!backendRes.ok && adminRefreshToken && clientRefreshToken) {
      const errText = await backendRes.text();
      let parsedErr: any = {};
      try { parsedErr = JSON.parse(errText); } catch {}
      const isReplayed = parsedErr?.message === 'Refresh token đã được sử dụng';
      
      if (isReplayed) {
        console.log('[session-token] adminRefreshToken đã được sử dụng. Thử lại với clientRefreshToken...');
        // Đợi 1 giây để backend commit refreshToken mới
        await new Promise(resolve => setTimeout(resolve, 1000));
        backendRes = await callBackendRefresh(clientRefreshToken);
      }
    }

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
    
    // Lưu ý: Đặt tên là adminAccessToken và adminRefreshToken để tránh đè lên cookie của người dùng thường (Client App)
    responseHeaders.append(
      'Set-Cookie',
      `adminAccessToken=${newAccessToken}; Path=/; Max-Age=604800; SameSite=Lax${secureFlag}`
    );
    if (newRefreshToken) {
      responseHeaders.append(
        'Set-Cookie',
        `adminRefreshToken=${newRefreshToken}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax${secureFlag}`
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
