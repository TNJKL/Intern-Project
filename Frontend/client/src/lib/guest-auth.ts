// 📄 src/lib/guest-auth.ts
// Helper quản lý việc đăng nhập/đăng ký tài khoản khách vãng lai hệ thống ở chế độ ẩn (background)
// giúp lấy token xác thực để fetch danh sách voucher từ database cho khách vãng lai.

let cachedGuestToken: string | null = null;
let tokenExpiry = 0;

export async function getGuestAccessToken(): Promise<string | null> {
    if (cachedGuestToken && Date.now() < tokenExpiry) {
        return cachedGuestToken;
    }

    const BACKEND_URL = process.env.GLOBAL_BACKEND_IP || 'http://localhost:8080';
    const credentials = {
        email: 'guest_system_user@brewtra.vn',
        password: 'guest_password123',
    };

    try {
        // 1. Thử đăng nhập bằng tài khoản khách hệ thống
        let loginRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'ngrok-skip-browser-warning': '69420'
            },
            body: JSON.stringify(credentials)
        });
        
        if (!loginRes.ok) {
            console.log('[Guest Auth] System guest user not found, auto-registering...');
            const registerRes = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'ngrok-skip-browser-warning': '69420'
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                    fullName: 'Guest System User',
                    phone: '0123456789'
                })
            });

            if (registerRes.ok) {
                loginRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'ngrok-skip-browser-warning': '69420'
                    },
                    body: JSON.stringify(credentials)
                });
            }
        }
        
        if (loginRes.ok) {
            const data = await loginRes.json();
            const token = data?.data?.accessToken || data?.accessToken;
            if (token) {
                cachedGuestToken = token;
                // Parse JWT to get expiry
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
                    tokenExpiry = payload.exp ? payload.exp * 1000 - 60000 : Date.now() + 3600000;
                } catch {
                    tokenExpiry = Date.now() + 3600000; // 1 hour fallback
                }
                return cachedGuestToken;
            }
        }
    } catch (e) {
        console.error('Guest auth login error:', e);
    }
    return null;
}
