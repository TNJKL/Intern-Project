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
      className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-elegant"
    >
      {/* Cấu trúc Style mới: Tăng diện tích tương tác cho thanh cuộn */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Định dạng chung cho vùng chứa scrollbar thanh lịch */
        .scrollbar-elegant::-webkit-scrollbar { 
          height: 8px; /* Tăng từ 4px lên 8px mặc định để dễ nhìn */
          transition: all 0.2s ease-in-out;
        }
        
        /* Khi người dùng tương tác hoặc hover vào vùng danh mục, thanh cuộn rộng ra 12px để cực kỳ dễ kéo */
        .scrollbar-elegant:hover::-webkit-scrollbar {
          height: 11px;
        }

        .scrollbar-elegant::-webkit-scrollbar-track {
          background: #f3f4f6; /* Đổi sang màu xám nhẹ của Tailwind để trông sạch sẽ hơn */
          border-radius: 100px;
        }

        .scrollbar-elegant::-webkit-scrollbar-thumb {
          background: #d37533; 
          border-radius: 100px;
          border: 2px solid transparent; /* Tạo khoảng trống đệm */
          background-clip: padding-box;
          transition: background 0.2s;
        }

        /* Đổi màu đậm hơn khi người dùng đang bấm giữ chuột kéo thanh cuộn */
        .scrollbar-elegant::-webkit-scrollbar-thumb:hover {
          background: #b55d22;
          border: 1px solid transparent;
        }
      `}} />

      {dynamicCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryChange(cat.id)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300 border-2 select-none",
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