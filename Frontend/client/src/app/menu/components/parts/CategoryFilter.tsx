"use client";

import React from "react";
import { Coffee, CupSoda, Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@/types/category";

interface CategoryFilterProps {
  categories: Category[];
  selectedMenuCategory: string;
  handleCategoryChange: (id: string) => void;
}

export const CategoryFilter = ({
  categories,
  selectedMenuCategory,
  handleCategoryChange,
}: CategoryFilterProps) => {
  const dynamicCategories = [
    { id: "all", label: "Tất cả", icon: <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
    ...categories.map(cat => ({
      id: cat.id,
      label: cat.name,
      icon: cat.name.toLowerCase().includes('trà') ? <CupSoda className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
        cat.name.toLowerCase().includes('bánh') ? <Cake className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
          <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    }))
  ];

  return (
    <div
      className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-elegant"
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-elegant::-webkit-scrollbar { 
          height: 4px; 
          display: block;
        }
        .scrollbar-elegant::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .scrollbar-elegant::-webkit-scrollbar-thumb {
          background: #d37533; 
          border-radius: 10px;
        }
      `}} />
      {dynamicCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryChange(cat.id)}
          className={cn(
            /* TỐI ƯU CHỮ & KHÔNG GIAN:
               - Đổi text-[10px] thành text-xs (trên mobile) và text-sm (từ sm/tablet trở lên)
               - Thay đổi padding từ py-2 thành py-2 sm:py-2.5 giúp nút cân đối hơn
               - Hạ độ rộng khoảng cách chữ từ tracking-widest xuống tracking-wide chống tràn chữ
            */
            "flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300 border-2",
            selectedMenuCategory === cat.id
              ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-102"
              : "bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:text-primary"
          )}
        >
          {cat.icon}
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
};