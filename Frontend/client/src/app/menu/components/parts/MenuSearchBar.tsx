"use client";

import React from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";

interface MenuSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  suggestions: Product[];
  setSuggestions: (suggestions: Product[]) => void;
}

export const MenuSearchBar = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  suggestions,
  setSuggestions,
}: MenuSearchBarProps) => {
  const router = useRouter();

  return (
    <div className="relative flex-1 md:w-96 group">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white/60 border-none rounded-[20px] text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
        {isSearching && (
          <div className="absolute right-4 animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        )}
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[80]"
          >
            {suggestions.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  router.push(`/product/${item.id}`);
                  setSuggestions([]);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-none"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-primary font-black">{(item.price || 0).toLocaleString('vi-VN')}đ</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
