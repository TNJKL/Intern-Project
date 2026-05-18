import React from 'react';
import { Tag } from 'antd';
import { ToppingModal } from './components/ToppingModal';
import { toppingService, type Topping } from '../../services/toppingService';
import { BaseManagement } from '../common/BaseManagement';

const ToppingList: React.FC = () => {
  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TÊN TOPPING</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Topping) => (
        <span className={`font-bold uppercase ${(record as any).isDeleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {text}
          {(record as any).isDeleted && <Tag color="error" className="ml-2 text-[9px] border-none uppercase">Đã xóa</Tag>}
        </span>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">GIÁ (VNĐ)</span>,
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: Topping) => (
        <span className={`font-bold ${(record as any).isDeleted ? 'text-gray-300' : 'text-[#d37533]'}`}>
          {price.toLocaleString('vi-VN')}₫
        </span>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (available: boolean, record: Topping) => {
        const isDeleted = (record as any).isDeleted;
        if (isDeleted) return <Tag color="default" className="rounded-full px-3 font-bold opacity-50">KHÔNG KHẢ DỤNG</Tag>;
        return (
          <Tag color={available ? 'green' : 'red'} className="rounded-full px-3 font-bold">
            {available ? 'CÓ SẴN' : 'HẾT HÀNG'}
          </Tag>
        );
      }
    }
  ];

  return (
    <BaseManagement<Topping>
      title="Quản Lý Toppings"
      description="Quản lý các loại topping đi kèm đồ uống"
      addButtonText="Thêm topping mới"
      entityName="Topping"
      queryKey="toppings"
      service={{
        getAll: toppingService.getAllToppings,
        getById: toppingService.getToppingById,
        create: toppingService.createTopping,
        update: toppingService.updateTopping,
        delete: toppingService.deleteTopping,
        restore: toppingService.restoreTopping
      }}
      columns={columns}
      ModalComponent={ToppingModal}
      formatSaveValues={(values) => ({
        ...values,
        price: Number(values.price),
        displayOrder: Number(values.displayOrder || 0),
      })}
      extraFilters={{
        showDeletedFilter: true
      }}
    />
  );
};

export default ToppingList;
