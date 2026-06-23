/**
 * 📄 src/auth.ts
 * Cấu hình trung tâm NextAuth.js (Auth.js v5 Beta)
 *
 * DEBUGGING VERSION: Có log chi tiết để xác định nguyên nhân bị đăng xuất.
 * Theo dõi log trong terminal (npm run dev) để debug.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { User as CustomUser } from '@/types/user';
import type { JWT } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.GLOBAL_BACKEND_IP || 'http://localhost:8080';

// ─── Type extensions ──────────────────────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    accessToken: string;
    refreshToken: string;
    user: CustomUser;
    error?: 'RefreshTokenError';
  }
  interface User {
    id?: string;
    accessToken: string;
    refreshToken: string;
    profile: CustomUser;
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    profile: CustomUser;
    error?: 'RefreshTokenError';
  }
}

// ─── Helper: Giải mã thời gian hết hạn từ JWT ────────────────────────────────
function getTokenExpiry(token: string): number {
  try {
    const base64Url = token?.split('.')?.[1];
    if (!base64Url) {
      console.warn('[NextAuth] ⚠️ getTokenExpiry: Token format không hợp lệ (không có phần payload)');
      return 0;
    }
    // JWT dùng base64url (thay - bằng + và _ bằng /) trước khi decode
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

    if (!payload.exp) {
      console.warn(
        '[NextAuth] ⚠️ getTokenExpiry: Token KHÔNG CÓ trường "exp"!\n' +
        '  → accessTokenExpires sẽ = 0 → jwt callback sẽ gọi refresh LIÊN TỤC mỗi request!\n' +
        '  → Đây có thể là nguyên nhân chính gây ra race condition và logout.\n' +
        '  → Hãy kiểm tra backend: accessToken có chứa trường "exp" trong payload không?'
      );
      return 0;
    }

    return payload.exp * 1000; // Đổi về ms
  } catch (e) {
    console.warn('[NextAuth] ⚠️ getTokenExpiry: Exception khi parse token:', e);
    return 0;
  }
}

// ─── NextAuth Configuration ───────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: 'POST',
            signal: AbortSignal.timeout(8000),
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': '69420',
            },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          });

          const data = await res.json();
          if (!res.ok || !data?.success) return null;

          const accessToken: string = data.data?.accessToken || data.accessToken;
          const refreshToken: string = data.data?.refreshToken || data.refreshToken;
          const profile: CustomUser = data.data?.user || data.user;

          if (!accessToken || !profile) return null;

          const expiry = getTokenExpiry(accessToken);
          console.log(
            `[NextAuth] ✅ authorize: Đăng nhập thành công.\n` +
            `  User ID: ${profile.id}\n` +
            `  accessToken hết hạn lúc: ${expiry ? new Date(expiry).toISOString() : 'KHÔNG XÁC ĐỊNH (exp=0)'}`
          );

          // Ghi cookies HttpOnly bền vững vào trình duyệt (maxAge 7 ngày)
          // QUAN TRỌNG: phải có maxAge, nếu không cookie sẽ là Session Cookie
          // và bị trình duyệt xóa khi tab đi vào chế độ ngủ (Memory Saver)
          try {
            const cookieStore = await cookies();
            const role = profile?.role?.toUpperCase();
            const isAdmin = role === 'ADMIN' || role === 'STAFF';

            const accessName = isAdmin ? 'adminAccessToken' : 'accessToken';
            const refreshName = isAdmin ? 'adminRefreshToken' : 'refreshToken';
            const lastRefreshedName = isAdmin ? 'adminLastRefreshedToken' : 'lastRefreshedToken';

            const cookieOptions = {
              path: '/',
              httpOnly: !isAdmin, // Admin needs to read accessToken via js-cookie
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              maxAge: 7 * 24 * 60 * 60, // 7 ngày (giây)
            };

            // Set access token
            cookieStore.set(accessName, accessToken, cookieOptions);

            // Set refresh token (always httpOnly: true, path /api/v1/auth)
            cookieStore.set(refreshName, refreshToken, {
              ...cookieOptions,
              httpOnly: true,
              path: '/api/v1/auth',
            });

            // Set last refreshed token (always httpOnly: false, path /)
            cookieStore.set(lastRefreshedName, accessToken, {
              path: '/',
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              maxAge: 7 * 24 * 60 * 60,
            });

            // Cleanup opposite role's cookies to prevent conflicts
            if (isAdmin) {
              cookieStore.delete('accessToken');
              cookieStore.delete('lastRefreshedToken');
              cookieStore.delete({ name: 'refreshToken', path: '/api/v1/auth' });
            } else {
              cookieStore.delete('adminAccessToken');
              cookieStore.delete('adminLastRefreshedToken');
              cookieStore.delete({ name: 'adminRefreshToken', path: '/api/v1/auth' });
            }
          } catch (e) {
            console.warn('[NextAuth] authorize: Không thể set browser cookies:', e);
          }

          return { id: profile.id, accessToken, refreshToken, profile };
        } catch (error) {
          console.error('[NextAuth] authorize Exception:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Đọc cookie browser hiện tại (an toàn, bỏ qua nếu không trong request context)
      let cookieAccessToken: string | undefined;
      let cookieRefreshToken: string | undefined;
      try {
        const cookieStore = await cookies();
        const role = token?.profile?.role?.toUpperCase() || (user as any)?.profile?.role?.toUpperCase();
        const isAdmin = role === 'ADMIN' || role === 'STAFF';
        const accessName = isAdmin ? 'adminAccessToken' : 'accessToken';
        const refreshName = isAdmin ? 'adminRefreshToken' : 'refreshToken';

        cookieAccessToken = cookieStore.get(accessName)?.value;
        cookieRefreshToken = cookieStore.get(refreshName)?.value;
      } catch {
        // Bình thường nếu chạy ngoài request context (vd: background revalidation)
      }

      // ── Lần đầu đăng nhập ────────────────────────────────────────────────────
      if (user) {
        console.log('[JWT] 🆕 Lần đầu đăng nhập, khởi tạo session token');
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: getTokenExpiry(user.accessToken),
          profile: user.profile,
        };
      }

      // ── Đồng bộ nếu client-side Axios đã refresh và cập nhật cookie ─────────
      if (cookieAccessToken && cookieAccessToken !== token.accessToken) {
        console.log('[JWT] ♻️ Cookie đã được Axios client cập nhật → đồng bộ session');
        return {
          ...token,
          accessToken: cookieAccessToken,
          refreshToken: cookieRefreshToken || token.refreshToken,
          accessTokenExpires: getTokenExpiry(cookieAccessToken),
          error: undefined,
        };
      }

      // ── Kiểm tra thời hạn token ───────────────────────────────────────────────
      const now = Date.now();
      const remainingMs = token.accessTokenExpires - now;

      // Cảnh báo nếu exp = 0 (nghĩa là getTokenExpiry luôn trả về 0)
      if (token.accessTokenExpires === 0) {
        console.warn(
          '[JWT] ⚠️ token.accessTokenExpires = 0!\n' +
          '  Nguyên nhân: backend accessToken không có trường "exp", hoặc format không chuẩn JWT.'
        );
      }

      // Trả về token hiện tại, để client-side tự làm mới qua cookie để tránh race condition
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.user = token.profile as any;
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },

  events: {
    async signOut() {
      try {
        const cookieStore = await cookies();
        // Xóa các cookie ở Path=/
        cookieStore.delete('accessToken');
        cookieStore.delete('refreshToken'); // Xoá phòng hờ bản cũ ở path=/
        cookieStore.delete('lastRefreshedToken');
        cookieStore.delete('adminAccessToken');
        cookieStore.delete('adminRefreshToken'); // Xoá phòng hờ bản cũ ở path=/
        cookieStore.delete('adminLastRefreshedToken');
        
        // Xóa các cookie HttpOnly ở Path=/api/v1/auth để tránh sót rác
        cookieStore.delete({ name: 'refreshToken', path: '/api/v1/auth' });
        cookieStore.delete({ name: 'adminRefreshToken', path: '/api/v1/auth' });
        
        console.log('[NextAuth] signOut: Đã xóa toàn bộ cookies bao gồm admin cookies ở mọi path');
      } catch (e) {
        console.error('[NextAuth] signOut: Lỗi khi xóa cookies:', e);
      }
    },
  },

  pages: { signIn: '/login', error: '/login' },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 ngày
  },
});
