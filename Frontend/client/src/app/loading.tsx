import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-amber-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-800 animate-pulse">
            Brewtra Coffee
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Đang tải dữ liệu...
          </span>
        </div>
      </div>
    </div>
  );
}
