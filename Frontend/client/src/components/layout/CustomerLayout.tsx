"use client";

import { Navbar } from "@/components/layout/Navbar";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useCartStore } from "@/store/zustand/useCartStore";
import toast from "react-hot-toast";
import { useSession, signOut } from "next-auth/react";
import { SocketProvider } from "@/components/providers/SocketProvider";

import { User } from "@/types/user";
import { orderService } from "@/services/order.service";

interface CustomerLayoutProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export function CustomerLayout({ children, initialUser }: CustomerLayoutProps) {
  const pathname = usePathname();
  const { user, setUser, clearUser } = useAuthStore();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const clearCart = useCartStore((s) => s.clearCart);
  const { data: session, status } = useSession();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Đồng bộ dữ liệu NextAuth session xuống Zustand store (bao gồm cả token xác thực)
  useEffect(() => {
    if (!_hasHydrated) return; // Đợi hydrate xong từ sessionStorage

    if (status === "authenticated" && session) {
      const customUser = session.user as any;
      const accessToken = (session as any).accessToken;
      
      // Chỉ đồng bộ profile từ NextAuth sang Zustand nếu Zustand đang trống hoặc token xoay vòng.
      // Điều này ngăn chặn việc NextAuth session cũ ghi đè ngược lại dữ liệu profile mới vừa cập nhật ở client.
      const hasProfileChanged = !user || useAuthStore.getState().accessToken !== accessToken;

      // Kiểm tra xem store đã được đồng bộ hạng hội viên thực tế chưa
      const hasTierSyncRequired = !user || !user.tier;

      if (hasProfileChanged || hasTierSyncRequired) {
        if (hasTierSyncRequired) {
          // Gọi API lấy hạng thành viên thực tế từ Backend nếu chưa có
          orderService.getMyTier()
            .then((res) => {
              if (res.success && res.data) {
                setUser({ ...customUser, tier: res.data.tier }, accessToken);
              } else {
                setUser(customUser, accessToken);
              }
            })
            .catch((err) => {
              console.warn("[CustomerLayout] Lỗi đồng bộ user tier:", err);
              setUser(customUser, accessToken);
            });
        } else {
          // Nếu đã có tier và chỉ thay đổi thông tin cá nhân khác, giữ nguyên tier cũ trong store để không gọi lại API
          setUser({ ...customUser, tier: user.tier }, accessToken);
        }
      }
    } else if (status === "unauthenticated") {
      if (user || useAuthStore.getState().accessToken) {
        clearUser();
      }
    }
  }, [session, status, setUser, clearUser, _hasHydrated, user]);

  // NOTE: Silent Refresh đã được xử lý tự động bởi Middleware (proxy.ts).
  // KHÔNG gọi refresh ở đây để tránh RTR (Refresh Token Rotation) conflict.
  // Middleware sẽ tự động xoay vòng refreshToken ngầm trước khi request đến tầng ứng dụng.

  // Xử lý sync auth data và logout tập trung
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authDataParam = params.get('auth');
    const logoutParam = params.get('logout');
    const loginParam = params.get('login');

    if (authDataParam) {
      try {
        const authData = JSON.parse(decodeURIComponent(authDataParam));
        setUser(authData.user, authData.accessToken);
        toast.success(`Đã đồng bộ tài khoản: ${authData.user.fullName}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error('Failed to sync auth data', e);
      }
    }

    if (loginParam === 'success') {
      toast.success('Đăng nhập thành công!');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    if (logoutParam === 'true') {
      clearUser();
      clearCart();
      signOut({ redirect: false });
      toast.success('Đã đăng xuất khỏi hệ thống');
      // Xóa tham số logout trên URL để tránh loop khi F5
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [setUser, clearUser, pathname]);

  // Khởi tạo và đồng bộ giao diện (Theme & Preset) từ localStorage để tránh nhấp nháy
  useEffect(() => {
    const savedPreset = localStorage.getItem("preset") || "espresso";

    // Đồng bộ Theme (luôn luôn là light mode như cũ, xóa bỏ chế độ tối)
    localStorage.removeItem("theme");
    document.documentElement.classList.remove("dark");

    // Đồng bộ Preset màu sắc
    document.documentElement.classList.remove("preset-matcha", "preset-berry");
    if (savedPreset === "matcha") {
      document.documentElement.classList.add("preset-matcha");
    } else if (savedPreset === "berry") {
      document.documentElement.classList.add("preset-berry");
    }
  }, []);

  // Tự động đồng bộ hóa Zustand store giữa các tab thời gian thực khi localStorage thay đổi
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user-auth-storage') {
        useAuthStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isAuthPage) {
    return <div className="min-h-screen overflow-y-auto bg-background">{children}</div>;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-background text-foreground transition-colors duration-500">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-gray-100/10 shadow-sm transition-colors duration-500">
          <Navbar initialUser={initialUser} />
        </header>
        {/* FloatingNav: pill trên đầu (md+) hoặc tab bar dưới cùng (< md) */}
        <FloatingNav />

        {/* pb-[88px]: khoảng trống cho bottom tab bar trên mobile */}
        <main className="flex-grow pt-[72px] pb-[88px] lg:pb-32">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative bg-coffee-dark text-white pt-16 pb-32 px-6 overflow-hidden">
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
      </div>
    </SocketProvider>
  );
}
