"use client";

import { Navbar } from "@/components/layout/Navbar";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout } = useAuthStore();

  useEffect(() => {
    const authDataParam = searchParams.get('auth');
    if (authDataParam) {
      try {
        const authData = JSON.parse(decodeURIComponent(authDataParam));
        useAuthStore.getState().setAuth(authData.user, authData.accessToken, authData.refreshToken);
        // Success toast to confirm sync
        toast.success(`Đã đồng bộ tài khoản: ${authData.user.fullName}`);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error('Failed to sync auth data', e);
      }
    }

    if (searchParams.get('logout') === 'true') {
      logout();
      toast.success("Đã đăng xuất khỏi hệ thống");
    }
  }, [searchParams, logout]);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <div className="h-screen overflow-hidden bg-[#fdfaf5]">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Navbar />
      <main className="flex-grow pb-32">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative bg-coffee-dark text-white pt-16 pb-32 px-6 overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <h3 className="text-3xl font-black tracking-widest text-primary/80 uppercase mb-4">
              Brewtra
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Đánh thức mọi giác quan của bạn với những hạt cà phê tuyển chọn và sự tinh tế trong từng giọt pha chế.
            </p>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest">
              © 2026 Brewtra Coffee.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div className="flex flex-col gap-4">
              <h4 className="font-black uppercase tracking-wider text-sm text-primary/80">Liên hệ</h4>
              <div className="flex flex-col gap-2">
                <span className="text-white/60 text-sm">Hotline: <strong className="text-white">1900 1234</strong></span>
                <span className="text-white/60 text-sm">Email: <strong className="text-white">hello@brewtra.vn</strong></span>
                <span className="text-white/60 text-sm">Giờ mở cửa: <strong className="text-white">07:00 - 22:00</strong></span>
              </div>
            </div>
            <div className="flex flex-col gap-4 max-w-[250px]">
              <h4 className="font-black uppercase tracking-wider text-sm text-primary/80">Địa chỉ quán</h4>
              <p className="text-white/60 text-sm leading-relaxed">
                <strong className="text-white">Brewtra Flagship Store</strong><br />
                123 Đường Cà Phê, <br />
                TP. Hồ Chí Minh
              </p>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
      <FloatingNav />
    </div>
  );
}
