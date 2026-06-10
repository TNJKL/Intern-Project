import React, { useState } from 'react';
import { Table, Tag, Space, Button, Alert, Card } from 'antd';
import { PlusSquareOutlined, EditOutlined, SyncOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { ingredientService } from '@/services/ingredient.service';
import { toppingService } from '@/services/topping.service';
import { message } from '@/lib/antd';

interface ToppingStockTabProps {
  onOpenRestock: (record: any) => void;
  onOpenThreshold: (record: any) => void;
}

export const ToppingStockTab: React.FC<ToppingStockTabProps> = ({
  onOpenRestock,
  onOpenThreshold,
}) => {
  const [isToppingSyncing, setIsToppingSyncing] = useState(false);

  // ─── Query lấy danh sách tồn kho topping từ Inventory Service ───
  const {
    data: toppingStockRes,
    isLoading: isToppingStockLoading,
    refetch: refetchToppings,
  } = useQuery({
    queryKey: ['inventory', 'toppings'],
    queryFn: () => ingredientService.getToppingInventory(),
  });

  // ─── Query lấy danh sách topping từ Product Service (để lấy giá chính xác) ───
  const { data: productToppingsRes } = useQuery({
    queryKey: ['toppings', 'all-for-price'],
    queryFn: () => toppingService.getAllToppings({ size: 200 }),
  });

  // Tạo map { toppingId -> price } từ Product Service
  const toppingPriceMap = (() => {
    const raw = Array.isArray(productToppingsRes)
      ? productToppingsRes
      : ((productToppingsRes as any)?.data || (productToppingsRes as any)?.records || []);
    const map: Record<string, number> = {};
    if (Array.isArray(raw)) {
      raw.forEach((t: any) => {
        if (t.id) map[t.id] = t.price ?? 0;
      });
    }
    return map;
  })();

  // Merge giá từ Product Service vào dữ liệu tồn kho topping
  const toppingStockRecords: any[] = (() => {
    if (!toppingStockRes) return [];
    const raw = Array.isArray(toppingStockRes)
      ? toppingStockRes
      : ((toppingStockRes as any).data || (toppingStockRes as any).records || []);
    const list = Array.isArray(raw) ? raw : [];
    // Bổ sung giá từ Product Service nếu giá trong Inventory = 0 hoặc không có
    return list.map((item: any) => {
      const id = item.id || item.toppingId;
      const existingPrice = item.price ?? item.costPerUnit ?? item.cost_per_unit ?? item.cost;
      const productPrice = id ? toppingPriceMap[id] : undefined;
      return {
        ...item,
        // Ưu tiên giá từ Product Service nếu giá hiện tại = 0 hoặc không xác định
        price: (existingPrice && Number(existingPrice) > 0) ? Number(existingPrice) : (productPrice ?? 0),
      };
    });
  })();

  const handleManualSync = async () => {
    setIsToppingSyncing(true);
    try {
      await refetchToppings();
      message.success('Đồng bộ dữ liệu Topping từ Product Service thành công!');
    } catch (error: any) {
      message.error('Lỗi đồng bộ dữ liệu Topping: ' + (error?.message || 'Không xác định'));
    } finally {
      setIsToppingSyncing(false);
    }
  };

  // Columns cho bảng Tồn kho Topping
  const toppingStockColumns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TÊN TOPPING</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => {
        const displayName = name || record.toppingName || 'Chưa đặt tên';
        return (
          <Space orientation="vertical" size={0}>
            <span className="font-bold text-gray-800 uppercase">{displayName}</span>
            {record.id && <span className="text-[10px] text-gray-400 font-mono">ID: {record.id}</span>}
          </Space>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TỒN KHO</span>,
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'center' as const,
      render: (stock: number, record: any) => {
        const currentVal = stock !== undefined ? stock : (record.stock !== undefined ? record.stock : (record.quantity !== undefined ? record.quantity : 0));
        const threshold = record.lowStockThreshold !== undefined ? record.lowStockThreshold : (record.threshold !== undefined ? record.threshold : 10);
        const isLow = currentVal <= threshold;
        const unit = record.unit || record.measure || 'phần';
        return (
          <Tag color={isLow ? 'error' : 'success'} className="border-none rounded-lg font-black text-sm">
            {currentVal} {unit}
          </Tag>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">NGƯỠNG CẢNH BÁO</span>,
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      align: 'center' as const,
      render: (threshold: number, record: any) => {
        const thresholdVal = threshold !== undefined ? threshold : (record.threshold !== undefined ? record.threshold : 10);
        const unit = record.unit || record.measure || 'phần';
        return (
          <Space size={6}>
            <span className="font-bold text-amber-600">{thresholdVal} {unit}</span>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onOpenThreshold(record)}
              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg p-0.5"
            />
          </Space>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">GIÁ BÁN (VNĐ)</span>,
      key: 'price',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const val = record.price ?? record.costPerUnit ?? record.cost_per_unit ?? record.cost ?? 0;
        return <span className="font-bold text-[#d37533]">{Number(val).toLocaleString('vi-VN')} ₫</span>;
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI KHO</span>,
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      align: 'center' as const,
      render: (available: boolean, record: any) => {
        const stock = record.currentStock !== undefined ? record.currentStock : (record.stock !== undefined ? record.stock : (record.quantity !== undefined ? record.quantity : 0));
        const hasStock = stock > 0;
        const isAvail = available !== undefined ? available : (record.isActive !== undefined ? record.isActive : true);
        return (
          <Tag color={hasStock && isAvail ? 'success' : 'error'} className="border-none rounded-lg font-black uppercase text-[10px]">
            {hasStock && isAvail ? 'Còn hàng' : 'Hết hàng'}
          </Tag>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">NHẬP KHO</span>,
      key: 'restockAction',
      width: 130,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Button
          type="default"
          size="small"
          icon={<PlusSquareOutlined />}
          onClick={() =>
            onOpenRestock({
              ...record,
              id: record.id || record.toppingId,
              name: record.name || record.toppingName || 'Chưa đặt tên',
              currentStock:
                record.currentStock !== undefined
                  ? record.currentStock
                  : record.stock !== undefined
                  ? record.stock
                  : record.quantity !== undefined
                  ? record.quantity
                  : 0,
              unit: record.unit || record.measure || 'phần',
            })
          }
          className="text-orange-600 hover:text-white hover:bg-orange-500 border border-orange-200 bg-orange-50/50 font-bold text-[11px] rounded-lg"
        >
          Nhập kho
        </Button>
      ),
    },
  ];

  const lowStockToppings = toppingStockRecords.filter((r) => {
    const stock =
      r.currentStock !== undefined
        ? r.currentStock
        : r.stock !== undefined
        ? r.stock
        : r.quantity !== undefined
        ? r.quantity
        : 0;
    const threshold =
      r.lowStockThreshold !== undefined
        ? r.lowStockThreshold
        : r.threshold !== undefined
        ? r.threshold
        : 10;
    return stock <= threshold;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
          <h3
            className="text-lg font-black uppercase text-gray-800 tracking-tight"
            style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}
          >
            Tồn kho Topping
          </h3>
          <p className="text-xs text-gray-500">Xem và cập nhật tồn kho cho các loại topping đi kèm sản phẩm</p>
        </div>
        <Button
          type="primary"
          icon={<SyncOutlined />}
          loading={isToppingStockLoading || isToppingSyncing}
          onClick={handleManualSync}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold border-none h-11 px-6 shadow-md shadow-orange-500/20 flex items-center gap-2 w-fit"
        >
          Đồng bộ Topping
        </Button>
      </div>

      {lowStockToppings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={
            <span className="font-bold text-amber-800">
              Có {lowStockToppings.length} topping sắp hết tồn kho!
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
          columns={toppingStockColumns}
          dataSource={toppingStockRecords}
          rowKey={(record: any) => record.id || record.toppingId || Math.random().toString()}
          loading={isToppingStockLoading || isToppingSyncing}
          pagination={{ pageSize: 20, showSizeChanger: true, className: 'custom-pagination' }}
          className="custom-admin-table"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <div className="py-12 text-center text-gray-400 font-bold">Không có dữ liệu tồn kho topping!</div> }}
          rowClassName={(record: any) => {
            const stock =
              record.currentStock !== undefined
                ? record.currentStock
                : record.stock !== undefined
                ? record.stock
                : record.quantity !== undefined
                ? record.quantity
                : 0;
            return stock === 0 ? 'bg-red-50/40' : 'bg-white';
          }}
        />
      </Card>
    </div>
  );
};
