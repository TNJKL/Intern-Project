// 📄 src/proxy.ts
// Middleware Next.js 16 (dùng tên file proxy.ts thay vì middleware.ts)
//
// VẤN ĐỀ CŨ: auth() bọc toàn bộ function → JWT callback chạy 5 giây mỗi request dù không cần.
// FIX: Kiểm tra path trước, chỉ gọi auth() cho route cần bảo vệ.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const reqMethod = request.method;

    // ── FAST-PASS: Không cần auth check ──────────────────────────────────────
    if (
        reqMethod === 'OPTIONS' ||                    // Preflight CORS
        pathname.startsWith('/api/auth') ||           // NextAuth endpoints
        pathname.startsWith('/api/v1') ||             // API proxy routes (đã có handler riêng)
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon')
    ) {
        return NextResponse.next();
    }

    // ── ROUTE GUARD: Chỉ gọi auth() khi vào route được bảo vệ ───────────────
    const isProtected = pathname.startsWith('/profile') || 
                        (pathname.startsWith('/orders') && 
                         !pathname.startsWith('/orders/track') &&
                         pathname !== '/orders');

    if (isProtected) {
        // Gọi auth() không có wrapper → chỉ đọc JWT từ cookie, KHÔNG gọi backend
        // nếu token còn hạn. Chỉ refresh nếu token sắp hết (có timeout 5s ở auth.ts).
        const session = await auth();
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

// CẤU HÌNH MATCHER
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};