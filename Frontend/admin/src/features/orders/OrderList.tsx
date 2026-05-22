import React, { useState } from 'react';
import { Card, Table, Space, Button, Input, Select } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useOrders, useUpdateOrderStatus } from './hooks/useOrders';
import { message } from '@/lib/antd';
import { type Order } from '@/services/orderService';
import OrderDetailDrawer from './components/OrderDetailDrawer';

const OrderList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: orderResponse, isLoading } = useOrders({ 
    page: currentPage - 1, // API is 0-indexed
    size: pageSize,
    keyword: keyword || undefined
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const handleSearch = (value: string) => {
    setKeyword(value);
    setCurrentPage(1); // Reset to first page on search
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

  const handleViewDetail = (id: string) => {
    setSelectedOrderId(id);
    setIsDrawerOpen(true);
  };

  const columns = [
    { 
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">MÃ ĐƠN</span>, 
      dataIndex: 'orderCode', 
      key: 'orderCode', 
      render: (t: string) => <span className="font-bold">{t}</span> 
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
      render: (v: number) => <b>{v?.toLocaleString() ?? 0}đ</b> 
    },
    { 
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>, 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string, record: Order) => (
        <Select
          value={s}
          onChange={(value) => handleUpdateStatus(record.id, value)}
          loading={updateStatusMutation.isPending}
          disabled={s === 'CANCELLED' || s === 'COMPLETED'}
          style={{ 
            width: 145, 
            fontWeight: 'bold',
            borderRadius: '8px'
          }}
          size="small"
          options={[
            { value: 'PENDING', label: 'ĐÃ NHẬN ĐƠN' },
            { value: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN' },
            { value: 'PREPARING', label: 'ĐANG PHA CHẾ' },
            { value: 'DELIVERING', label: 'ĐANG GIAO' },
            { value: 'COMPLETED', label: 'HOÀN THÀNH' },
            { value: 'CANCELLED', label: 'ĐÃ HỦY' },
          ]}
        />
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THAO TÁC</span>,
      key: 'action',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewDetail(record.id)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Quản lý Đơn hàng</h2>
        <Input.Search 
          placeholder="Tìm kiếm mã đơn..." 
          allowClear
          onSearch={handleSearch}
          className="max-w-xs"
        />
      </div>
      
      <Card variant="borderless" className="shadow-sm">
        <Table 
          columns={columns} 
          dataSource={orderResponse?.data || []} 
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: orderResponse?.totalElements || 0,
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
