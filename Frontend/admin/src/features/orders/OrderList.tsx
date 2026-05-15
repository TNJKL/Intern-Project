import React from 'react';
import { Card, Table, Tag, Space, Button, Input } from 'antd';
import { SearchOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';

const OrderList: React.FC = () => {
  const columns = [
    { title: 'Mã đơn', dataIndex: 'id', key: 'id', render: (t: string) => <span className="font-bold">{t}</span> },
    { title: 'Ngày đặt', dataIndex: 'date', key: 'date' },
    { title: 'Khách hàng', dataIndex: 'customer', key: 'customer' },
    { title: 'Tổng tiền', dataIndex: 'total', key: 'total', render: (v: number) => <b>{v.toLocaleString()}đ</b> },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => <Tag color={s === 'Hoàn thành' ? 'green' : 'gold'}>{s.toUpperCase()}</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="primary" icon={<EyeOutlined />} size="small">Chi tiết</Button>
          <Button icon={<CheckCircleOutlined />} size="small" className="text-green-500 border-green-500">Duyệt</Button>
        </Space>
      ),
    },
  ];

  const data = [
    { key: '1', id: '#ORD-001', date: '2026-04-23 10:00', customer: 'Nguyễn Văn A', total: 150000, status: 'Mới' },
    { key: '2', id: '#ORD-002', date: '2026-04-23 11:30', customer: 'Trần Thị B', total: 45000, status: 'Đang giao' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Quản lý Đơn hàng</h2>
        <Input 
          placeholder="Tìm kiếm mã đơn, khách hàng..." 
          prefix={<SearchOutlined />} 
          className="max-w-xs rounded-full"
        />
      </div>
      
      <Card bordered={false} className="shadow-sm">
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default OrderList;
