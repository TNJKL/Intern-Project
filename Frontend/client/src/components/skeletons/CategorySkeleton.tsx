"use client";

import React from "react";

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center p-6 bg-[#f5ede2]/50 border border-[#855823]/5 rounded-md shadow-xs animate-pulse">
      {/* Khung chứa ảnh giả lập */}
      <div className="w-20 h-20 bg-gray-200/60 border border-[#855823]/5 rounded-md mb-4 shrink-0" />
      {/* Nhãn tên giả lập */}
      <div className="h-4 bg-gray-200/80 w-2/3 rounded" />
    </div>
  );
}
