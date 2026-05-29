// 📄 Vị trí file: src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP;

/**
 * Hàm kiểm tra Access Token đã hết hạn hay chưa
 * Giải mã phần payload của JWT và cộng thêm 10 giây bảo hiểm (Buffer)
 */
function isTokenExpired(token: string) {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;
        return exp * 1000 < (Date.now() + 10000); // Trả về true nếu token hết hạn hoặc sắp hết hạn trong 10s tới
    } catch (e) {
        return true;
    }
}

/**
 * 🎯 ĐỊNH NGHĨA PROXY CHUẨN NEXT.JS 16 (TURBOPACK)
 * Xuất hàm dạng Named Export trùng khớp hoàn toàn với tên file 'proxy'
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    let res = NextResponse.next();

    // ------------------------------------------------------------------------
    // CORS Preflight handling cho Admin app trong môi trường Development (Cổng 5173, 5174, 3000)
    // ------------------------------------------------------------------------
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

    // ------------------------------------------------------------------------
    // 1. LOẠI TRỪ CÁC TÀI NGUYÊN TĨNH
    // Bỏ qua kiểm tra để tối ưu hóa hiệu năng, tránh làm chậm ứng dụng
    // ------------------------------------------------------------------------
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/images') ||
        pathname.includes('.')
    ) {
        return res;
    }

    // ------------------------------------------------------------------------
    // ĐỌC VÀ ĐÁNH GIÁ TOKEN TỪ COOKIE BROWSER
    // ------------------------------------------------------------------------
    let accessToken = request.cookies.get('accessToken')?.value || request.cookies.get('adminAccessToken')?.value;
    if (accessToken === 'undefined' || accessToken === 'null') {
        accessToken = undefined;
    }

    // 🔍 TÌNH HUỐNG TREO MÁY: Nếu phát hiện token cũ đã hết hạn, xóa tạm thời trong ngữ cảnh request này
    // Để luồng logic số 2 bên dưới tự động kích hoạt Silent Refresh bằng Refresh Token
    if (accessToken && isTokenExpired(accessToken)) {
        console.log(`⚠️ [Proxy] Phát hiện Access Token hết hạn tại route: ${pathname}. Kích hoạt Silent Refresh...`);
        accessToken = undefined;
    }

    const refreshToken = request.cookies.get('refreshToken')?.value;
    const isAuthPage = pathname === '/login' || pathname === '/register';

    // ------------------------------------------------------------------------
    // 2. CƠ CHẾ TỰ ĐỘNG REFRESH KHI ĐANG DUYỆT TRANG (Page Navigation)
    // Xảy ra khi người dùng F5 hoặc bấm chuyển trang sau một thời gian treo tab dài
    // ------------------------------------------------------------------------
    if (!accessToken && refreshToken && !isAuthPage && !pathname.startsWith('/api')) {
        try {
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
                    // Tạo một lệnh chuyển hướng tải lại đúng URL hiện tại để cập nhật cookie lập tức
                    const redirectRes = NextResponse.redirect(request.url);

                    // Cập nhật lại Access Token mới vào Cookie của trình duyệt
                    const hasAdminCookie = request.cookies.has('adminAccessToken') || pathname.startsWith('/admin');
                    if (hasAdminCookie) {
                        redirectRes.cookies.set('adminAccessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: false });
                    } else {
                        redirectRes.cookies.set('accessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: true });
                    }

                    // Đồng bộ hóa chuỗi xoay vòng token (RTR) nếu NestJS Backend cấp thêm Refresh Token mới qua chuỗi Header Set-Cookie
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
                // Lỗi thảm họa: Refresh Token cũng hết hạn (treo máy hơn 7 ngày) hoặc bị Server từ chối
                const protectedPaths = ['/profile', '/admin'];
                const isProtected = protectedPaths.some(path => pathname.startsWith(path));

                let targetLoginUrl = '/login?logout=true';
                if (pathname.startsWith('/orders') && !pathname.startsWith('/orders/track')) {
                    targetLoginUrl = '/orders/track';
                } else if (!isProtected) {
                    // Nếu lỗi token ở trang Public, cho phép xem trang tiếp nhưng dọn sạch rác cookie cũ để tránh vòng lặp
                    const publicRes = NextResponse.next();
                    publicRes.cookies.delete('accessToken');
                    publicRes.cookies.delete('adminAccessToken');
                    publicRes.cookies.delete('refreshToken');
                    return publicRes;
                }

                const redirectRes = NextResponse.redirect(new URL(targetLoginUrl, request.url));
                redirectRes.cookies.delete('accessToken');
                redirectRes.cookies.delete('adminAccessToken');
                redirectRes.cookies.delete('refreshToken');
                return redirectRes;
            }
        } catch (error) {
            console.error('[Proxy] Gặp lỗi nghiêm trọng khi đổi Token từ trang:', error);
        }
    }

    // ------------------------------------------------------------------------
    // 3. ĐÓN ĐẦU AXIOS CLIENT: Đánh chặn và giải cứu API đổi token ngầm của Frontend
    // Khớp chính xác route Axios gọi lên: /api/auth/token
    // ------------------------------------------------------------------------
    if (pathname === '/api/auth/token') {
        try {
            if (!refreshToken) {
                return NextResponse.json({ message: 'Refresh token missing' }, { status: 401 });
            }

            const refreshResponse = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'Cookie': `refreshToken=${refreshToken}`
                },
                body: JSON.stringify({ refreshToken })
            });

            const responseData = await refreshResponse.json().catch(() => ({}));

            if (refreshResponse.ok) {
                const newAccessToken = responseData?.data?.accessToken || responseData?.accessToken;

                // Trả JSON về cho Axios Client nhận dạng đồng thời ghi vào Redux Store
                const apiRouteRes = NextResponse.json({ accessToken: newAccessToken, ...responseData });

                if (isAllowedOrigin) {
                    apiRouteRes.headers.set('Access-Control-Allow-Origin', origin);
                    apiRouteRes.headers.set('Access-Control-Allow-Credentials', 'true');
                }

                // Đóng đinh Access Token mới tinh vào Cookie của Trình duyệt
                if (newAccessToken) {
                    const hasAdminCookie = request.cookies.has('adminAccessToken') || pathname.startsWith('/admin');
                    if (hasAdminCookie) {
                        apiRouteRes.cookies.set('adminAccessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: false });
                    } else {
                        apiRouteRes.cookies.set('accessToken', newAccessToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: true });
                    }
                }

                // Nếu có xoay vòng Refresh Token mới từ Backend, lưu tiếp luôn
                const newRefreshToken = responseData?.data?.refreshToken || responseData?.refreshToken;
                if (newRefreshToken) {
                    apiRouteRes.cookies.set('refreshToken', newRefreshToken, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax', httpOnly: true });
                }

                return apiRouteRes;
            } else {
                // Đổi token thất bại, trả lỗi 401 chặn Axios và lệnh cho trình duyệt xóa trắng token để ép đăng nhập lại
                const errorRes = NextResponse.json(responseData, { status: 401 });
                errorRes.cookies.delete('accessToken');
                errorRes.cookies.delete('adminAccessToken');
                errorRes.cookies.delete('refreshToken');
                return errorRes;
            }
        } catch (error) {
            console.error('[Proxy] Lỗi crash khi xử lý API /api/auth/token nội bộ:', error);
            return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        }
    }

    // ------------------------------------------------------------------------
    // 4. XỬ LÝ PROXY REWRITE CHO TOÀN BỘ CÁC API KHÁC XUỐNG NESTJS BACKEND
    // Chuyển đổi ngầm url từ hệ thống NextJS sang IP Backend thực tế
    // ------------------------------------------------------------------------
    if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth/login') && !pathname.startsWith('/api/auth/logout')) {
        const targetUrl = `${BACKEND_URL}${pathname}${request.nextUrl.search}`;
        const headers = new Headers(request.headers);
        headers.delete('host'); // Xóa host header gốc của NextJS để bypass bộ lọc bảo mật Ngrok/Domain

        // Đính kèm token sạch (nếu còn sống) vào Authorization Header gửi xuống NestJS
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

    // ------------------------------------------------------------------------
    // 5. ROUTE GUARD: KIỂM TRA BẢO VỆ CÁC TRANG NỘI BỘ (PRIVATE ROUTES)
    // Chặn đứng người dùng chưa đăng nhập khi cố tình truy cập trang cá nhân
    // ------------------------------------------------------------------------
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

/**
 * Cấu hình vùng phủ sóng của file proxy
 * Quét toàn bộ mọi request, ngoại trừ các file tĩnh cốt lõi của Next.js
 */
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};