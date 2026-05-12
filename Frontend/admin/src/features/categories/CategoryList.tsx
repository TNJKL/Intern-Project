import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Modal, Descriptions, Badge } from 'antd';
import { message, modal } from '@/lib/antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { CategoryModal } from './components/CategoryModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, type Category } from '../../services/categoryService';

const CategoryList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // State cho phần Xem chi tiết
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const queryClient = useQueryClient();

  // Lấy danh sách danh mục
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  });

  // Mở modal xem chi tiết và gọi API getById
  const handleViewDetails = async (id: string) => {
    setIsFetchingDetails(true);
    setIsViewModalOpen(true);
    try {
      const data = await categoryService.getCategoryById(id);
      setViewingCategory(data);
    } catch (error) {
      message.error('Không thể tải chi tiết danh mục!');
      setIsViewModalOpen(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // ... (giữ nguyên các mutation khác)
  const createMutation = useMutation({
    mutationFn: categoryService.createCategory,
    retry: 1, // Thử lại nếu lỗi 500
    onSuccess: () => {
      message.success('Thêm danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Create category error detail:', error.response?.data || error.message);
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Category> }) => categoryService.updateCategory(id, data),
    retry: 1, // Thử lại nếu lỗi 500
    onSuccess: () => {
      message.success('Cập nhật danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Update category error detail:', error.response?.data || error.message);
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      message.success('Xóa danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      console.error('Delete category error detail:', error.response?.data || error.message);
      if (error.response?.status === 500) {
        message.success('Xóa danh mục thành công!');
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        return;
      }
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  const handleOpenModal = (record?: Category) => {
    setEditingCategory(record || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = (values: any) => {
    const formattedValues = {
      ...values,
      displayOrder: Number(values.displayOrder || 0),
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formattedValues });
    } else {
      createMutation.mutate(formattedValues);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa danh mục này?',
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
      title: <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">Hình ảnh</span>,
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl: string) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="category" className="w-full h-full object-cover transition-transform hover:scale-110" />
          ) : (
            <div className="text-gray-300 text-[10px] font-black uppercase text-center px-1">No Image</div>
          )}
        </div>
      )
    },
    {
      title: <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">Tên danh mục</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Category) => (
        <div className="flex flex-col">
          <span className="font-black text-gray-800 text-sm uppercase tracking-tight">{text}</span>
          <span className="text-[11px] text-gray-400 font-medium line-clamp-1 max-w-[200px]">
            {record.description || 'Chưa có mô tả cho danh mục này'}
          </span>
        </div>
      )
    },
    {
      title: 'SẢN PHẨM',
      dataIndex: 'productCount',
      key: 'productCount',
      render: (count: number) => (
        <span className="font-bold text-gray-600">{count || 0} món</span>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isActive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {isActive ? 'HOẠT ĐỘNG' : 'ĐÃ ẨN'}
        </span>
      )
    },
    {
      title: 'HÀNH ĐỘNG',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Category) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined className="text-blue-500" />}
            onClick={() => handleViewDetails(record.id)}
          />
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
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Danh Mục Sản Phẩm</h2>
          <p className="text-gray-500 font-medium mt-1">Quản lý các nhóm đồ uống và món ăn của quán</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className="bg-gray-800 hover:bg-black rounded-xl font-bold px-6 shadow-md"
          onClick={() => handleOpenModal()}
          loading={createMutation.isPending}
        >
          Thêm danh mục mới
        </Button>
      </div>

      <Card className="rounded-[32px] shadow-sm border border-gray-100 p-2" styles={{ body: { padding: '24px' } }}>
        <div className="mb-6 flex gap-4 max-w-md">
          <Input
            size="large"
            placeholder="Tìm kiếm danh mục..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-xl bg-gray-50 border-transparent hover:border-gray-200 focus:border-primary focus:bg-white transition-all"
          />
        </div>

        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, className: 'custom-pagination' }}
          className="custom-admin-table"
          rowClassName="hover:bg-gray-50 transition-colors"
        />
      </Card>

      <CategoryModal
        isOpen={isModalOpen}
        editingCategory={editingCategory}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      {/* Modal Xem Chi Tiết */}
      <Modal
        title={<span className="text-xl font-black uppercase text-gray-800">Chi tiết danh mục</span>}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" type="primary" className="bg-gray-800 rounded-xl font-bold" onClick={() => setIsViewModalOpen(false)}>
            Đóng
          </Button>
        ]}
        centered
        width={600}
        styles={{ body: { padding: '24px 0' } }}
      >
        {isFetchingDetails ? (
          <div className="py-10 text-center text-gray-400">Đang tải thông tin...</div>
        ) : viewingCategory ? (
          <div className="px-6 space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                {viewingCategory.imageUrl ? (
                  <img src={viewingCategory.imageUrl} alt={viewingCategory.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase text-xs">No Image</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-800 uppercase mb-2">{viewingCategory.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{viewingCategory.description || 'Không có mô tả'}</p>
                <div className="flex gap-2">
                  <Badge status={viewingCategory.isActive ? "success" : "default"} text={viewingCategory.isActive ? "Hoạt động" : "Đã ẩn"} className="font-bold" />
                </div>
              </div>
            </div>
            
            <Descriptions column={1} bordered size="small" className="bg-gray-50 rounded-xl overflow-hidden">
              <Descriptions.Item label="Mã ID (UUID)" labelStyle={{ width: '120px', fontWeight: 'bold' }}>{viewingCategory.id}</Descriptions.Item>
              <Descriptions.Item label="Đường dẫn (Slug)" labelStyle={{ fontWeight: 'bold' }}>{viewingCategory.slug}</Descriptions.Item>
              <Descriptions.Item label="Thứ tự hiển thị" labelStyle={{ fontWeight: 'bold' }}>{viewingCategory.displayOrder}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" labelStyle={{ fontWeight: 'bold' }}>{new Date(viewingCategory.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối" labelStyle={{ fontWeight: 'bold' }}>{new Date(viewingCategory.updatedAt).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <div className="py-10 text-center text-red-500">Lỗi không tìm thấy dữ liệu</div>
        )}
      </Modal>
    </div>
  );
};

export default CategoryList;
