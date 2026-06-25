import React, { useState, useEffect, useRef } from 'react';
import { Button, DatePicker } from 'antd';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import dayjs from 'dayjs';
import { apiClient } from '../../lib/api';

// Subcomponents
import { StatsCards } from './components/StatsCards';
import { RevenueChart } from './components/RevenueChart';
import { TopProducts } from './components/TopProducts';
import { InventoryAlertsTable } from './components/InventoryAlertsTable';

export interface IngredientAlert {
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
  level: 'CRITICAL' | 'WARNING';
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
}

export interface DashboardStats {
  revenue: {
    totalRevenue: number;
    todayRevenue: number;
    thisMonthRevenue: number;
    refundedAmount: number;
    refundCount: number;
    todayRefundedAmount: number;
    todayRefundCount: number;
    thisMonthRefundedAmount: number;
    thisMonthRefundCount: number;
  };
  orders: {
    totalOrders: number;
    todayOrders: number;
    statusCounts: Record<string, number>;
  };
  inventory: {
    lowStockCount: number;
    criticalStockCount: number;
    alertIngredients: IngredientAlert[];
  };
  topProducts: TopProduct[];
  cachedAt: string;
}

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'day' | 'month'>('day');

  const getTodayStr = () => {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(today); // Returns YYYY-MM-DD
  };

  const todayStr = getTodayStr();
  const currentMonthStr = todayStr.substring(0, 7); // Returns YYYY-MM
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // --- Monthly Revenue States ---
  interface MonthlyRevenue {
    name: string;
    'Doanh thu': number;
  }
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenue[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const prevYearRef = useRef<number | null>(null);

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`;
    }
    return value.toString();
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<{ data: DashboardStats }>(`/admin/dashboard/stats?date=${selectedDate}`);
        if (response.data && response.data.data) {
          const data = response.data.data;
          setStats(data);

          // Update chart monthly data dynamically when date changes in month mode
          const statsYear = dayjs(selectedDate).year();
          const statsMonth = dayjs(selectedDate).month() + 1;
          if (statsYear === prevYearRef.current && filterMode === 'month') {
            setMonthlyRevenueData((prevData) => {
              if (prevData.length === 0) return prevData;
              const monthName = `T${statsMonth}`;
              return prevData.map((item) =>
                item.name === monthName
                  ? { ...item, 'Doanh thu': data.revenue.todayRevenue }
                  : item
              );
            });
          }
        } else {
          throw new Error('Dữ liệu không đúng định dạng');
        }
      } catch (err: unknown) {
        console.error('Error fetching dashboard stats:', err);
        let errorMessage = 'Không thể tải dữ liệu thống kê';
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedDate, filterMode]);

  useEffect(() => {
    const year = dayjs(selectedDate).year();
    if (year === prevYearRef.current && monthlyRevenueData.length > 0) {
      return;
    }

    const fetchMonthlyRevenue = async () => {
      try {
        setChartLoading(true);
        const promises = Array.from({ length: 12 }, (_, i) => {
          const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`;
          return apiClient.get<{ data: DashboardStats }>(`/admin/dashboard/stats?date=${monthStr}`)
            .then((res) => ({
              month: i + 1,
              revenue: res.data?.data?.revenue?.todayRevenue ?? 0,
            }))
            .catch((err) => {
              console.error(`Error fetching stats for ${monthStr}:`, err);
              return { month: i + 1, revenue: 0 };
            });
        });

        const results = await Promise.all(promises);
        results.sort((a, b) => a.month - b.month);

        const chartData = results.map((item) => ({
          name: `T${item.month}`,
          'Doanh thu': item.revenue,
        }));

        setMonthlyRevenueData(chartData);
        prevYearRef.current = year;
      } catch (err) {
        console.error('Error fetching annual monthly revenue:', err);
      } finally {
        setChartLoading(false);
      }
    };

    fetchMonthlyRevenue();
  }, [selectedDate, monthlyRevenueData.length]);

  const handlePrevDay = () => {
    if (filterMode === 'month') {
      const prev = dayjs(selectedDate).subtract(1, 'month').format('YYYY-MM');
      setSelectedDate(prev);
    } else {
      const prev = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
      setSelectedDate(prev);
    }
  };

  const handleNextDay = () => {
    if (filterMode === 'month') {
      const next = dayjs(selectedDate).add(1, 'month').format('YYYY-MM');
      setSelectedDate(next);
    } else {
      const next = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
      setSelectedDate(next);
    }
  };

  const handleToday = () => {
    if (filterMode === 'month') {
      setSelectedDate(currentMonthStr);
    } else {
      setSelectedDate(todayStr);
    }
  };

  const handleModeChange = (mode: 'day' | 'month') => {
    setFilterMode(mode);
    if (mode === 'month') {
      setSelectedDate(currentMonthStr);
    } else {
      setSelectedDate(todayStr);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-[#d37533] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu thống kê hệ thống...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[24px] p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <Button
          type="primary"
          danger
          className="rounded-xl font-bold h-10 px-6"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const cacheTime = stats?.cachedAt
    ? new Date(stats.cachedAt).toLocaleTimeString('vi-VN')
    : '';

  const displayTopProducts = stats?.topProducts || [];
  const alertData = stats?.inventory?.alertIngredients || [];

  return (
    <div className="space-y-6">
      {/* Date Filter Panel */}
      <div className="mb-8 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-1.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-xl lg:text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2 flex-wrap">
            <span>Tổng Quan</span>
            <span className="text-[#d37533] text-base lg:text-lg font-bold bg-orange-50 px-2.5 py-0.5 rounded-xl">
              {filterMode === 'month'
                ? dayjs(selectedDate).format('MM/YYYY')
                : dayjs(selectedDate).format('DD/MM/YYYY')}
            </span>
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
            {/* Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
              <Button
                className={`rounded-lg font-bold border-none h-8 px-4 text-xs ${filterMode === 'day' ? 'bg-white shadow-sm text-gray-800' : 'bg-transparent text-gray-400'}`}
                onClick={() => handleModeChange('day')}
              >
                Ngày
              </Button>
              <Button
                className={`rounded-lg font-bold border-none h-8 px-4 text-xs ${filterMode === 'month' ? 'bg-white shadow-sm text-gray-800' : 'bg-transparent text-gray-400'}`}
                onClick={() => handleModeChange('month')}
              >
                Tháng
              </Button>
            </div>

            <Button
              icon={<ChevronLeft className="w-4 h-4" />}
              className="rounded-xl font-bold flex items-center justify-center border-gray-200 hover:border-[#d37533] hover:text-[#d37533] h-10 w-10 shrink-0"
              onClick={handlePrevDay}
            />
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={(date) => {
                if (date) {
                  const formatted = filterMode === 'month'
                    ? date.format('YYYY-MM')
                    : date.format('YYYY-MM-DD');
                  setSelectedDate(formatted);
                }
              }}
              allowClear={false}
              picker={filterMode === 'month' ? 'month' : 'date'}
              format={filterMode === 'month' ? 'MM/YYYY' : 'DD/MM/YYYY'}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
              className="rounded-xl h-10 border-gray-200 font-medium w-40 hover:border-[#d37533] focus:border-[#d37533]"
            />
            <Button
              icon={<ChevronRight className="w-4 h-4" />}
              className="rounded-xl font-bold flex items-center justify-center border-gray-200 hover:border-[#d37533] hover:text-[#d37533] h-10 w-10 shrink-0"
              onClick={handleNextDay}
              disabled={selectedDate === (filterMode === 'month' ? currentMonthStr : todayStr)}
            />
            <Button
              type="primary"
              className="rounded-xl font-bold bg-[#d37533] hover:bg-[#b85f26] border-none h-10 px-4"
              onClick={handleToday}
              disabled={selectedDate === (filterMode === 'month' ? currentMonthStr : todayStr)}
            >
              Hôm nay
            </Button>
          </div>
        </div>
        <p className="text-gray-500 text-xs lg:text-sm font-medium mt-1">
          Xem báo cáo kinh doanh của {filterMode === 'month' ? 'tháng' : 'ngày'} được chọn {cacheTime && `(Cache lúc: ${cacheTime})`}
        </p>
      </div>

      {/* Statistics Cards */}
      <StatsCards
        stats={stats}
        filterMode={filterMode}
        selectedDate={selectedDate}
        currentMonthStr={currentMonthStr}
        todayStr={todayStr}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6">
        {/* Monthly Revenue Chart */}
        <RevenueChart
          monthlyRevenueData={monthlyRevenueData}
          chartLoading={chartLoading}
          selectedDate={selectedDate}
          formatYAxis={formatYAxis}
        />

        {/* Top Products */}
        <TopProducts displayTopProducts={displayTopProducts} />
      </div>

      {/* Inventory Warnings Table */}
      <InventoryAlertsTable
        alertIngredients={alertData}
        criticalStockCount={stats?.inventory?.criticalStockCount}
        lowStockCount={stats?.inventory?.lowStockCount}
      />
    </div>
  );
};

export default DashboardOverview;