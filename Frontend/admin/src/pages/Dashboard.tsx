import React from 'react';
import { Card, Table, Tag, Button, Avatar } from 'antd';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const dataChart = [
  { name: 'T2', revenue: 4000000 },
  { name: 'T3', revenue: 3000000 },
  { name: 'T4', revenue: 5000000 },
  { name: 'T5', revenue: 4500000 },
  { name: 'T6', revenue: 6000000 },
  { name: 'T7', revenue: 8000000 },
  { name: 'CN', revenue: 7500000 },
];

const topProducts = [
  { id: 1, name: 'Phin Sữa Đá', sales: 124, revenue: 3596000, image: '/images/product-cappuccino-new.jpg' },
  { id: 2, name: 'Trà Sen Vàng', sales: 98, revenue: 4410000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop' },
  { id: 3, name: 'Cold Brew', sales: 85, revenue: 4675000, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop' },
  { id: 4, name: 'Bánh Mì Que', sales: 156, revenue: 2340000, image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=400&fit=crop' },
];

const Dashboard: React.FC = () => {
  const columns = [
    {
      title: 'MÃ ĐƠN',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-bold text-gray-800">{text}</span>,
    },
    {
      title: 'KHÁCH HÀNG',
      dataIndex: 'customer',
      key: 'customer',
      render: (text: string) => <span className="font-medium text-gray-600">{text}</span>,
    },
    {
      title: 'TỔNG TIỀN',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => <span className="font-bold text-[#d37533]">{amount.toLocaleString()}đ</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'bg-blue-50 text-blue-600 border-blue-200';
        if (status === 'Hoàn thành') color = 'bg-green-50 text-green-600 border-green-200';
        if (status === 'Đang giao') color = 'bg-purple-50 text-purple-600 border-purple-200';
        if (status === 'Đã hủy') color = 'bg-red-50 text-red-600 border-red-200';
        return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${color}`}>{status.toUpperCase()}</span>;
      },
    },
    {
      title: 'HÀNH ĐỘNG',
      key: 'action',
      align: 'right' as const,
      render: () => (
        <Button type="text" icon={<Eye className="w-4 h-4 text-gray-500 hover:text-primary transition-colors" />} />
      ),
    },
  ];

  const dataOrders = [
    { key: '1', id: '#ORD-847291', customer: 'Nguyễn Văn A', total: 150000, status: 'Mới' },
    { key: '2', id: '#ORD-847200', customer: 'Trần Thị B', total: 45000, status: 'Đang giao' },
    { key: '3', id: '#ORD-847198', customer: 'Lê Văn C', total: 230000, status: 'Hoàn thành' },
    { key: '4', id: '#ORD-847195', customer: 'Phạm Thị D', total: 85000, status: 'Hoàn thành' },
    { key: '5', id: '#ORD-847190', customer: 'Hoàng Văn E', total: 320000, status: 'Đã hủy' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Tổng Quan</h2>
          <p className="text-gray-500 font-medium mt-1">Cập nhật hoạt động kinh doanh hôm nay</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ngày hiện tại</p>
          <p className="text-lg font-black text-gray-800">24/04/2026</p>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#d37533]" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> 12%
            </span>
          </div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Doanh thu ngày</p>
          <h3 className="text-3xl font-black text-gray-800">12.5M <span className="text-sm text-gray-400 font-bold">VNĐ</span></h3>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> 8%
            </span>
          </div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Đơn hàng mới</p>
          <h3 className="text-3xl font-black text-gray-800">142</h3>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
              <TrendingDown className="w-3 h-3" /> 3%
            </span>
          </div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Khách hàng mới</p>
          <h3 className="text-3xl font-black text-gray-800">38</h3>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Cần xử lý
            </span>
          </div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Chờ xác nhận</p>
          <h3 className="text-3xl font-black text-gray-800">12</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Biểu đồ doanh thu</h3>
              <p className="text-sm text-gray-500 font-medium">7 ngày gần nhất</p>
            </div>
          </div>
          <div className="h-72 w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d37533" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d37533" stopOpacity={0.2}/>
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
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#colorRevenue)" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Sản phẩm bán chạy</h3>
          </div>
          <div className="space-y-6">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="relative font-black text-2xl text-gray-200 w-6">
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{product.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">{product.sales} đã bán</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#d37533] text-sm">{(product.revenue / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            ))}
          </div>
          <Button type="dashed" block className="mt-8 rounded-xl font-bold text-gray-500 border-gray-200">
            Xem tất cả
          </Button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Đơn hàng gần đây</h3>
            <p className="text-sm text-gray-500 font-medium">Danh sách các đơn hàng mới nhất cần xử lý</p>
          </div>
          <Button type="primary" className="bg-gray-800 hover:bg-black rounded-xl font-bold h-10 px-6">
            Xem tất cả
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table 
            columns={columns} 
            dataSource={dataOrders} 
            pagination={false} 
            className="custom-admin-table"
            rowClassName="hover:bg-gray-50 transition-colors cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
