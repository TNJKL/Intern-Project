import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = 'https://morbidity-stucco-grower.ngrok-free.dev/api/v1';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Gọi trực tiếp đến Backend
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // 2. Lấy TẤT CẢ cookie từ Backend gửi về
    const cookieStore = await cookies();
    const setCookieHeaders = response.headers.getSetCookie(); 
    

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookieString => {
        const parts = cookieString.split(';');
        const [nameValue] = parts;
        const [name, value] = nameValue.split('=');
        
        const cookieName = name.trim();
        const cookieValue = value.trim();

        // Đồng bộ mọi cookie liên quan đến auth (access, refresh, adminAccess...)
        if (cookieName.toLowerCase().includes('token')) {
          cookieStore.set(cookieName, cookieValue, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 
          });
        }
      });
    }

    // 3. Tự động set accessToken vào cookie nếu Backend trả về trong data
    const accessToken = data?.data?.accessToken || data?.accessToken;
    if (accessToken) {
      cookieStore.set('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 ngày
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Proxy Auth] Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
