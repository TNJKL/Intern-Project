"use client";

import React, { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";

export default function Loading() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav giả lập */}
      <div className="px-8 lg:px-16 pt-6 pb-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300">
          <ArrowLeft className="w-4 h-4" />
          Thực đơn
        </span>
      </div>

      {/* Layout chi tiết giả lập */}
      <div className="px-4 sm:px-8 lg:px-16 py-6 pb-28">
        <div className="bg-background p-4 sm:p-8 flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-16 lg:items-stretch items-start animate-pulse">
          
          {/* Cột trái (Hình ảnh sản phẩm) */}
          <div className="w-full lg:w-[380px] xl:w-[450px] shrink-0 flex flex-col">
            {/* Ảnh lớn */}
            <div className="w-full aspect-square bg-gray-200/60 rounded-md mb-4 shrink-0" />
            {/* Gallery ảnh nhỏ */}
            <div className="flex gap-3 mt-2">
              <div className="w-16 h-16 bg-gray-200/40 rounded-md shrink-0" />
              <div className="w-16 h-16 bg-gray-200/40 rounded-md shrink-0" />
              <div className="w-16 h-16 bg-gray-200/40 rounded-md shrink-0" />
            </div>
          </div>

          {/* Cột phải (Thông tin mua hàng) */}
          <div className="flex-1 flex flex-col pt-2 w-full">
            {/* Tên danh mục */}
            <div className="h-3 bg-gray-200/60 w-1/4 rounded mb-2.5" />
            {/* Tên sản phẩm */}
            <div className="h-8 bg-gray-200/80 w-2/3 rounded mb-4" />
            {/* Giá tiền */}
            <div className="h-6 bg-gray-200/80 w-1/4 rounded mb-6" />

            {/* Thuộc tính Size */}
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-gray-200/60 w-1/6 rounded" />
              <div className="flex gap-2">
                <div className="w-20 h-10 bg-gray-200/40 rounded-md" />
                <div className="w-20 h-10 bg-gray-200/40 rounded-md" />
                <div className="w-20 h-10 bg-gray-200/40 rounded-md" />
              </div>
            </div>

            {/* Thuộc tính Topping */}
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-gray-200/60 w-1/5 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="h-10 bg-gray-200/40 rounded-md" />
                <div className="h-10 bg-gray-200/40 rounded-md" />
                <div className="h-10 bg-gray-200/40 rounded-md" />
                <div className="h-10 bg-gray-200/40 rounded-md" />
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-2 mb-6 border-t border-gray-100 pt-4">
              <div className="h-4 bg-gray-200/60 w-1/6 rounded" />
              <div className="h-3 bg-gray-200/40 w-full rounded" />
              <div className="h-3 bg-gray-200/40 w-5/6 rounded" />
            </div>

            {/* Nút bấm mua hàng */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-6 border-t border-gray-200 w-full mt-auto">
              <div className="w-full sm:w-44 h-12 bg-gray-200/40 rounded-xl" />
              <div className="w-full sm:flex-1 h-12 bg-gray-200/60 rounded-xl" />
            </div>

          </div>

        </div>

        {/* Khối gợi ý sản phẩm dưới chân trang */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="h-6 bg-gray-200/80 w-1/4 rounded mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
