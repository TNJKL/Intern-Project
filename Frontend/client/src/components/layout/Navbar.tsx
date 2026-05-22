"use client";

import { Search, Menu, User, Coffee, ShoppingCart, LogOut, LayoutDashboard, X, Home, Tag, Package } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAppDispatch, useAppSelector } from "@/store/redux/hooks";
import { clearCredentials } from "@/store/redux/authSlice";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { User as UserType } from "@/types/user";

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full gap-4 relative">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <div className="bg-primary text-white p-2 rounded-xl group-hover:bg-coffee-dark transition-colors duration-300 shadow-lg shadow-primary/20">
          <Coffee className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-2xl md:text-3xl font-black tracking-widest uppercase">
            <span className="text-coffee-dark">Brew</span>
            <span className="text-primary">tra</span>
          </span>
          {isMounted && isAuthenticated && user?.role === 'ADMIN' && (
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-0.5">Admin Panel</span>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {((isMounted && isAuthenticated && user) || initialUser) ? (
          <div className="flex items-center gap-2 sm:gap-4">
            {(() => {
              const displayUser = isMounted ? user : initialUser;
              if (!displayUser) return null;

              return (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/5 border border-primary/10 text-gray-800 rounded-full hover:bg-primary/10 transition-all group"
                  >
                    <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm group-hover:scale-110 transition-transform">
                      {((displayUser as any).fullName || (displayUser as any).name || (displayUser as any).userName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[120px]">
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
                      axios.post('/api/auth/logout').then(() => {
                        if (pathname === '/profile' || pathname.startsWith('/admin')) {
                          router.push('/');
                        } else {
                          router.refresh();
                        }
                      });
                    }}
                    className="flex items-center gap-1.5 p-2 text-gray-400 hover:text-red-500 transition-all group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">Thoát</span>
                  </button>
                </div>
              );
            })()}
          </div>
        ) : isMounted ? (
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-2.5 bg-coffee-dark text-white text-sm font-bold rounded-full hover:bg-primary transition-all shadow-lg shadow-coffee-dark/10 active:scale-95"
          >
            <User className="w-4 h-4" />
            <span>Đăng nhập</span>
          </Link>
        ) : (
          <div className="w-32 h-10 bg-gray-50 animate-pulse rounded-full border border-gray-100"></div>
        )}

        <div className="h-8 w-[1px] bg-gray-100 mx-1 hidden sm:block"></div>

        <Link href="/cart" className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all group active:scale-90">
          <ShoppingCart className="w-6 h-6 group-hover:text-primary transition-colors" />
          {isMounted && cartItemsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform p-1">
              {cartItemsCount}
            </span>
          )}
        </Link>

        {/* 3 Gạch Menu (Burger Icon) */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-90"
        >
          <Menu className="w-6 h-6 animate-pulse" />
        </button>
      </div>

      {/* Drawer menu điều hướng (Slide out from Right) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[300px] bg-[#fdfaf5] shadow-2xl z-[101] p-6 flex flex-col justify-between border-l border-white/20"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-white p-2 rounded-xl">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black uppercase tracking-wider text-coffee-dark">Brewtra</span>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Nav Items list */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Khám phá Brewtra</p>
                  {navItems.map((item) => {
                    const isActive = activeId === item.id;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                          isActive 
                            ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold" 
                            : "text-gray-600 hover:bg-gray-100 hover:text-coffee-dark"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                        <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Bottom footer/account area */}
              <div className="pt-6 border-t border-gray-100">
                {isMounted && isAuthenticated && user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black">
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
                        axios.post('/api/auth/logout').then(() => {
                          router.push('/');
                        });
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
      </AnimatePresence>
    </nav>
  );
}
