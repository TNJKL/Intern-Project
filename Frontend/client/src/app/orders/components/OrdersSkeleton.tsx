"use client";

import React from "react";

export function OrdersSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-12 animate-pulse">
      {/* Header giả lập */}
      <div className="h-8 bg-gray-200/80 w-1/3 rounded mb-6 md:mb-8" />

      {/* Tabs giả lập */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-100 mb-6 md:mb-8 gap-2">
        <div className="h-11 bg-gray-200/40 rounded-xl flex-1" />
        <div className="h-11 bg-gray-200/40 rounded-xl flex-1" />
        <div className="h-11 bg-gray-200/40 rounded-xl flex-1" />
      </div>

      {/* Danh sách đơn hàng giả lập */}
      <div className="space-y-4 sm:space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-150 rounded-md p-4 sm:p-6 space-y-4">
            {/* Top row */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-100/50">
              <div className="h-4 bg-gray-200/80 w-1/4 rounded" />
              <div className="h-4 bg-gray-200/60 w-1/6 rounded" />
            </div>

            {/* Món ăn */}
            <div className="flex items-center gap-4 py-1">
              <div className="w-14 h-14 bg-gray-200/60 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200/80 w-1/2 rounded" />
                <div className="h-3 bg-gray-200/40 w-1/4 rounded" />
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100/50 mt-2">
              <div className="h-3.5 bg-gray-200/40 w-1/5 rounded" />
              <div className="h-6 bg-gray-200/80 w-1/4 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
