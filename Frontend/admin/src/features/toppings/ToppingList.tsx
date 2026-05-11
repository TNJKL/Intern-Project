import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Tag } from 'antd';
import { message, modal } from '@/lib/antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { ToppingModal } from './components/ToppingModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toppingService, type Topping } from '../../services/toppingService';

const ToppingList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const queryClient = useQueryClient();

  const { data: toppings, isLoading } = useQuery({
    queryKey: ['toppings'],
    queryFn: toppingService.getAllToppings,
  });

  const createMutation = useMutation({
    mutationFn: toppingService.createTopping,
    onSuccess: () => {
      message.success('Thêm topping thành công!');
      queryClient.invalidateQueries({ queryKey: ['toppings'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Topping> }) => toppingService.updateTopping(id, data),
    onSuccess: () => {
      message.success('Cập nhật topping thành công!');
      queryClient.invalidateQueries({ queryKey: ['toppings'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: toppingService.deleteTopping,
    onSuccess: () => {
      message.success('Xóa topping thành công!');
      queryClient.invalidateQueries({ queryKey: ['toppings'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  const handleOpenModal = (record?: Topping) => {
    setEditingTopping(record || null);
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    if (editingTopping) {
      updateMutation.mutate({ id: editingTopping.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa topping này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteMutation.mutate(id);
      }
    });
  };

  const columns = [
    {
      title: 'TÊN TOPPING',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-bold text-gray-800 uppercase">{text}</span>
    },
    {
      title: 'GIÁ (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="font-bold text-[#d37533]">
          {price.toLocaleString('vi-VN')}₫
        </span>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (available: boolean) => (
        <Tag color={available ? 'green' : 'red'} className="rounded-full px-3 font-bold">
          {available ? 'CÓ SẴN' : 'HẾT HÀNG'}
        </Tag>
      )
    },
    {
      title: 'HÀNH ĐỘNG',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Topping) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-[#d37533]" />} 
            onClick={() => handleOpenModal(record)} 
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            loading={deleteMutation.isPending && deleteMutation.variables === record.id}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Quản Lý Toppings</h2>
          <p className="text-gray-500 font-medium mt-1">Quản lý các loại topping đi kèm đồ uống</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className="bg-gray-800 hover:bg-black rounded-xl font-bold px-6 shadow-md"
          onClick={() => handleOpenModal()}
        >
          Thêm topping mới
        </Button>
      </div>

      <Card className="rounded-[32px] shadow-sm border border-gray-100 p-2" styles={{ body: { padding: '24px' } }}>
        <div className="mb-6 flex gap-4 max-w-md">
          <Input
            size="large"
            placeholder="Tìm kiếm topping..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-primary focus:bg-white transition-all"
          />
        </div>

        <Table
          columns={columns}
          dataSource={toppings}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          className="custom-admin-table"
        />
      </Card>

      <ToppingModal
        isOpen={isModalOpen}
        editingTopping={editingTopping}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default ToppingList;
