import React, { useState, useMemo, useEffect } from 'react';
import { Card, Table, Space, Button, Input, Select, Tag, Tooltip, Tabs, Badge, DatePicker } from 'antd';
import { EyeOutlined, ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useOrders, useUpdateOrderStatus } from './hooks/useOrders';
import { message } from '@/lib/antd';
import { type Order } from '@/services/order.service';
import OrderDetailDrawer from './components/OrderDetailDrawer';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

// Kích hoạt plugin hỗ trợ so sánh ngày của dayjs
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const OrderList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isMobile, setIsMobile] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lấy dữ liệu lớn từ Server để thực hiện Client-side filtering hoàn hảo
  const { data: orderResponse, isLoading } = useOrders({
    page: 0,
    size: 200,
    sort: 'createdAt,desc'
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          message.success('Cập nhật trạng thái đơn hàng thành công');
        },
        onError: () => {
          message.error('Cập nhật trạng thái đơn hàng thất bại');
        }
      }
    );
  };

  // Sử dụng useMemo để tối ưu hiệu năng lọc dữ liệu phía Client
  const filteredOrders = useMemo(() => {
    const allOrders = orderResponse?.data || [];

    return allOrders.filter((order: Order) => {
      // 1. Lọc theo Từ khóa (Mã đơn hàng)
      const matchesKeyword = keyword
        ? order.orderCode?.toLowerCase().includes(keyword.toLowerCase().trim())
        : true;

      // 2. Lọc theo Khoảng ngày (Bao gồm cả ngày bắt đầu và kết thúc)
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const orderDate = dayjs(order.createdAt);
        const startDate = dateRange[0].startOf('day');
        const endDate = dateRange[1].endOf('day');
        matchesDate = orderDate.isBetween(startDate, endDate, null, '[]');
      }

      return matchesKeyword && matchesDate;
    });
  }, [orderResponse?.data, keyword, dateRange]);

  // Phân loại đơn hàng sau khi đã qua bộ lọc Tìm kiếm & Ngày
  const activeOrders = filteredOrders.filter(
    (o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
  );
  const historyOrders = filteredOrders.filter(
    (o: Order) => o.status === 'COMPLETED' || o.status === 'CANCELLED'
  );

  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">MÃ ĐƠN</span>,
      dataIndex: 'orderCode',
      key: 'orderCode',
      width: 180,
      render: (t: string) => <span className="font-bold">{t}</span>
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">NGÀY ĐẶT</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TỔNG TIỀN</span>,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (v: number) => <b className="text-gray-800">{v?.toLocaleString() ?? 0}đ</b>
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (s: string, record: Order) => {
        if (s === 'COMPLETED') {
          return (
            <Tag className="font-extrabold rounded-lg px-3 py-1 text-xs border-none bg-emerald-50 text-emerald-700">
              HOÀN THÀNH
            </Tag>
          );
        }
        if (s === 'CANCELLED') {
          return (
            <Tag className="font-extrabold rounded-lg px-3 py-1 text-xs border-none bg-rose-50 text-rose-700">
              ĐÃ HỦY
            </Tag>
          );
        }
        return (
          <Select
            value={s}
            onChange={(value) => handleUpdateStatus(record.id, value)}
            loading={updateStatusMutation.isPending}
            style={{ width: 145, fontWeight: 'bold' }}
            className="font-bold text-xs"
            size="small"
            popupClassName="rounded-xl font-semibold"
            options={[
              { value: 'PENDING', label: 'ĐÃ NHẬN ĐƠN' },
              { value: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN' },
              { value: 'PREPARING', label: 'ĐANG PHA CHẾ' },
              { value: 'DELIVERING', label: 'ĐANG GIAO' },
              { value: 'COMPLETED', label: 'HOÀN THÀNH' },
              { value: 'CANCELLED', label: 'ĐÃ HỦY' },
            ]}
          />
        );
      }
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THAO TÁC</span>,
      key: 'action',
      width: 100,
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết đơn hàng">
            <Button
              type="text"
              icon={<EyeOutlined className="text-blue-500 text-lg" />}
              onClick={() => {
                setSelectedOrderId(record.id);
                setIsDrawerOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Quản lý Đơn hàng</h2>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-1">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'active' | 'history');
            setCurrentPage(1);
          }}
          size="large"
          className="border-none mb-0 w-full lg:w-auto"
          items={[
            {
              key: 'active',
              label: (
                <span className="flex items-center gap-1.5 sm:gap-2 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
                  <ClockCircleOutlined className="text-xs sm:text-sm" />
                  Đang xử lý
                  <Badge
                    count={activeOrders.length}
                    overflowCount={99}
                    color="#D4A373"
                    className="ml-1 font-bold scale-90"
                  />
                </span>
              ),
            },
            {
              key: 'history',
              label: (
                <span className="flex items-center gap-1.5 sm:gap-2 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
                  <HistoryOutlined className="text-xs sm:text-sm" />
                  Lịch sử<span className="hidden xs:inline"> đơn hàng</span>
                  <Badge
                    count={historyOrders.length}
                    overflowCount={999}
                    color="#9CA3AF"
                    className="ml-1 font-bold scale-90"
                  />
                </span>
              ),
            },
          ]}
        />

        {/* Thanh công cụ tìm kiếm và lọc ngày */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto pb-3 lg:pb-0">
          <RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            format="DD/MM/YYYY"
            className="w-full sm:w-64 rounded-xl"
            size="large"
            onChange={(values) => {
              setDateRange(values);
              setCurrentPage(1);
            }}
          />
          <Input.Search
            placeholder="Tìm kiếm mã đơn..."
            allowClear
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(1);
            }}
            onSearch={(value) => {
              setKeyword(value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 rounded-xl"
            size="large"
          />
        </div>
      </div>

      <Card variant="borderless" className="rounded-[20px] sm:rounded-[32px] shadow-sm border border-gray-100 p-1 sm:p-2 overflow-hidden" styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
        <Table
          columns={columns}
          dataSource={displayOrders}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: displayOrders.length,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size) setPageSize(size);
            }
          }}
        />
      </Card>

      <OrderDetailDrawer
        orderId={selectedOrderId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default OrderList;