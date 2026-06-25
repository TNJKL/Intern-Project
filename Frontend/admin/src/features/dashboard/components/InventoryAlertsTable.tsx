import React from 'react';
import { Table } from 'antd';
import type { IngredientAlert } from '../DashboardOverview';

interface InventoryAlertsTableProps {
  alertIngredients: IngredientAlert[];
  criticalStockCount: number | undefined;
  lowStockCount: number | undefined;
}

export const InventoryAlertsTable: React.FC<InventoryAlertsTableProps> = ({
  alertIngredients,
  criticalStockCount,
  lowStockCount,
}) => {
  const alertColumns = [
    {
      title: 'TÊN NGUYÊN LIỆU',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-bold text-gray-800">{text}</span>,
    },
    {
      title: 'MÃ SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (text: string) => <span className="font-mono text-xs text-gray-500">{text}</span>,
    },
    {
      title: 'TỒN HIỆN TẠI',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number, record: IngredientAlert) => (
        <span className="font-bold text-gray-700">
          {stock} {record.unit}
        </span>
      ),
    },
    {
      title: 'NGƯỠNG BÁO ĐỘNG',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      render: (threshold: number, record: IngredientAlert) => (
        <span className="text-gray-500">
          {threshold} {record.unit}
        </span>
      ),
    },
    {
      title: 'MỨC ĐỘ',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        let classes = 'bg-yellow-50 text-yellow-600 border-yellow-200';
        let text = 'CẢNH BÁO';
        if (level === 'CRITICAL') {
          classes = 'bg-red-50 text-red-600 border-red-200 animate-pulse';
          text = 'NGUY CẤP';
        }
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${classes}`}>
            {text}
          </span>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2 flex-wrap">
            <span>Cảnh báo tồn kho nguyên liệu</span>
            {criticalStockCount !== undefined && (
              <span className="bg-red-50 text-red-500 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                <span>{criticalStockCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Nguy cấp</span>
              </span>
            )}
            {lowStockCount !== undefined && (
              <span className="bg-yellow-50 text-yellow-600 text-xs font-black px-2.5 py-0.5 rounded-full border border-yellow-100 flex items-center gap-1">
                <span>{lowStockCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Cảnh báo</span>
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 font-medium">Danh sách các nguyên liệu dưới ngưỡng an toàn cần nhập thêm</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table
          columns={alertColumns}
          dataSource={alertIngredients.map((item, idx) => ({ ...item, key: item.sku || idx.toString() }))}
          pagination={{ pageSize: 5 }}
          className="custom-admin-table"
          rowClassName="hover:bg-gray-50 transition-colors cursor-pointer"
          locale={{ emptyText: 'Tất cả nguyên liệu đều ở mức an toàn!' }}
        />
      </div>
    </div>
  );
};
export default InventoryAlertsTable;
