// 📄 Vị trí file: src/features/ingredients/IngredientList.tsx
import React, { useState } from 'react';
import { BaseManagement } from '../common/BaseManagement';
import { ingredientService, type Ingredient } from '@/services/ingredient.service';
import { Tag, Space, Descriptions, Button, Tabs, Badge } from 'antd';
import { PlusSquareOutlined, CoffeeOutlined, TagsOutlined, WarningOutlined, HistoryOutlined, ExperimentOutlined } from '@ant-design/icons';
import { IngredientModal } from './components/IngredientModal';
import { useQuery } from '@tanstack/react-query';

// Import các component con đã tách logic
import { RestockModal } from './components/RestockModal';
import { ToppingThresholdModal } from './components/ToppingThresholdModal';
import { LowStockTab } from './components/LowStockTab';
import { TransactionHistoryTab } from './components/TransactionHistoryTab';
import { ToppingStockTab } from './components/ToppingStockTab';
import { RecipeListTab } from './components/RecipeListTab';

const IngredientList: React.FC = () => {
  // State quản lý Tab chính
  const [activeMainTab, setActiveMainTab] = useState('ingredients');

  // State quản lý Modal Nhập kho và Sửa ngưỡng cảnh báo
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null);

  const [isThresholdOpen, setIsThresholdOpen] = useState(false);
  const [selectedTopping, setSelectedTopping] = useState<any | null>(null);

  // ─── Query lấy danh sách để tính toán Badge ở Tab chính ───
  // Nhờ cơ chế cache của React Query, các query này sẽ dùng chung cache với các tab con mà không tạo request trùng lặp
  const { data: toppingStockRes } = useQuery({
    queryKey: ['inventory', 'toppings'],
    queryFn: () => ingredientService.getToppingInventory(),
  });

  const { data: lowStockRes } = useQuery({
    queryKey: ['ingredients', 'low-stock'],
    queryFn: () => ingredientService.getInventoryStock({ low_stock: true, page: 0, size: 100 }),
  });

  // Tính số lượng topping sắp hết tồn kho
  const toppingStockRecords = toppingStockRes 
    ? (Array.isArray(toppingStockRes) ? toppingStockRes : (toppingStockRes.data || toppingStockRes.records || []))
    : [];

  const toppingLowStockCount = toppingStockRecords.filter((r: any) => {
    const stock = r.currentStock !== undefined ? r.currentStock : (r.stock !== undefined ? r.stock : (r.quantity !== undefined ? r.quantity : 0));
    const threshold = r.lowStockThreshold !== undefined ? r.lowStockThreshold : (r.threshold !== undefined ? r.threshold : 10);
    return stock <= threshold;
  }).length;

  // Tính số lượng nguyên liệu thô sắp hết tồn kho
  const lowStockRecordsRaw = lowStockRes 
    ? (Array.isArray(lowStockRes) ? lowStockRes : (lowStockRes.data || lowStockRes.records || []))
    : [];
  
  const lowStockRecordsCount = (() => {
    const toppingIds = new Set(toppingStockRecords.map((t: any) => t.id || t.toppingId));
    return lowStockRecordsRaw.filter((item: any) => !toppingIds.has(item.id)).length;
  })();

  const openRestockModal = (record: any) => {
    setSelectedIngredient(record);
    setIsRestockOpen(true);
  };

  const openThresholdModal = (record: any) => {
    setSelectedTopping(record);
    setIsThresholdOpen(true);
  };

  // Columns cho bảng chính Nguyên liệu kho
  const columns = [
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
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TỒN KHO</span>,
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'center' as const,
      render: (stock: number, record: Ingredient) => {
        const isLow = (stock || 0) <= (record.lowStockThreshold || 0);
        return (
          <Tag color={isLow ? 'error' : 'success'} className="border-none rounded-lg font-bold">
            {stock || 0} {record.unit || ''}
          </Tag>
        );
      }
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">ĐƠN VỊ</span>,
      dataIndex: 'unit',
      key: 'unit',
      align: 'center' as const,
      render: (unit: string) => <span className="font-medium text-gray-600">{unit || ''}</span>
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">GIÁ VỐN</span>,
      dataIndex: 'costPerUnit',
      key: 'costPerUnit',
      align: 'right' as const,
      render: (cost: number) => <span className="font-bold text-gray-600">{(cost || 0).toLocaleString('vi-VN')} đ</span>
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean, record: Ingredient) => {
        if (record.deletedAt || record.isDeleted) {
          return (
            <Tag color="error" className="border-none rounded-lg font-black uppercase text-[10px]">
              Đã xóa mềm
            </Tag>
          );
        }
        return (
          <Tag color={isActive ? 'success' : 'default'} className="border-none rounded-lg font-black uppercase text-[10px]">
            {isActive ? 'Đang dùng' : 'Ngừng dùng'}
          </Tag>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">KHO HOẠT ĐỘNG</span>,
      key: 'restockAction',
      width: 130,
      align: 'center' as const,
      render: (_: any, record: Ingredient) => {
        if (record.isActive === false || record.isDeleted) return null;

        return (
          <Button
            type="default"
            size="small"
            icon={<PlusSquareOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openRestockModal(record);
            }}
            className="text-orange-600 hover:text-white hover:bg-orange-500 border border-orange-200 bg-orange-50/50 font-bold text-[11px] rounded-lg"
          >
            Nhập kho
          </Button>
        );
      }
    }
  ];

  const renderDetail = (ingredient: Ingredient) => (
    <div className="space-y-6">
      <Descriptions column={1} bordered size="small" className="bg-gray-50/50 rounded-xl overflow-hidden">
        <Descriptions.Item label={<span className="font-bold text-gray-500">ID</span>}>{ingredient.id}</Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Tên nguyên liệu</span>}><span className="font-bold text-gray-800">{ingredient.name}</span></Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">SKU</span>}><code className="text-xs text-orange-600 bg-orange-50 px-1 rounded">{ingredient.sku}</code></Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Đơn vị</span>}>{ingredient.unit}</Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Tồn kho hiện tại</span>}>{ingredient.currentStock} {ingredient.unit}</Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Ngưỡng cảnh báo hết</span>}>{ingredient.lowStockThreshold} {ingredient.unit}</Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Giá vốn</span>}>{ingredient.costPerUnit.toLocaleString('vi-VN')} đ</Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Trạng thái</span>}>
          <Tag color={ingredient.isActive ? 'success' : 'default'} className="border-none rounded-lg font-black uppercase text-[10px]">
            {ingredient.isActive ? 'Nguyên liệu' : 'Ngừng dùng'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<span className="font-bold text-gray-500">Ngày tạo</span>}>{new Date(ingredient.createdAt as any).toLocaleString('vi-VN')}</Descriptions.Item>
      </Descriptions>
    </div>
  );

  return (
    <>
      <Tabs
        activeKey={activeMainTab}
        onChange={setActiveMainTab}
        size="large"
        className="custom-main-tabs"
        items={[
          {
            key: 'ingredients',
            label: (
              <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                <CoffeeOutlined className="text-orange-500" />
                Quản lý Nguyên liệu
              </span>
            ),
            children: (
              <BaseManagement<Ingredient>
                title="Nguyên liệu kho"
                description="Quản lý các nguyên liệu thô để pha chế (Sữa tươi, trà đen, syrup...)"
                entityName="nguyên liệu"
                addButtonText="Thêm nguyên liệu"
                searchPlaceholder="Tìm tên nguyên liệu..."
                queryKey="ingredients"
                service={{
                  getAll: async (params: any) => {
                    const currentSize = params.size || 10;

                    const apiParams = {
                      ...params,
                      page: params.page || 0,
                      size: currentSize,
                      excludeToppings: true
                    };

                    if (params.size === 1 && params.includeDeleted === true) {
                      apiParams.size = 500;
                    } else if (params.size === 1) {
                      apiParams.size = currentSize;
                    }

                    const responseData: any = await ingredientService.getAllIngredients(apiParams);

                    const finalData = responseData.data && Array.isArray(responseData.data)
                      ? responseData.data
                      : (responseData.content || responseData.results || responseData);

                    const totalElements = responseData.totalElements !== undefined ? responseData.totalElements : (responseData.total || 0);
                    const realPageSize = responseData.pageSize !== undefined ? responseData.pageSize : apiParams.size;
                    const currentPage = responseData.currentPage !== undefined ? responseData.currentPage : apiParams.page;
                    const totalPages = Math.ceil(totalElements / realPageSize);

                    return {
                      data: Array.isArray(finalData) ? finalData : [],
                      totalElements: totalElements,
                      totalPages: totalPages,
                      size: realPageSize,
                      number: currentPage + 1
                    };
                  },
                  getById: ingredientService.getIngredientById,
                  create: ingredientService.createIngredient,
                  update: ingredientService.updateIngredient,
                  delete: ingredientService.deleteIngredient,
                  restore: ingredientService.restoreIngredient,
                }}
                columns={columns}
                ModalComponent={IngredientModal}
                renderDetail={renderDetail}
                formatSaveValues={(values) => ({
                  name: values.name,
                  sku: values.sku,
                  unit: values.unit,
                  currentStock: Number(values.currentStock || 0),
                  lowStockThreshold: Number(values.lowStockThreshold || 0),
                  costPerUnit: Number(values.costPerUnit || 0),
                  isActive: values.isActive
                })}
                extraFilters={{
                  showStatusFilter: true,
                  showFeaturedFilter: false,
                  showDeletedFilter: true
                }}
                extraTabs={[
                  {
                    key: 'low-stock',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <WarningOutlined className="text-amber-500" />
                        Sắp hết hàng
                      </span>
                    ),
                    content: <LowStockTab onOpenRestock={openRestockModal} />,
                    badge: lowStockRecordsCount,
                  },
                  {
                    key: 'inventory-transactions',
                    label: (
                      <span className="flex items-center gap-1.5">
                        <HistoryOutlined className="text-blue-500" />
                        Lịch sử nhập/xuất
                      </span>
                    ),
                    content: <TransactionHistoryTab />,
                  }
                ]}
              />
            )
          },
          {
            key: 'toppings',
            label: (
              <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                <TagsOutlined className="text-amber-500" />
                Tồn kho Topping
                {toppingLowStockCount > 0 && (
                  <Badge
                    count={toppingLowStockCount}
                    color="#f59e0b"
                    className="scale-90 ml-1"
                  />
                )}
              </span>
            ),
            children: (
              <ToppingStockTab 
                onOpenRestock={openRestockModal} 
                onOpenThreshold={openThresholdModal} 
              />
            )
          },
          {
            key: 'recipes',
            label: (
              <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                <ExperimentOutlined className="text-amber-500" />
                Công thức pha chế
              </span>
            ),
            children: <RecipeListTab />
          }
        ]}
      />

      {/* Modal Nhập kho */}
      <RestockModal 
        open={isRestockOpen} 
        ingredient={selectedIngredient} 
        onCancel={() => setIsRestockOpen(false)} 
        onSuccess={() => setIsRestockOpen(false)} 
      />

      {/* Modal Sửa ngưỡng cảnh báo topping */}
      <ToppingThresholdModal 
        open={isThresholdOpen} 
        topping={selectedTopping} 
        onCancel={() => setIsThresholdOpen(false)} 
        onSuccess={() => setIsThresholdOpen(false)} 
      />
    </>
  );
};

export default IngredientList;