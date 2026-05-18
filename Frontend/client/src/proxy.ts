import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP;

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let res = NextResponse.next();

  // 1. Các file tĩnh và hệ thống (bỏ qua middleware)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return res;
  }

  // Đọc cookies
  const accessToken = request.cookies.get('accessToken')?.value || request.cookies.get('adminAccessToken')?.value;
  const adminAccessToken = request.cookies.get('adminAccessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // 2. Cơ chế Silent Refresh cho tất cả các request
  if (!accessToken && refreshToken) {
    try {
      // console.log('[Auth] Token missing, refreshing...');

      const refreshResponse = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Cookie': `refreshToken=${refreshToken}`
        }
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newAccessToken = data?.data?.accessToken || data?.accessToken;

        if (newAccessToken) {
          // console.log('[Auth] Success');

          // Tạo redirect về chính trang hiện tại để áp dụng cookie ngay lập tức cho request tiếp theo
          const redirectRes = NextResponse.redirect(request.url);

          // Kiểm tra xem là admin hay user
          const hasAdminCookie = request.cookies.has('adminAccessToken') || pathname.startsWith('/admin');
          if (hasAdminCookie) {
            redirectRes.cookies.set('adminAccessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax' });
          } else {
            redirectRes.cookies.set('accessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax' });
          }
          return redirectRes;
        }
      } else {
        // console.log('[Auth] Refresh failed');
        // Refresh token không hợp lệ -> xóa sạch token
        const protectedPaths = ['/profile', '/admin', '/orders', '/checkout'];
        if (protectedPaths.some(path => pathname.startsWith(path))) {
          const redirectRes = NextResponse.redirect(new URL('/login?logout=true', request.url));
          redirectRes.cookies.delete('accessToken');
          redirectRes.cookies.delete('adminAccessToken');
          redirectRes.cookies.delete('refreshToken');
          return redirectRes;
        }
      }
    } catch (error) {
      console.error('[Middleware] Error during token refresh:', error);
    }
  }

  // 3. Xử lý Proxy cho /api (TRỪ /api/auth của Next.js route handlers)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth/login') && !pathname.startsWith('/api/auth/logout')) {
    const targetUrl = `${BACKEND_URL}${pathname}`;
    const headers = new Headers(request.headers);
    headers.delete('host'); // Bắt buộc phải xóa host header khi dùng proxy với Ngrok

    // Nếu token vừa được refresh, nó sẽ nằm trong redirect chứ không chạy đến đây. 
    // Nếu có token sẵn thì dùng.
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    headers.set('ngrok-skip-browser-warning', '69420');

    return NextResponse.rewrite(new URL(targetUrl), {
      request: {
        headers: headers,
      },
    });
  }

  // 4. Bảo vệ các trang nội bộ
  const protectedPaths = ['/profile', '/admin', '/orders', '/checkout'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (!accessToken && !refreshToken && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
