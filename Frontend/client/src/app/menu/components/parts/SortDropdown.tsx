"use client";

import React from "react";
import { SlidersHorizontal, Coffee, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SortDropdownProps {
  sortType: string;
  handleSortChange: (type: string) => void;
  isSortOpen: boolean;
  setIsSortOpen: (isOpen: boolean) => void;
}

export const SortDropdown = ({
  sortType,
  handleSortChange,
  isSortOpen,
  setIsSortOpen,
}: SortDropdownProps) => {
  return (
    <div className="relative shrink-0">
      <button 
        onClick={() => setIsSortOpen(!isSortOpen)}
        className={cn(
          "h-[52px] px-5 rounded-[20px] flex items-center gap-3 transition-all duration-300 border-2",
          isSortOpen || sortType !== 'default'
            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
            : "bg-white border-gray-100 text-gray-500 hover:border-primary/30"
        )}
      >
        <SlidersHorizontal className="w-5 h-5" />
        <span className="text-[11px] font-black uppercase tracking-widest hidden lg:inline">
          {sortType === 'default' ? 'Sắp xếp' : 
           sortType === 'name-asc' ? 'A-Z' : 
           sortType === 'name-desc' ? 'Z-A' :
           sortType === 'price-asc' ? 'Giá thấp' : 'Giá cao'}
        </span>
      </button>

      <AnimatePresence>
        {isSortOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsSortOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[70] p-2"
            >
              {[
                { id: 'default', label: 'Mặc định', icon: <Coffee className="w-4 h-4" /> },
                { id: 'name-asc', label: 'Tên: A-Z', icon: <SlidersHorizontal className="w-4 h-4" /> },
                { id: 'name-desc', label: 'Tên: Z-A', icon: <SlidersHorizontal className="w-4 h-4" /> },
                // { id: 'price-asc', label: 'Giá: Thấp - Cao', icon: <Star className="w-4 h-4" /> },
                // { id: 'price-desc', label: 'Giá: Cao - Thấp', icon: <Star className="w-4 h-4" /> },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    handleSortChange(option.id);
                    setIsSortOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left group",
                    sortType === option.id 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "transition-colors",
                    sortType === option.id ? "text-primary" : "text-gray-400 group-hover:text-primary"
                  )}>
                    {option.icon}
                  </span>
                  <span className="text-xs font-bold">{option.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
