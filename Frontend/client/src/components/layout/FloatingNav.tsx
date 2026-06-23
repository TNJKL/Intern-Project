"use client";

import { useAuthStore } from "@/store/zustand/useAuthStore";
import { Home, Tag, User, Coffee, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSocket } from "@/components/providers/SocketProvider";
import { useSession } from "next-auth/react";


export function FloatingNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  // Dùng useSession trực tiếp để tránh race condition với Redux store
  // (Redux chỉ được sync sau khi useSession resolve, nên không dùng Redux ở đây)
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { pendingPayment } = useSocket();
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
      <div className="bg-secondary/95 backdrop-blur-xl border border-primary/10 shadow-lg flex items-center justify-around px-3 py-2 rounded-full">
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
                "p-2 rounded-xl transition-all duration-300 relative",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" // Active sẽ đổi màu theo theme preset
                  : "text-primary/40 group-hover:text-primary/80 group-active:scale-95" // Chưa active sẽ là màu theo theme
              )}>
                <item.icon className="w-5 h-5" />
                {item.id === "orders" && pendingPayment && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 text-[8px] font-black text-white items-center justify-center border border-white">
                      {pendingPayment.totalPendingCount}
                    </span>
                  </span>
                )}
              </div>

              {/* Nhãn chữ */}
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wide transition-colors duration-300 leading-none text-center truncate w-full px-1",
                isActive ? "text-primary font-black" : "text-primary/50 group-hover:text-primary/70"
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