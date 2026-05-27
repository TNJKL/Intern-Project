import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP;

function isTokenExpired(token: string) {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp;
    return exp * 1000 < (Date.now() + 10000); // Thêm buffer 10s
  } catch (e) {
    return true;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let res = NextResponse.next();

  // CORS Preflight handling for Admin app in Development
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && (origin === 'http://localhost:5173' || origin === 'http://localhost:5174' || origin === 'http://localhost:3000');
  
  if (request.method === 'OPTIONS' && isAllowedOrigin) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // 1. Các file tĩnh và hệ thống (bỏ qua middleware)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return res;
  }

  // Đọc cookies
  let accessToken = request.cookies.get('accessToken')?.value || request.cookies.get('adminAccessToken')?.value;
  if (accessToken === 'undefined' || accessToken === 'null') {
    accessToken = undefined;
  }
  
  if (accessToken && isTokenExpired(accessToken)) {
    accessToken = undefined;
  }

  const adminAccessToken = request.cookies.get('adminAccessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // 2. Cơ chế Silent Refresh (chỉ bỏ qua trang đăng nhập/đăng ký để tránh loop, cho phép chạy trên các trang public như trang chủ)
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (!accessToken && refreshToken && !isAuthPage) {
    try {
      // console.log('[Auth] Token missing, refreshing...');

      const refreshResponse = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Cookie': `refreshToken=${refreshToken}`
        },
        body: JSON.stringify({ refreshToken })
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

          // Đồng bộ và gán các cookie khác (đặc biệt là refreshToken mới sau khi xoay vòng - RTR)
          const setCookieHeaders = refreshResponse.headers.getSetCookie();
          if (setCookieHeaders && setCookieHeaders.length > 0) {
            setCookieHeaders.forEach(cookieString => {
              const parts = cookieString.split(';');
              const [nameValue] = parts;
              const [name, value] = nameValue.split('=');
              const cookieName = name.trim();
              const cookieValue = value.trim();
              if (cookieName.toLowerCase().includes('token')) {
                const isHttpOnly = !cookieName.includes('adminAccessToken');
                redirectRes.cookies.set(cookieName, cookieValue, {
                  httpOnly: isHttpOnly,
                  secure: true,
                  sameSite: 'lax',
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7
                });
              }
            });
          }

          return redirectRes;
        }
      } else {
        // console.log('[Auth] Refresh failed');
        // Refresh token không hợp lệ -> xóa sạch token
        const protectedPaths = ['/profile', '/admin'];
        const isProtected = protectedPaths.some(path => pathname.startsWith(path));
        if (isProtected) {
          const redirectRes = NextResponse.redirect(new URL('/login?logout=true', request.url));
          redirectRes.cookies.delete('accessToken');
          redirectRes.cookies.delete('adminAccessToken');
          redirectRes.cookies.delete('refreshToken');
          return redirectRes;
        } else if (pathname.startsWith('/orders') && !pathname.startsWith('/orders/track')) {
          const redirectRes = NextResponse.redirect(new URL('/orders/track', request.url));
          redirectRes.cookies.delete('accessToken');
          redirectRes.cookies.delete('adminAccessToken');
          redirectRes.cookies.delete('refreshToken');
          return redirectRes;
        } else {
          // Với các trang public khác (như trang chủ /), xóa cookie và redirect về chính nó để clear sạch trên browser
          const redirectRes = NextResponse.redirect(request.url);
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

  // 2.5 Intercept direct auth refresh requests to properly forward refreshToken in request body
  if (pathname === '/api/v1/auth/refresh') {
    try {
      if (!refreshToken) {
        const errorRes = NextResponse.json({ message: 'Refresh token missing' }, { status: 401 });
        if (isAllowedOrigin) {
          errorRes.headers.set('Access-Control-Allow-Origin', origin);
          errorRes.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        return errorRes;
      }

      const refreshResponse = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Cookie': `refreshToken=${refreshToken}`,
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ refreshToken })
      });

      const responseData = await refreshResponse.json().catch(() => ({}));

      if (refreshResponse.ok) {
        const newAccessToken = responseData?.data?.accessToken || responseData?.accessToken;
        const newRes = NextResponse.json(responseData);
        
        if (isAllowedOrigin) {
          newRes.headers.set('Access-Control-Allow-Origin', origin);
          newRes.headers.set('Access-Control-Allow-Credentials', 'true');
        }

        if (newAccessToken) {
          const hasAdminCookie = request.cookies.has('adminAccessToken') || pathname.startsWith('/admin');
          if (hasAdminCookie) {
            newRes.cookies.set('adminAccessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: false });
          } else {
            newRes.cookies.set('accessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: true });
          }
        }
        
        const newRefreshToken = responseData?.data?.refreshToken || responseData?.refreshToken;
        if (newRefreshToken) {
          newRes.cookies.set('refreshToken', newRefreshToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: true });
        }

        // Synchronize and set other cookies if needed
        const setCookieHeaders = refreshResponse.headers.getSetCookie();
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          setCookieHeaders.forEach(cookieString => {
            const parts = cookieString.split(';');
            const [nameValue] = parts;
            const [name, value] = nameValue.split('=');
            const cookieName = name.trim();
            const cookieValue = value.trim();
            if (cookieName.toLowerCase().includes('token')) {
              const isHttpOnly = !cookieName.includes('adminAccessToken');
              newRes.cookies.set(cookieName, cookieValue, {
                httpOnly: isHttpOnly,
                secure: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7
              });
            }
          });
        }

        return newRes;
      } else {
        const errorRes = NextResponse.json(responseData, { status: refreshResponse.status });
        if (isAllowedOrigin) {
          errorRes.headers.set('Access-Control-Allow-Origin', origin);
          errorRes.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        errorRes.cookies.delete('accessToken');
        errorRes.cookies.delete('adminAccessToken');
        errorRes.cookies.delete('refreshToken');
        return errorRes;
      }
    } catch (error) {
      console.error('[Middleware] Error proxying direct refresh request:', error);
      const errorRes = NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      if (isAllowedOrigin) {
        errorRes.headers.set('Access-Control-Allow-Origin', origin);
        errorRes.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      return errorRes;
    }
  }

  // 3. Xử lý Proxy cho /api (TRỪ /api/auth và /api/orders của Next.js route handlers)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth/login') && !pathname.startsWith('/api/auth/logout') && !pathname.startsWith('/api/orders')) {
    const targetUrl = `${BACKEND_URL}${pathname}${request.nextUrl.search}`;
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
  const protectedPaths = ['/profile', '/admin'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (!accessToken && !refreshToken) {
    if (isProtectedPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/orders') && !pathname.startsWith('/orders/track')) {
      return NextResponse.redirect(new URL('/orders/track', request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
