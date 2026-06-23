// 📄 src/lib/server-api.ts
import { auth } from '@/auth';

const BACKEND_URL = process.env.GLOBAL_BACKEND_IP || 'http://localhost:8080';

export async function getServerApi(endpoint: string, options: RequestInit = {}) {
    try {
        const url = `${BACKEND_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

        const session = await auth();
        const headers = new Headers(options.headers);
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        if (!headers.has('ngrok-skip-browser-warning')) {
            headers.set('ngrok-skip-browser-warning', '69420');
        }

        // Nếu là endpoint lấy danh sách voucher, luôn dùng token khách vãng lai để tránh bị 403 (vì endpoint này là của admin)
        if (endpoint.includes('admin/vouchers')) {
            try {
                const { getGuestAccessToken } = await import('@/lib/guest-auth');
                const guestToken = await getGuestAccessToken();
                if (guestToken) {
                    headers.set('Authorization', `Bearer ${guestToken}`);
                }
            } catch (e) {
                console.error('[server-api] Lỗi lấy token khách vãng lai:', e);
            }
        } else if (session?.accessToken && !headers.has('Authorization')) {
            // Forward Authorization header dự phòng từ session cho các request khác
            headers.set('Authorization', `Bearer ${session.accessToken}`);
        }

        // Lấy cookies từ request context (trình duyệt gửi lên) và forward sang backend
        try {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const cookieHeader = cookieStore.toString();
            if (cookieHeader) {
                headers.set('Cookie', cookieHeader);
            }
        } catch {
            // Không ở trong request context (ví dụ: static generation/build time) -> Bỏ qua
        }

        const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(10000), // Timeout 10 giây
            headers,
            cache: 'no-store', // Đảm bảo dữ liệu luôn mới
        });

        if (!response.ok) {
            console.warn(`[API] ${response.status} ${response.statusText} — ${endpoint}`);
            return null;
        }

        return await response.json();
    } catch (error: any) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
            console.warn(`[API] Timeout khi gọi ${endpoint} — backend có thể đang offline`);
        } else {
            console.warn('[API] Lỗi kết nối backend:', error?.message);
        }
        return null;
    }
}