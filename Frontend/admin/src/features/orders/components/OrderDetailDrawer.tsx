import React from 'react';
import { Drawer, Descriptions, Table, Tag, Typography, Spin, Divider } from 'antd';
import { useOrder } from '../hooks/useOrders';
//import type { OrderDetailItem } from '@/services/orderService';

const { Text, Title } = Typography;

interface OrderDetailDrawerProps {
  orderId?: string;
  isOpen: boolean;
  onClose: () => void;
}

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

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ orderId, isOpen, onClose }) => {
  const { data: response, isLoading } = useOrder(orderId);
  const order = response?.data;

  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Kích cỡ',
      dataIndex: 'variantLabel',
      key: 'variantLabel',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (val: number) => `${val?.toLocaleString() ?? 0}đ`,
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Thành tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (val: number) => <Text strong>{val?.toLocaleString() ?? 0}đ</Text>,
    },
  ];

  return (
    <Drawer
      title={<span className="font-black text-gray-800 uppercase tracking-wide">Chi tiết đơn hàng</span>}
      placement="right"
      width={600}
      onClose={onClose}
      open={isOpen}
      styles={{ body: { paddingBottom: 80 } }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : order ? (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
            <div>
              <Text type="secondary" className="text-xs uppercase tracking-widest font-bold">Mã đơn hàng</Text>
              <div className="text-lg font-black text-gray-800 mt-1">{order.orderCode}</div>
            </div>
            <div className="text-right">
              <Text type="secondary" className="text-xs uppercase tracking-widest font-bold">Trạng thái</Text>
              <div className="mt-1">
                <Tag color={getStatusColor(order.status)} className="m-0 text-sm py-1 px-3">
                  {getStatusText(order.status)?.toUpperCase()}
                </Tag>
              </div>
            </div>
          </div>

          <div>
            <Title level={5} className="!mb-4 uppercase text-sm tracking-widest text-gray-500">Thông tin khách hàng</Title>
            <Descriptions column={2} size="small" bordered className="bg-white">
              <Descriptions.Item label="Người đặt" span={2}><Text strong>{order.userName || order.userEmail || 'Khách vãng lai'}</Text></Descriptions.Item>
              <Descriptions.Item label="Số điện thoại" span={2}>{order.userPhone}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao hàng" span={2}>{order.deliveryAddress}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>{order.note || <Text type="secondary">Không có</Text>}</Descriptions.Item>
            </Descriptions>
          </div>

          <div>
            <Title level={5} className="!mb-4 uppercase text-sm tracking-widest text-gray-500">Chi tiết sản phẩm</Title>
            <Table
              dataSource={order.items || []}
              columns={itemColumns}
              pagination={false}
              rowKey="id"
              size="small"
              bordered
            />
          </div>

          <Divider />

          <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between">
              <Text>Tạm tính:</Text>
              <Text>{order.subtotal?.toLocaleString()}đ</Text>
            </div>
            <div className="flex justify-between">
              <Text>Phí giao hàng:</Text>
              <Text>15,000đ</Text>
            </div>
            <div className="flex justify-between text-green-600">
              <Text className="text-green-600">Khuyến mãi {order.voucherCode ? `(${order.voucherCode})` : ''}:</Text>
              <Text className="text-green-600">-{order.discountAmount?.toLocaleString() || 0}đ</Text>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
              <Text strong className="text-lg">Tổng thanh toán:</Text>
              <Text strong className="text-xl text-primary">{order.totalAmount?.toLocaleString()}đ</Text>
            </div>
          </div>

          <div className="text-right">
            <Text type="secondary" className="text-xs">Phương thức thanh toán: <Text strong>{order.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : order.paymentMethod}</Text></Text>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">
          Không tìm thấy thông tin đơn hàng
        </div>
      )}
    </Drawer>
  );
};

export default OrderDetailDrawer;
