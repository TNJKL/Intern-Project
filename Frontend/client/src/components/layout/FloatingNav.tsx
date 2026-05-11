"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useAppSelector } from "@/store/hooks";
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

  const navItems = useMemo(() => [
    { id: "home", icon: Home, label: "Trang chủ", href: "/" },
    { id: "menu", icon: Coffee, label: "Thực đơn", href: "/menu" },
    { id: "orders", icon: Package, label: "Đơn hàng", href: "/orders" },
    { id: "promo", icon: Tag, label: "Ưu đãi", href: "#" },
    {
      id: "account",
      icon: User,
      label: "Tài khoản",
      href: isMounted && isAuthenticated
        ? (user?.role === 'ADMIN' ? 'http://localhost:5173/admin/profile' : '/profile')
        : "/login"
    },
  ], [isAuthenticated, user, isMounted]);

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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/80 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-white/50 flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = activeId === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                setActiveId(item.id);
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-gray-400 group-hover:text-primary/60"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter",
                isActive ? "text-primary" : "text-gray-400"
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
