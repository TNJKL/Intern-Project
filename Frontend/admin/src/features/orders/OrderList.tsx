import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Input, Popconfirm } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useOrders, useUpdateOrderStatus } from './hooks/useOrders';
import { message } from '@/lib/antd';
import { type Order } from '@/services/orderService';
import OrderDetailDrawer from './components/OrderDetailDrawer';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'orange';
    case 'CONFIRMED': return 'cyan';
    case 'PREPARING': return 'geekblue';
    case 'READY': return 'purple';
    case 'DELIVERING': return 'blue';
    case 'COMPLETED': return 'green';
    case 'CANCELLED': return 'red';
    default: return 'default';
  }
};

const getStatusText = (status?: string) => {
  if (!status) return 'Không xác định';
  switch (status.toUpperCase()) {
    case 'PENDING': return 'Chờ xử lý';
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'PREPARING': return 'Đang pha chế';
    case 'READY': return 'Chờ giao';
    case 'DELIVERING': return 'Đang giao';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
    default: return status;
  }
};

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
      render: (s: string) => <Tag color={getStatusColor(s)}>{getStatusText(s)?.toUpperCase()}</Tag>
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
          {record.status === 'PENDING' && (
            <>
              <Button 
                icon={<CheckCircleOutlined />} 
                size="small" 
                className="text-green-500 border-green-500"
                loading={updateStatusMutation.isPending}
                onClick={() => handleUpdateStatus(record.id, 'CONFIRMED')}
              >
                Duyệt
              </Button>
              <Popconfirm
                title="Hủy đơn hàng"
                description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
                onConfirm={() => handleUpdateStatus(record.id, 'CANCELLED')}
                okText="Đồng ý"
                cancelText="Không"
              >
                <Button 
                  icon={<CloseCircleOutlined />} 
                  size="small" 
                  danger
                  loading={updateStatusMutation.isPending}
                >
                  Hủy
                </Button>
              </Popconfirm>
            </>
          )}
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
