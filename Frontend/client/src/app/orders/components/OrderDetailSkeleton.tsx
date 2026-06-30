"use client";

import React from "react";

export const OrderDetailSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-150/80 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center bg-gray-50/50 p-6 rounded-xl border border-gray-100">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-36 bg-gray-300 rounded-full" />
        </div>
        <div className="h-8 w-28 bg-gray-200 rounded-full" />
      </div>

      {/* Timeline Skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-28 bg-gray-200 rounded-full" />
        <div className="relative mt-8 mb-6 px-2">
          <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 rounded-full" />
          <div className="relative z-10 flex justify-between">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-150" />
                <div className="h-3 w-12 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Info Skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-28 bg-gray-200 rounded-full" />
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-b md:border-r border-gray-200 p-4 space-y-2">
              <div className="h-2.5 w-24 bg-gray-200 rounded-full" />
              <div className="h-4 w-36 bg-gray-300 rounded-full" />
            </div>
            <div className="border-b border-gray-200 p-4 space-y-2">
              <div className="h-2.5 w-24 bg-gray-200 rounded-full" />
              <div className="h-4 w-36 bg-gray-300 rounded-full" />
            </div>
            <div className="col-span-1 md:col-span-2 p-4 space-y-2">
              <div className="h-2.5 w-24 bg-gray-200 rounded-full" />
              <div className="h-4 w-72 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t pt-6 flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-gray-200 rounded-full" />
          <div className="h-8 w-44 bg-gray-300 rounded-full" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
};
