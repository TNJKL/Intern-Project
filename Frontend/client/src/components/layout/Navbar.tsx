"use client";

import { Search, Menu, User, Coffee, ShoppingCart, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCredentials } from "@/store/authSlice";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";

import { User as UserType } from "@/types/user";

interface NavbarProps {
  initialUser?: UserType | null;
}

export function Navbar({ initialUser }: NavbarProps) {
  const { user, clearUser } = useAuthStore();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const cartItemsCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full gap-4">
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
                      {displayUser.fullName?.charAt(0).toUpperCase() || 'LG'}
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[120px]">
                      {displayUser.fullName || 'Đăng nhập'}
                    </span>
                  </Link>

                  {displayUser.role === 'ADMIN' && (
                    <a
                      href="http://localhost:5173/admin/dashboard"
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-coffee-dark text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-primary transition-all shadow-md active:scale-95"
                    >
                      <LayoutDashboard className="w-3 h-3" />
                      <span className="hidden xs:block">Quản trị</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      dispatch(clearCredentials());
                      clearUser();
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

        <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-90">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
