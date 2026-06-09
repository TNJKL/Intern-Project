import React from 'react';
import { BaseManagement } from '../common/BaseManagement';
import { categoryService, type Category } from '@/services/category.service';
import { Tag, Space, Descriptions } from 'antd';
import { CategoryModal } from './components/CategoryModal';

const CategoryList: React.FC = () => {
  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">HÌNH ẢNH</span>,
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url: string) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
          {url ? (
            <img src={url} alt="Category" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">
              No Image
            </div>
          )}
        </div>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TÊN DANH MỤC</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => {
        const isDeleted = (record as any).isDeleted || (record as any).deleted || (record as any).deletedAt || (record as any).status === 'DELETED';
        return (
          <Space orientation="vertical" size={0}>
            <span className={`font-bold text-gray-800 ${isDeleted ? 'line-through text-gray-400' : ''}`}>
              {name}
            </span>
            {isDeleted && (
              <Tag color="red" className="border-none rounded-lg text-[9px] font-black uppercase px-2 py-0 m-0">
                Đã xóa
              </Tag>
            )}
            <span className="text-[10px] text-gray-400 font-mono">{record.slug}</span>
          </Space>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THỨ TỰ</span>,
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 100,
      align: 'center' as const,
      render: (order: number) => <span className="font-bold text-gray-600">{order}</span>
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">SỐ SẢN PHẨM</span>,
      dataIndex: 'productCount',
      key: 'productCount',
      width: 120,
      align: 'center' as const,
      render: (count: number) => (
        <Tag color="blue" className="border-none rounded-lg font-bold">
          {count || 0} món
        </Tag>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean, record: Category) => {
        const isDeleted = (record as any).isDeleted || (record as any).deleted || (record as any).deletedAt || (record as any).status === 'DELETED';
        if (isDeleted) {
          return <Tag color="error" className="border-none rounded-lg font-black uppercase text-[10px]">Đã xóa</Tag>;
        }
        return (
          <Tag color={isActive ? 'success' : 'default'} className="border-none rounded-lg font-black uppercase text-[10px]">
            {isActive ? 'Đang hiện' : 'Đang ẩn'}
          </Tag>
        );
      },
    },
  ];

  const renderDetail = (category: Category) => (
    <div className="space-y-6">
      <div className="w-40 h-40 mx-auto rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name} className="w-full h-full object-contain p-2" />
        ) : (
          <div className="text-gray-300 font-black uppercase tracking-widest text-[10px]">No Image</div>
        )}
      </div>
      <Descriptions column={1} bordered size="small" className="bg-gray-50/50 rounded-xl overflow-hidden">
        <Descriptions.Item label={<span className="font-bold text-gray-500">ID</span>}>{category.id}</Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Tên danh mục</span>}><span className="font-bold text-gray-800">{category.name}</span></Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Slug</span>}><code className="text-xs text-orange-600 bg-orange-50 px-1 rounded">{category.slug}</code></Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Thứ tự hiển thị</span>}>{category.displayOrder}</Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Trạng thái</span>}>
          <Tag color={category.isActive ? 'success' : 'default'} className="border-none rounded-lg font-black uppercase text-[10px]">
            {category.isActive ? 'Đang hoạt động' : 'Đang ẩn'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Ngày tạo</span>}>{new Date(category.createdAt as any).toLocaleString('vi-VN')}</Descriptions.Item>
      </Descriptions>
    </div>
  );

  return (
    <BaseManagement<Category>
      title="Danh mục sản phẩm"
      description="Quản lý các nhóm đồ uống và món ăn của cửa hàng"
      entityName="danh mục"
      addButtonText="Thêm danh mục"
      searchPlaceholder="Tìm tên danh mục..."
      queryKey="categories"
      service={{
        getAll: categoryService.getAllCategories,
        getById: categoryService.getCategoryById,
        create: categoryService.createCategory,
        update: categoryService.updateCategory,
        delete: categoryService.deleteCategory,
        restore: categoryService.restoreCategory,
      }}
      columns={columns}
      ModalComponent={CategoryModal}
      renderDetail={renderDetail}
      formatSaveValues={(values) => ({
        name: values.name,
        slug: values.slug,
        description: values.description,
        imageUrl: values.imageUrl,
        displayOrder: Number(values.displayOrder || 0),
        isActive: values.isActive ?? true
      })}
      extraFilters={{
        showStatusFilter: false,
        showFeaturedFilter: false,
        showDeletedFilter: true
      }}
    />
  );
};

export default CategoryList;
