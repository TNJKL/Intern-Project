import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = `${process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP}/api/v1`;

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  // 1. Gọi API Backend để hủy session
  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `refreshToken=${refreshToken}`, // Gửi refreshToken để BE biết cần hủy session nào
          'ngrok-skip-browser-warning': '69420',
        },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error('[Logout Error] Failed to call backend logout:', error);
    }
  }

  // 2. Xóa sạch các loại cookie auth trên localhost (bao gồm cả rác cũ)
  // Xóa sạch các loại cookie auth với đầy đủ các thuộc tính để trình duyệt chấp nhận
  const options = {
    path: '/',
    secure: true,
    sameSite: 'lax' as const,
    expires: new Date(0),
  };

  cookieStore.set('refreshToken', '', options);
  cookieStore.set('refresh_token', '', options);
  cookieStore.set('accessToken', '', options);
  cookieStore.set('adminAccessToken', '', options);
  cookieStore.set('adminRefreshToken', '', options);

  return NextResponse.json({ success: true });
}
