import React from 'react';
import { Table, Tag, Space, Button, Alert, Card } from 'antd';
import { PlusSquareOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { ingredientService, type Ingredient } from '@/services/ingredient.service';

interface LowStockTabProps {
  onOpenRestock: (record: Ingredient) => void;
}

export const LowStockTab: React.FC<LowStockTabProps> = ({ onOpenRestock }) => {
  // Query lấy danh sách tồn kho topping để loại bỏ ra khỏi danh sách nguyên liệu thô
  const { data: toppingStockRes } = useQuery({
    queryKey: ['inventory', 'toppings'],
    queryFn: () => ingredientService.getToppingInventory(),
  });

  // Query lấy danh sách nguyên liệu sắp hết tồn kho
  const { data: lowStockRes, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['ingredients', 'low-stock'],
    queryFn: () => ingredientService.getInventoryStock({ low_stock: true, page: 0, size: 100 }),
  });

  // Chuyển đổi và lọc bỏ toppings
  const lowStockRecords: Ingredient[] = (() => {
    if (!lowStockRes) return [];
    const rawLow = Array.isArray(lowStockRes)
      ? lowStockRes
      : (lowStockRes.data || lowStockRes.records || []);
    const lowList = Array.isArray(rawLow) ? rawLow : [];

    const rawToppings = toppingStockRes 
      ? (Array.isArray(toppingStockRes) ? toppingStockRes : (toppingStockRes.data || toppingStockRes.records || []))
      : [];
    const toppingList = Array.isArray(rawToppings) ? rawToppings : [];
    
    const toppingIds = new Set(toppingList.map((t: any) => t.id || t.toppingId));
    return lowList.filter((item: Ingredient) => !toppingIds.has(item.id));
  })();

  const lowStockColumns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TÊN NGUYÊN LIỆU</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Ingredient) => (
        <Space orientation="vertical" size={0}>
          <span className="font-bold text-gray-800">{name}</span>
          <span className="text-[10px] text-gray-400 font-mono">SKU: {record.sku}</span>
        </Space>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TỒN KHO HIỆN TẠI</span>,
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'center' as const,
      render: (stock: number, record: Ingredient) => (
        <Tag color="error" className="border-none rounded-lg font-black text-sm">
          {stock ?? 0} {record.unit || ''}
        </Tag>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">NGƯỠNG CẢNH BÁO</span>,
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      align: 'center' as const,
      render: (threshold: number, record: Ingredient) => (
        <span className="font-bold text-amber-600">{threshold ?? 0} {record.unit || ''}</span>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">GIÁ VỐN</span>,
      dataIndex: 'costPerUnit',
      key: 'costPerUnit',
      align: 'right' as const,
      render: (cost: number) => <span className="font-bold text-gray-600">{(cost || 0).toLocaleString('vi-VN')} đ</span>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">NHẬP KHO</span>,
      key: 'restockAction',
      width: 130,
      align: 'center' as const,
      render: (_: any, record: Ingredient) => (
        <Button
          type="default"
          size="small"
          icon={<PlusSquareOutlined />}
          onClick={() => onOpenRestock(record)}
          className="text-orange-600 hover:text-white hover:bg-orange-500 border border-orange-200 bg-orange-50/50 font-bold text-[11px] rounded-lg"
        >
          Nhập kho
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {lowStockRecords.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={
            <span className="font-bold text-amber-800">
              Có {lowStockRecords.length} nguyên liệu sắp hết tồn kho — cần nhập thêm ngay!
            </span>
          }
          className="rounded-2xl border-amber-200 bg-amber-50"
        />
      )}
      <Card
        variant="borderless"
        className="rounded-[20px] sm:rounded-[32px] shadow-sm border border-amber-100 p-1 sm:p-2 overflow-hidden"
        styles={{ body: { padding: '24px' } }}
      >
        <Table
          columns={lowStockColumns}
          dataSource={lowStockRecords}
          rowKey="id"
          loading={isLowStockLoading}
          pagination={{ pageSize: 20, showSizeChanger: true, className: 'custom-pagination' }}
          className="custom-admin-table"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <div className="py-12 text-center text-gray-400 font-bold">Không có nguyên liệu nào sắp hết!</div> }}
          rowClassName={(record: Ingredient) => (record.currentStock === 0 ? 'bg-red-50/40' : 'bg-amber-50/20')}
        />
      </Card>
    </div>
  );
};
