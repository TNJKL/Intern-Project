import { NextResponse } from 'next/server';
import { getGuestAccessToken } from '@/lib/guest-auth';

const BACKEND_URL = process.env.GLOBAL_BACKEND_IP || 'http://localhost:8080';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const size = searchParams.get('size') || '100';

        // Lấy token của khách vãng lai
        const guestToken = await getGuestAccessToken();
        if (!guestToken) {
            return NextResponse.json({ success: false, message: 'Could not authenticate as guest system user' }, { status: 500 });
        }

        const res = await fetch(`${BACKEND_URL}/api/v1/admin/vouchers?size=${size}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${guestToken}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '69420'
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            return NextResponse.json({ success: false, message: `Backend returned ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
