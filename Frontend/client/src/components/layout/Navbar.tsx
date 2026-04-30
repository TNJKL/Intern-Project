"use client";

import { Search, Menu, User, Coffee, ShoppingCart } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full gap-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <div className="bg-primary text-white p-2 rounded-xl group-hover:bg-coffee-dark transition-colors duration-300 shadow-lg shadow-primary/20">
          <Coffee className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <span className="text-2xl md:text-3xl font-black tracking-widest uppercase">
          <span className="text-coffee-dark">Brew</span>
          <span className="text-primary">tra</span>
        </span>
      </Link>

      {/* Search Bar - Hidden on very small screens, expanded on others */}
      <div className="hidden sm:flex flex-1 max-w-md mx-auto relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <input 
          type="text" 
          placeholder="Tìm kiếm hương vị cà phê..." 
          className="w-full bg-[#fdfaf5] border border-gray-200 text-gray-800 text-sm font-medium rounded-full pl-12 pr-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button className="sm:hidden p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <Link href="/login" className="hidden md:flex items-center gap-2 px-6 py-3 bg-coffee-dark text-white text-sm font-bold rounded-full hover:bg-primary transition-colors shadow-lg shadow-coffee-dark/20 active:scale-95">
          <User className="w-4 h-4" />
          Đăng nhập
        </Link>
        
        <Link href="/cart" className="relative p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-200 active:scale-95 group">
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform">
            3
          </span>
        </Link>

        <button className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-200 active:scale-95">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
