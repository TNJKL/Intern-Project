/**
 * 📄 src/app/api/auth/[...nextauth]/route.ts
 * Route Handler để NextAuth xử lý các API đăng nhập, đăng xuất, session.
 * Các endpoint được cấp phát tự động:
 *   POST /api/auth/signin/credentials  → Đăng nhập
 *   POST /api/auth/signout             → Đăng xuất
 *   GET  /api/auth/session             → Lấy session hiện tại (cho Admin App đồng bộ)
 *   GET  /api/auth/csrf                → CSRF token
 */
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
