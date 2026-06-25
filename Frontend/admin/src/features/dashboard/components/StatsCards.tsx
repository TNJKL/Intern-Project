import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../DashboardOverview';

interface StatsCardsProps {
  stats: DashboardStats | null;
  filterMode: 'day' | 'month';
  selectedDate: string;
  currentMonthStr: string;
  todayStr: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  filterMode,
  selectedDate,
  currentMonthStr,
  todayStr,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
      {/* Card 1: Doanh thu */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#d37533]" />
          </div>
          <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
            {filterMode === 'month'
              ? (selectedDate === currentMonthStr ? 'Tháng này' : 'Đã chọn')
              : (selectedDate === todayStr ? 'Hôm nay' : 'Đã chọn')}
          </span>
        </div>
        <p className="text-gray-500 font-bold text-[11px] xl:text-xs uppercase tracking-normal whitespace-nowrap mb-1">
          {filterMode === 'month' ? 'Doanh thu trong tháng' : 'Doanh thu ngày'}
        </p>
        <h3 className="text-2xl font-black text-gray-800">
          {(stats?.revenue?.todayRevenue ?? 0).toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-bold">VNĐ</span>
        </h3>
        {stats?.revenue?.todayRefundedAmount && stats.revenue.todayRefundedAmount > 0 ? (
          <p className="text-[10px] font-bold text-orange-500 mt-2 bg-orange-50 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">
            {filterMode === 'month'
              ? `Tháng đã hoàn: ${stats.revenue.todayRefundedAmount.toLocaleString('vi-VN')} VNĐ (${stats.revenue.todayRefundCount} đơn)`
              : `Đã hoàn: ${stats.revenue.todayRefundedAmount.toLocaleString('vi-VN')} VNĐ (${stats.revenue.todayRefundCount} đơn)`}
          </p>
        ) : null}
      </div>

      {/* Card 2: Đơn hàng */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
            {filterMode === 'month'
              ? (selectedDate === currentMonthStr ? 'Tháng này' : 'Đã chọn')
              : (selectedDate === todayStr ? 'Đơn mới' : 'Đã chọn')}
          </span>
        </div>
        <p className="text-gray-500 font-bold text-[11px] xl:text-xs uppercase tracking-normal whitespace-nowrap mb-1">
          {filterMode === 'month' ? 'Đơn hàng trong tháng' : 'Đơn hàng ngày'}
        </p>
        <h3 className="text-2xl font-black text-gray-800">
          {stats?.orders?.todayOrders ?? 0} <span className="text-xs text-gray-400 font-bold">Đơn</span>
        </h3>
      </div>

      {/* Card 3: Giá trị trung bình đơn (AOV) */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            {filterMode === 'month' ? 'AOV Tháng' : 'AOV Ngày'}
          </span>
        </div>
        <p className="text-gray-500 font-bold text-[11px] xl:text-xs uppercase tracking-normal whitespace-nowrap mb-1">Giá trị trung bình đơn (AOV)</p>
        <h3 className="text-2xl font-black text-gray-800">
          {(stats?.orders?.todayOrders && stats.orders.todayOrders > 0
            ? Math.round((stats?.revenue?.todayRevenue ?? 0) / stats.orders.todayOrders)
            : 0
          ).toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-bold">VNĐ</span>
        </h3>
      </div>

      {/* Card 4: Thống kê lũy kế / tháng */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {filterMode === 'month' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
                Lũy kế
              </span>
            </div>
            <p className="text-gray-500 font-bold text-[11px] xl:text-xs uppercase tracking-normal whitespace-nowrap mb-1">Tổng doanh thu tích lũy</p>
            <h3 className="text-2xl font-black text-gray-800">
              {(stats?.revenue?.totalRevenue ?? 0).toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-bold">VNĐ</span>
            </h3>
            <p className="text-[10px] font-bold text-purple-600 mt-2 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
              Tổng doanh thu từ trước đến nay
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-full">
                {selectedDate === todayStr ? 'Tháng này' : `Tháng ${new Date(selectedDate).getMonth() + 1}`}
              </span>
            </div>
            <p className="text-gray-500 font-bold text-[11px] xl:text-xs uppercase tracking-normal whitespace-nowrap mb-1">Doanh thu tháng</p>
            <h3 className="text-2xl font-black text-gray-800">
              {(stats?.revenue?.thisMonthRevenue ?? 0).toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-bold">VNĐ</span>
            </h3>
            {stats?.revenue?.thisMonthRefundedAmount && stats.revenue.thisMonthRefundedAmount > 0 ? (
              <p className="text-[10px] font-bold text-purple-600 mt-2 bg-purple-50 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">
                Đã hoàn: {stats.revenue.thisMonthRefundedAmount.toLocaleString('vi-VN')} VNĐ ({stats.revenue.thisMonthRefundCount} đơn)
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
