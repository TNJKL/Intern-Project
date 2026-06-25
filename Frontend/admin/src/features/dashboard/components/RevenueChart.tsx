import React from 'react';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyRevenue {
  name: string;
  'Doanh thu': number;
}

interface RevenueChartProps {
  monthlyRevenueData: MonthlyRevenue[];
  chartLoading: boolean;
  selectedDate: string;
  formatYAxis: (value: number) => string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  monthlyRevenueData,
  chartLoading,
  selectedDate,
  formatYAxis,
}) => {
  return (
    <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
            Doanh thu các tháng trong năm {dayjs(selectedDate).format('YYYY')}
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            Thống kê doanh thu theo từng tháng của năm {dayjs(selectedDate).format('YYYY')}
          </p>
        </div>
      </div>
      <div className="h-72 w-full flex items-center justify-center" style={{ minHeight: '300px' }}>
        {chartLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#d37533] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 font-medium animate-pulse">Đang tải biểu đồ doanh thu...</p>
          </div>
        ) : monthlyRevenueData.length === 0 ? (
          <div className="text-gray-400 font-medium">
            Không có dữ liệu doanh thu cho năm này
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d37533" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#d37533" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
              />
              <Bar
                dataKey="Doanh thu"
                fill="url(#colorRevenue)"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
