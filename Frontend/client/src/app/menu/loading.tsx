import React from "react";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Ô tìm kiếm và Sắp xếp */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b border-gray-100">
        <div className="w-full md:w-80 h-10 bg-gray-200/60 rounded-md" />
        <div className="w-full md:w-48 h-10 bg-gray-200/60 rounded-md" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Bộ lọc bên trái (chỉ hiện trên LG+) */}
        <div className="w-full lg:w-64 shrink-0 space-y-4 hidden lg:block">
          <div className="h-6 bg-gray-200/80 w-1/2 rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 bg-gray-200/40 rounded-md w-full" />
            ))}
          </div>
        </div>

        {/* Lưới sản phẩm giả lập */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
