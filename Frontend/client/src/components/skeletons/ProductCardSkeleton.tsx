"use client";

import React from "react";

export function ProductCardSkeleton() {
  return (
    <div className="bg-[#f5ede2]/50 rounded-md p-3 shadow-xs border border-[#855823]/5 flex flex-col h-full animate-pulse">
      {/* Khung chứa ảnh giả lập */}
      <div className="relative aspect-square rounded-md mb-3 bg-gray-200/60 overflow-hidden flex items-center justify-center shrink-0" />

      {/* Thông tin giả lập */}
      <div className="flex-1 flex flex-col">
        {/* Danh mục */}
        <div className="h-3 bg-gray-200/60 w-1/3 rounded mb-2.5" />
        {/* Tên sản phẩm */}
        <div className="h-4 bg-gray-200/80 w-3/4 rounded mb-2.5" />
        {/* Mô tả */}
        <div className="space-y-1.5 mb-4 hidden md:block">
          <div className="h-3 bg-gray-200/40 w-full rounded" />
          <div className="h-3 bg-gray-200/40 w-5/6 rounded" />
        </div>

        {/* Chân thẻ */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-150/30">
          {/* Giá tiền */}
          <div className="h-5 bg-gray-200/80 w-1/3 rounded" />
          {/* Nút thêm */}
          <div className="w-10 h-10 rounded-md bg-gray-200/60" />
        </div>
      </div>
    </div>
  );
}
