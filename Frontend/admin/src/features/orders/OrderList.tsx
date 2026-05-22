import React, { useState } from 'react';
import { Card, Table, Space, Button, Input, Select, Tag, Tooltip, Tabs, Badge } from 'antd';
import { EyeOutlined, ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useOrders, useUpdateOrderStatus } from './hooks/useOrders';
import { message } from '@/lib/antd';
import { type Order, type OrderDetail, orderService } from '@/services/order.service';
import OrderDetailDrawer from './components/OrderDetailDrawer';

const OrderList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch a larger dataset for perfect client-side filtering and pagination
  const { data: orderResponse, isLoading } = useOrders({ 
    page: 0,
    size: 200,
    keyword: keyword || undefined
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const handleSearch = (value: string) => {
    setKeyword(value);
    setCurrentPage(1);
  };

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

  // Lấy dữ liệu danh sách
  const allOrders = orderResponse?.data || [];

  // Phân loại đơn hàng
  const activeOrders = allOrders.filter(
    (o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
  );
  const historyOrders = allOrders.filter(
    (o: Order) => o.status === 'COMPLETED' || o.status === 'CANCELLED'
  );

  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const columns = [
    { 
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">MÃ ĐƠN</span>, 
      dataIndex: 'orderCode', 
      key: 'orderCode', 
      render: (t: string) => (
        <span className="font-bold">{t}</span>
      )
    },
    { 
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">NGÀY ĐẶT</span>, 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('vi-VN')
    },
    { 
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TỔNG TIỀN</span>, 
      dataIndex: 'totalAmount', 
      key: 'totalAmount', 
      render: (v: number) => <b className="text-gray-800">{v?.toLocaleString() ?? 0}đ</b> 
    },
    { 
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>, 
      dataIndex: 'status', 
      key: 'status',
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
            style={{ 
              width: 145, 
              fontWeight: 'bold',
            }}
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
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết đơn hàng">
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              size="small"
              className="bg-coffee-medium hover:bg-coffee-dark border-none rounded-lg px-3 font-semibold text-xs h-7 flex items-center gap-1 transition-all duration-200"
              onClick={() => {
                setSelectedOrderId(record.id);
                setIsDrawerOpen(true);
              }}
            >
              Chi tiết
            </Button>
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-1">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'active' | 'history');
            setCurrentPage(1);
          }}
          size="large"
          className="border-none mb-0 w-full md:w-auto"
          items={[
            {
              key: 'active',
              label: (
                <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                  <ClockCircleOutlined className="text-sm" />
                  Đang xử lý
                  <Badge 
                    count={activeOrders.length} 
                    overflowCount={99}
                    color="#D4A373"
                    className="ml-1 font-bold"
                  />
                </span>
              ),
            },
            {
              key: 'history',
              label: (
                <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                  <HistoryOutlined className="text-sm" />
                  Lịch sử đơn hàng
                  <Badge 
                    count={historyOrders.length} 
                    overflowCount={999}
                    color="#9CA3AF"
                    className="ml-1 font-bold"
                  />
                </span>
              ),
            },
          ]}
        />
        <div className="w-full md:w-auto pb-3 md:pb-0">
          <Input.Search 
            placeholder="Tìm kiếm mã đơn..." 
            allowClear
            onSearch={handleSearch}
            className="w-full md:w-80 rounded-xl"
            size="large"
          />
        </div>
      </div>
      
      <Card variant="borderless" className="rounded-[32px] shadow-sm border border-gray-100 p-2 overflow-hidden" styles={{ body: { padding: '24px' } }}>
        <Table 
          columns={columns} 
          dataSource={displayOrders} 
          rowKey="id"
          loading={isLoading}
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

      {/* Drawer cho đơn thành viên */}
      <OrderDetailDrawer 
        orderId={selectedOrderId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default OrderList;
