"use client";

import { Search, Menu, User, Coffee, ShoppingCart, LogOut, LayoutDashboard, X, Home, Tag, Package, Settings, Sun, Moon, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAppDispatch, useAppSelector } from "@/store/redux/hooks";
import { clearCredentials } from "@/store/redux/authSlice";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { User as UserType } from "@/types/user";
import { createPortal } from "react-dom";

interface NavbarProps {
  initialUser?: UserType | null;
}

export function Navbar({ initialUser }: NavbarProps) {
  const { user, clearUser } = useAuthStore();
  const { clearCart } = useCartStore();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const router = useRouter();
  const pathname = usePathname();
  const cartItemsCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));

  const [preset, setPreset] = useState<"espresso" | "matcha" | "berry">("espresso");
  const [steamEffect, setSteamEffect] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const syncSteam = () => {
      const savedSteam = localStorage.getItem("steamEffect") === "true";
      setSteamEffect(savedSteam);
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem("theme");
      document.documentElement.classList.remove("dark");
      const savedPreset = (localStorage.getItem("preset") as "espresso" | "matcha" | "berry") || "espresso";
      setPreset(savedPreset);
      syncSteam();
      window.addEventListener("steamEffectChanged", syncSteam);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("steamEffectChanged", syncSteam);
      }
    };
  }, []);

  const changePreset = (newPreset: "espresso" | "matcha" | "berry") => {
    setPreset(newPreset);
    localStorage.setItem("preset", newPreset);
    document.documentElement.classList.remove("preset-matcha", "preset-berry");
    if (newPreset === "matcha") {
      document.documentElement.classList.add("preset-matcha");
    } else if (newPreset === "berry") {
      document.documentElement.classList.add("preset-berry");
    }
  };

  const navItems = useMemo(() => [
    { id: "home", icon: Home, label: "Trang chủ", href: "/" },
    { id: "menu", icon: Coffee, label: "Thực đơn", href: "/menu" },
    { id: "orders", icon: Package, label: "Đơn hàng", href: "/orders" },
    { id: "promo", icon: Tag, label: "Ưu đãi", href: "/offers" },
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
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto w-full gap-4 relative">
      {/* Spacer to keep middle nav centered and actions on the right */}
      <div className="shrink-0 w-6" />

      {/* Center Nav Items — hiện trên desktop (lg+) */}
      <div className="hidden lg:flex items-center gap-1">
        {navItems.filter(item => item.id !== 'account').map((item) => {
          const isActive = activeId === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-gray-500 hover:text-coffee-dark hover:bg-gray-100"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {((isMounted && isAuthenticated && user) || initialUser) ? (
          <div className="flex items-center gap-1.5 sm:gap-4">
            {(() => {
              const displayUser = isMounted ? user : initialUser;
              if (!displayUser) return null;

              return (
                <div className="flex items-center gap-1 sm:gap-3">
                  <Link
                    href="/profile"
                    className="flex items-center gap-0 sm:gap-2 p-1 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 text-gray-800 rounded-full hover:bg-primary/10 transition-all group"
                  >
                    <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm group-hover:scale-110 transition-transform shrink-0">
                      {((displayUser as any).fullName || (displayUser as any).name || (displayUser as any).userName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[120px]">
                      {(displayUser as any).fullName || (displayUser as any).name || (displayUser as any).userName || 'Tài khoản'}
                    </span>
                  </Link>

                  {displayUser.role === 'ADMIN' && (
                    <a
                      href="http://localhost:5173/admin/dashboard"
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-coffee-dark text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-primary transition-all shadow-md active:scale-95 animate-pulse"
                    >
                      <LayoutDashboard className="w-3 h-3" />
                      <span className="hidden xs:block">Quản trị</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      dispatch(clearCredentials());
                      clearUser();
                      clearCart();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-all group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">Thoát</span>
                  </button>
                </div>
              );
            })()}
          </div>
        ) : isMounted ? (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 bg-coffee-dark text-white text-xs sm:text-sm font-bold rounded-full hover:bg-primary transition-all shadow-lg shadow-coffee-dark/10 active:scale-95 shrink-0"
          >
            <User className="w-4 h-4" />
            <span>Đăng nhập</span>
          </Link>
        ) : (
          <div className="w-20 sm:w-32 h-8 sm:h-10 bg-gray-50 animate-pulse rounded-full border border-gray-100"></div>
        )}

        <div className="h-8 w-[1px] bg-gray-100 mx-1 hidden sm:block"></div>

        <Link href="/cart" className="relative p-1.5 sm:p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all group active:scale-90">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-primary transition-colors" />
          {isMounted && cartItemsCount > 0 && (
            <span className="absolute top-0.5 right-0.5 sm:top-1.5 sm:right-1.5 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-primary text-white text-[8px] sm:text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform p-1">
              {cartItemsCount}
            </span>
          )}
        </Link>

        {/* Nút Settings */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-1.5 sm:p-2.5 text-gray-600 hover:bg-primary/10 rounded-full transition-all duration-300 active:scale-90 group relative"
          title="Thiết lập & Tiện ích"
        >
          <Settings className="w-5 h-5 sm:w-5.5 sm:h-5.5 group-hover:rotate-90 transition-transform duration-500 text-gray-600 relative z-10" />
        </button>
      </div>

      {/* Drawer menu điều hướng (Slide out from Right) */}
      {isMounted && typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Backdrop mờ nền */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              />

              {/* Sidebar Panel - ĐÃ ĐỔI SANG MÀU KEM SÁNG TRÙNG NỀN VÀ XÓA DARK MODE */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[320px] bg-[#fcf9f2] border-l border-[#855823]/10 shadow-2xl z-[101] p-6 flex flex-col justify-between"
              >
                <div className="overflow-y-auto no-scrollbar flex-grow pb-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-[#855823]/10 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary text-white p-2 rounded-xl">
                        <Settings className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <span className="text-xl font-black uppercase tracking-wider text-coffee-dark">Thiết lập</span>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* Settings list */}
                  <div className="space-y-6">
                    {/* Tông màu chủ đạo */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Tông màu chủ đạo</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => changePreset("espresso")}
                          className={cn(
                            "flex flex-col items-center p-2.5 rounded-2xl border transition-all duration-300 gap-1.5",
                            preset === "espresso"
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          )}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#6f4e37] border-2 border-white shadow-sm flex items-center justify-center">
                            {preset === "espresso" && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[10px]">Espresso</span>
                        </button>

                        <button
                          onClick={() => changePreset("matcha")}
                          className={cn(
                            "flex flex-col items-center p-2.5 rounded-2xl border transition-all duration-300 gap-1.5",
                            preset === "matcha"
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          )}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#587f3d] border-2 border-white shadow-sm flex items-center justify-center">
                            {preset === "matcha" && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[10px]">Matcha</span>
                        </button>

                        <button
                          onClick={() => changePreset("berry")}
                          className={cn(
                            "flex flex-col items-center p-2.5 rounded-2xl border transition-all duration-300 gap-1.5",
                            preset === "berry"
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          )}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#96354e] border-2 border-white shadow-sm flex items-center justify-center">
                            {preset === "berry" && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[10px]">Berry</span>
                        </button>
                      </div>
                    </div>

                    {/* Hiệu ứng Brewtra */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Hiệu ứng Brewtra</p>
                      {/* Đổi box sang màu trắng nền bo viền nhẹ nhàng */}
                      <div className="flex items-center justify-between p-3.5 bg-white border border-[#855823]/10 rounded-2xl">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700">Khói cốc bay bổng</span>
                            <span className="text-[9px] text-gray-400">Bay nhẹ nhàng tại Logo</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newSteam = !steamEffect;
                            setSteamEffect(newSteam);
                            localStorage.setItem("steamEffect", String(newSteam));
                            window.dispatchEvent(new Event("steamEffectChanged"));
                          }}
                          className={cn(
                            "w-10 h-6 rounded-full p-1 transition-all duration-300 relative",
                            steamEffect ? "bg-primary" : "bg-gray-200"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm absolute top-1",
                              steamEffect ? "left-5" : "left-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* ĐÃ LOẠI BỎ TOÀN BỘ PHẦN KHÁM PHÁ BREWTRA LẶP LẠI TẠI ĐÂY */}
                  </div>
                </div>

                {/* Bottom footer/account area */}
                <div className="pt-6 border-t border-[#855823]/10">
                  {isMounted && isAuthenticated && user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black shadow-md shadow-primary/20">
                          {user.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-gray-800 truncate">{user.fullName}</span>
                          <span className="text-[10px] text-gray-400 truncate">{user.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          dispatch(clearCredentials());
                          clearUser();
                          clearCart();
                          signOut({ callbackUrl: "/" });
                        }}
                        className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-full py-3 bg-coffee-dark text-white rounded-xl font-bold hover:bg-primary transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md"
                    >
                      <User className="w-4 h-4" />
                      Đăng nhập ngay
                    </Link>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </nav>
  );
}