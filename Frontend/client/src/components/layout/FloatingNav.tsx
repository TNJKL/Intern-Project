"use client";

import Link from "next/link";
import { Home, Tag, User, Info, Coffee, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Trang chủ", href: "/" },
  { id: "menu", icon: Coffee, label: "Thực đơn", href: "/menu" },
  { id: "orders", icon: Package, label: "Đơn hàng", href: "/orders" },
  { id: "promo", icon: Tag, label: "Ưu đãi", href: "#" },
  { id: "account", icon: User, label: "Tài khoản", href: "/login" },
];

export function FloatingNav() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register") {
      setActiveId("account");
    } else if (pathname === "/menu") {
      setActiveId("menu");
    } else if (pathname === "/orders") {
      setActiveId("orders");
    } else if (pathname === "/") {
      const hash = window.location.hash;
      if (hash === "#about") setActiveId("about");
      else setActiveId("home");
    }
  }, [pathname]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/80 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-white/50 flex items-center gap-8">
        {NAV_ITEMS.map((item) => {
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

