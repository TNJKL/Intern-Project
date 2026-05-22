import LoginForm from "./components/LoginForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Đăng nhập | Brewtra Coffee",
  description: "Đăng nhập để trải nghiệm hương vị cà phê tuyệt hảo tại Brewtra Coffee.",
};

import { getServerApi } from "@/lib/server-api";
import { Suspense } from "react";

export default async function LoginPage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken');

  // Chỉ chuyển hướng nếu có token VÀ token đó hợp lệ (lấy được profile)
  // TRỪ KHI đang có yêu cầu logout=true
  if (accessToken && params?.logout !== 'true') {
    let redirectPath = "/";
    let shouldRedirect = false;

    try {
      const response = await getServerApi('/api/v1/auth/me');
      const user = response?.data || response;
      const role = user?.role;

      // Nếu API trả về thành công (token hợp lệ) mới redirect
      if (response && (response.success === true || user?.id || user?.email)) {
        shouldRedirect = true;
        
        // Nếu là ADMIN, chuyển sang trang quản trị (Vite port 5173)
        if (role === 'ADMIN' || role === 'admin') {
          redirectPath = "http://localhost:5173";
        }
      } else {
        console.log('Login page: Token invalid, showing form');
      }
    } catch (error) {
      console.log('Login page: Fetch error, showing form');
    }

    if (shouldRedirect) {
      redirect(redirectPath);
    }
  }

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#fdfaf5]">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
