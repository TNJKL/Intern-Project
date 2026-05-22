import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Popconfirm, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { Voucher } from '@/services/voucher.service';
import { useVouchers } from './hooks/useVouchers';
import { VoucherModal } from './components/VoucherModal';
import { VoucherDetailModal } from './components/VoucherDetailModal';
import dayjs from 'dayjs';
import { ManagementHeader } from '../common/components/ManagementHeader';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const VoucherList: React.FC = () => {
  const { vouchers, isLoading, createVoucher, updateVoucher, deleteVoucher, toggleStatus } = useVouchers();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailedVoucher, setDetailedVoucher] = useState<Voucher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVouchers = vouchers.filter((v: Voucher) => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue" className="text-base font-bold uppercase">{text}</Tag>,
    },
    {
      title: 'Tên Voucher',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mức giảm',
      key: 'discount',
      render: (_: any, record: Voucher) => (
        <span>
          {record.discountType === 'PERCENTAGE' 
            ? `${record.discountValue}% (Tối đa ${record.maxDiscountAmount?.toLocaleString()}đ)`
            : `${record.discountValue.toLocaleString()}đ`
          }
        </span>
      ),
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minOrderAmount',
      key: 'minOrderAmount',
      render: (val: number) => `${val.toLocaleString()}đ`,
    },
    {
      title: 'Hạng áp dụng',
      key: 'applicableTier',
      render: (_: any, record: Voucher) => {
        const tier = record.applicableTier || 'ALL';
        if (tier === 'VIP') return <Tag color="gold" className="font-bold">Chỉ VIP</Tag>;
        if (tier === 'MEMBER') return <Tag color="orange" className="font-bold">Thành viên</Tag>;
        return <Tag color="blue" className="font-bold">Tất cả</Tag>;
      }
    },
    {
      title: 'Đã dùng',
      key: 'usage',
      render: (_: any, record: Voucher) => (
        <span>{record.currentUsageCount} / {record.maxUsageCount}</span>
      ),
    },
    {
      title: 'Hạn sử dụng',
      key: 'validUntil',
      render: (_: any, record: Voucher) => (
        <span className={dayjs(record.validUntil).isBefore(dayjs()) ? "text-red-500" : ""}>
          {dayjs(record.validFrom).format('DD/MM/YYYY')} - {dayjs(record.validUntil).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: Voucher) => (
        <Switch 
          checked={record.isActive}
          loading={toggleStatus.isPending}
          onChange={() => toggleStatus.mutate(record.id)}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Voucher) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined className="text-blue-500" />} 
            onClick={() => {
              setDetailedVoucher(record);
              setIsDetailOpen(true);
            }}
            title="Xem chi tiết"
          />
          <Button 
            type="text" 
            icon={<EditOutlined className="text-amber-600" />} 
            onClick={() => {
              setEditingVoucher(record);
              setIsModalOpen(true);
            }}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa voucher"
            description="Bạn có chắc chắn muốn xóa voucher này không?"
            onConfirm={() => deleteVoucher.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} loading={deleteVoucher.isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ManagementHeader
        title="Quản lý Khuyến mãi"
        description="Quản lý các mã giảm giá, chương trình khuyến mãi cho cửa hàng"
        addButtonText="Thêm Voucher"
        onAdd={() => {
          setEditingVoucher(null);
          setIsModalOpen(true);
        }}
        isLoading={createVoucher.isPending}
      />

      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center bg-white/50 p-2 rounded-2xl border border-gray-100/50 backdrop-blur-md">
          <Input
            placeholder="Tìm kiếm mã hoặc tên voucher..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-md rounded-xl border-none bg-transparent hover:bg-white focus:bg-white transition-all h-11 text-sm"
          />
        </div>
      </div>

      <Card variant="borderless" className="rounded-[32px] shadow-sm border border-gray-100 p-2 overflow-hidden" styles={{ body: { padding: '24px' } }}>
        <Table
          columns={columns}
          dataSource={filteredVouchers}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <VoucherModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVoucher(null);
        }}
        onSubmit={(data) => {
          if (editingVoucher) {
            const { code, ...updateData } = data;
            updateVoucher.mutate({ id: editingVoucher.id, data: updateData }, {
              onSuccess: () => setIsModalOpen(false)
            });
          } else {
            createVoucher.mutate(data, {
              onSuccess: () => setIsModalOpen(false)
            });
          }
        }}
        initialData={editingVoucher}
        isLoading={createVoucher.isPending || updateVoucher.isPending}
      />

      <VoucherDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailedVoucher(null);
        }}
        voucher={detailedVoucher}
      />
    </div>
  );
};

export default VoucherList;
