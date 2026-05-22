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
    { id: "all", label: "Tất cả", icon: <Coffee className="w-4 h-4" /> },
    ...categories.map(cat => ({
      id: cat.id,
      label: cat.name,
      icon: cat.name.toLowerCase().includes('trà') ? <CupSoda className="w-4 h-4" /> : 
            cat.name.toLowerCase().includes('bánh') ? <Cake className="w-4 h-4" /> : 
            <Coffee className="w-4 h-4" />
    }))
  ];

  return (
    <div 
      className="flex items-center gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0"
      style={{ msOverflowStyle: 'auto', scrollbarWidth: 'thin' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .overflow-x-auto::-webkit-scrollbar { 
          height: 4px; 
          display: block;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #d37533; 
          border-radius: 10px;
        }
      `}} />
      {dynamicCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryChange(cat.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border-2",
            selectedMenuCategory === cat.id
              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
              : "bg-white border-gray-100 text-gray-400 hover:border-primary/30 hover:text-primary"
          )}
        >
          {cat.icon}
          {cat.label}
        </button>
      ))}
    </div>
  );
};
