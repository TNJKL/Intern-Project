"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface StatsSectionProps {
  stats: {
    tier: "GUEST" | "MEMBER" | "VIP";
    totalSpent: number;
    totalOrders: number;
  } | null;
}

export function StatsSection({ stats }: StatsSectionProps) {
  if (!stats) return null;

  return (
    <div className="sm:col-span-2 space-y-4 border-t border-gray-150 pt-6">
      <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles size={16} className="text-primary" /> Thống kê chi tiêu & Thăng hạng
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Hạng hiện tại</span>
          <span className="text-xs sm:text-sm font-extrabold text-gray-800 mt-2 block">
            {stats.tier === "VIP" ? "👑 VIP" : stats.tier === "MEMBER" ? "🥈 MEMBER" : "🥉 GUEST"}
          </span>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Đơn hàng thành công</span>
          <span className="text-sm sm:text-base font-black text-gray-800 mt-2 block">{stats.totalOrders} Đơn</span>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Tổng chi tiêu tích lũy</span>
          <span className="text-sm sm:text-base font-black text-primary mt-2 block">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.totalSpent)}
          </span>
        </div>
      </div>

      {/* Tính toán Progress thăng hạng */}
      {(() => {
        if (stats.tier === "VIP") {
          return (
            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-yellow-800">
                <span>Tiến trình thăng hạng</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-yellow-200/50 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "100%" }} />
              </div>
              <p className="text-[11px] text-yellow-800 font-semibold flex items-center gap-1">
                🎉 Bạn đã đạt hạng thành viên cao nhất tại Brewtra Coffee! Cảm ơn sự tin yêu của bạn.
              </p>
            </div>
          );
        }

        const isMember = stats.tier === "MEMBER";
        const targetSpent = isMember ? 3000000 : 500000;
        const targetOrders = isMember ? 20 : 5;
        const nextTierName = isMember ? "Khách VIP" : "Khách hàng thân thiết";

        const spentPercent = Math.min(100, (stats.totalSpent / targetSpent) * 100);
        const ordersPercent = Math.min(100, (stats.totalOrders / targetOrders) * 100);
        const progress = Math.max(spentPercent, ordersPercent);

        const remSpent = Math.max(0, targetSpent - stats.totalSpent);
        const remOrders = Math.max(0, targetOrders - stats.totalOrders);

        return (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Tiến trình lên hạng {remSpent > 0 || remOrders > 0 ? nextTierName : "Kế tiếp"}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
              💡 Chỉ cần hoàn thành thêm <strong className="text-gray-800">{remOrders} đơn hàng</strong> hoặc chi tiêu thêm <strong className="text-primary">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(remSpent)}</strong> để nâng cấp lên hạng <strong className="text-gray-800">{remSpent > 0 || remOrders > 0 ? nextTierName : "Kế tiếp"}</strong>!
            </p>
          </div>
        );
      })()}
    </div>
  );
}
