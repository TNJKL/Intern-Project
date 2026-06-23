import React, { useState, useEffect } from 'react';
import { Table, Button, DatePicker } from 'antd';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { apiClient } from '../../lib/api';

interface IngredientAlert {
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
  level: 'CRITICAL' | 'WARNING';
}

interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
}

interface DashboardStats {
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

const statusLabelMap: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusColorMap: Record<string, string> = {
  PENDING: '#eab308',
  CONFIRMED: '#3b82f6',
  PREPARING: '#f97316',
  DELIVERING: '#a855f7',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
};

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<{ data: DashboardStats }>(`/admin/dashboard/stats?date=${selectedDate}`);
        if (response.data && response.data.data) {
          setStats(response.data.data);
        } else {
          throw new Error('Dữ liệu không đúng định dạng');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedDate]);

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

  const alertColumns = [
    {
      title: 'TÊN NGUYÊN LIỆU',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-bold text-gray-800">{text}</span>,
    },
    {
      title: 'MÃ SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (text: string) => <span className="font-mono text-xs text-gray-500">{text}</span>,
    },
    {
      title: 'TỒN HIỆN TẠI',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number, record: IngredientAlert) => (
        <span className="font-bold text-gray-700">
          {stock} {record.unit}
        </span>
      ),
    },
    {
      title: 'NGƯỠNG BÁO ĐỘNG',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      render: (threshold: number, record: IngredientAlert) => (
        <span className="text-gray-500">
          {threshold} {record.unit}
        </span>
      ),
    },
    {
      title: 'MỨC ĐỘ',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        let classes = 'bg-yellow-50 text-yellow-600 border-yellow-200';
        let text = 'CẢNH BÁO';
        if (level === 'CRITICAL') {
          classes = 'bg-red-50 text-red-600 border-red-200 animate-pulse';
          text = 'NGUY CẤP';
        }
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${classes}`}>
            {text}
          </span>
        );
      },
    },
  ];

  const formattedDate = stats?.cachedAt 
    ? new Date(stats.cachedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('vi-VN');

  const cacheTime = stats?.cachedAt
    ? new Date(stats.cachedAt).toLocaleTimeString('vi-VN')
    : '';

  // Transform order status counts to chart data
  const dataChart = stats?.orders?.statusCounts
    ? Object.entries(stats.orders.statusCounts).map(([status, count]) => ({
        name: statusLabelMap[status] || status,
        'Số lượng': count,
        color: statusColorMap[status] || '#d37533',
      }))
    : [];

  const displayTopProducts = stats?.topProducts || [];
  const alertData = stats?.inventory?.alertIngredients || [];

  return (
    <div className="space-y-6">
      {/* Date Filter Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2 flex-wrap">
            <span>Tổng Quan</span>
            <span className="text-[#d37533] text-2xl font-bold bg-orange-50 px-3 py-1 rounded-xl">
              {filterMode === 'month' 
                ? dayjs(selectedDate).format('MM/YYYY') 
                : dayjs(selectedDate).format('DD/MM/YYYY')}
            </span>
          </h2>
          <p className="text-gray-500 font-medium mt-1">
            Xem báo cáo kinh doanh của {filterMode === 'month' ? 'tháng' : 'ngày'} được chọn {cacheTime && `(Cache lúc: ${cacheTime})`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">
            {filterMode === 'month' ? 'Doanh thu trong tháng' : 'Doanh thu ngày'}
          </p>
          <h3 className="text-2xl font-black text-gray-800">
            {(stats?.revenue?.todayRevenue ?? 0).toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-bold">VNĐ</span>
          </h3>
          {stats?.revenue?.todayRefundedAmount && stats.revenue.todayRefundedAmount > 0 ? (
            <p className="text-[10px] font-bold text-orange-500 mt-2 bg-orange-50 px-2 py-0.5 rounded-md inline-block">
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
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">
            {filterMode === 'month' ? 'Đơn hàng trong tháng' : 'Đơn hàng ngày'}
          </p>
          <h3 className="text-2xl font-black text-gray-800">
            {stats?.orders?.todayOrders ?? 0} <span className="text-xs text-gray-400 font-bold">Đơn</span>
          </h3>
        </div>

        {/* Card 3: Nguyên liệu báo động */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            {(stats?.inventory?.criticalStockCount ?? 0) > 0 ? (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full animate-pulse">
                Nguy cấp
              </span>
            ) : (
              <span className="text-xs font-bold text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">
                Cảnh báo
              </span>
            )}
          </div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Nguyên liệu cảnh báo</p>
          <h3 className="text-2xl font-black text-gray-800">
            {(stats?.inventory?.lowStockCount ?? 0) + (stats?.inventory?.criticalStockCount ?? 0)} <span className="text-xs text-gray-400 font-bold">Mặt hàng</span>
          </h3>
        </div>

        {/* Card 4: Thống kê bổ sung (Tháng hoặc AOV) */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          {filterMode === 'month' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-full">
                  Trung bình
                </span>
              </div>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Giá trị TB đơn (AOV)</p>
              <h3 className="text-2xl font-black text-gray-800">
                {(stats?.orders?.todayOrders && stats.orders.todayOrders > 0
                  ? Math.round((stats?.revenue?.todayRevenue ?? 0) / stats.orders.todayOrders)
                  : 0
                ).toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-bold">VNĐ</span>
              </h3>
              <p className="text-[10px] font-bold text-purple-600 mt-2 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                Doanh thu tháng / Tổng đơn hàng
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
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Doanh thu tháng</p>
              <h3 className="text-2xl font-black text-gray-800">
                {(stats?.revenue?.thisMonthRevenue ?? 0).toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-bold">VNĐ</span>
              </h3>
              {stats?.revenue?.thisMonthRefundedAmount && stats.revenue.thisMonthRefundedAmount > 0 ? (
                <p className="text-[10px] font-bold text-purple-600 mt-2 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                  Đã hoàn: {stats.revenue.thisMonthRefundedAmount.toLocaleString('vi-VN')} VNĐ ({stats.revenue.thisMonthRefundCount} đơn)
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Chart */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                Trạng thái đơn hàng {filterMode === 'month' ? 'trong tháng' : 'trong ngày'}
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Thống kê số lượng đơn hàng theo trạng thái {filterMode === 'month' ? 'của tháng được chọn' : 'của ngày được chọn'}
              </p>
            </div>
          </div>
          <div className="h-72 w-full" style={{ minHeight: '300px' }}>
            {dataChart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 font-medium">
                {filterMode === 'month' ? 'Không có dữ liệu đơn hàng cho tháng này' : 'Không có dữ liệu đơn hàng cho ngày này'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} đơn hàng`, 'Số lượng']}
                  />
                  <Bar
                    dataKey="Số lượng"
                    fill="#d37533"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Sản phẩm bán chạy</h3>
          </div>
          <div className="space-y-6">
            {displayTopProducts.length === 0 ? (
              <div className="text-gray-400 text-center font-medium py-8">
                Không có dữ liệu sản phẩm bán chạy
              </div>
            ) : (
              displayTopProducts.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center gap-4">
                  <div className="relative font-black text-2xl text-gray-200 w-6">
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#d37533] flex items-center justify-center shrink-0 font-bold">
                    {product.productName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{product.productName}</h4>
                    <p className="text-xs text-gray-500 font-medium">{product.quantitySold} đã bán</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inventory Warnings Table */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Cảnh báo tồn kho nguyên liệu</h3>
            <p className="text-sm text-gray-500 font-medium">Danh sách các nguyên liệu dưới ngưỡng an toàn cần nhập thêm</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table
            columns={alertColumns}
            dataSource={alertData.map((item, idx) => ({ ...item, key: item.sku || idx.toString() }))}
            pagination={{ pageSize: 5 }}
            className="custom-admin-table"
            rowClassName="hover:bg-gray-50 transition-colors cursor-pointer"
            locale={{ emptyText: 'Tất cả nguyên liệu đều ở mức an toàn!' }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
