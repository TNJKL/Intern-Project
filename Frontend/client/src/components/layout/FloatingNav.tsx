"use client";

import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useAppSelector } from "@/store/redux/hooks";
import { Home, Tag, User, Coffee, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

export function FloatingNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = useMemo(() => {
    return [
      { id: "home", icon: Home, label: "Trang chủ", href: "/" },
      { id: "menu", icon: Coffee, label: "Thực đơn", href: "/menu" },
      {
        id: "orders",
        icon: Package,
        label: "Đơn hàng",
        href: isMounted && isAuthenticated ? "/orders" : "/orders/track",
      },
      { id: "promo", icon: Tag, label: "Ưu đãi", href: "/offers" },
      {
        id: "account",
        icon: User,
        label: "Tài khoản",
        href: isMounted && isAuthenticated
          ? (user?.role === 'ADMIN' ? 'http://localhost:5173/admin/profile' : '/profile')
          : "/login",
      },
    ];
  }, [isAuthenticated, user, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const currentItem = navItems.find((item) => {
      if (item.href === "/") return pathname === "/";
      return pathname.startsWith(item.href) && item.href !== "/";
    });
    if (currentItem) {
      setActiveId(currentItem.id);
    }
  }, [pathname, navItems, isMounted]);

  return (
    /* Chỉ hiển thị trên thiết bị di động (< lg) */
    <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[94%] sm:w-[85%] max-w-[440px] z-50">
      <div className="bg-[#fcf9f2]/95 backdrop-blur-xl border border-[#855823]/10 shadow-[0_12px_35px_rgba(133,88,35,0.15)] flex items-center justify-around px-3 py-2 rounded-full">
        {navItems.map((item) => {
          const isActive = activeId === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveId(item.id)}
              className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group"
            >
              {/* Box chứa Icon */}
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-[#855823] text-white shadow-md shadow-[#855823]/20 scale-105" // Active sẽ đổi sang màu nâu đậm signature của quán
                  : "text-amber-900/40 group-hover:text-[#855823]/80 group-active:scale-95" // Chưa active sẽ là màu nâu xám nhạt thanh lịch
              )}>
                <item.icon className="w-5 h-5" />
              </div>

              {/* Nhãn chữ */}
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wide transition-colors duration-300 leading-none text-center truncate w-full px-1",
                isActive ? "text-[#855823] font-black" : "text-amber-900/50 group-hover:text-[#855823]/70"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}