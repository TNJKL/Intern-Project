import React, { useState } from 'react';
import { Table, Tag, Button, Card, Alert, Space, Typography, Tooltip } from 'antd';
import { PlusSquareOutlined, WarningOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ingredientService } from '@/services/ingredient.service';
import { RestockModal } from '@/features/ingredients/components/RestockModal';

const { Title, Paragraph } = Typography;

const alertConfig: Record<string, { label: string; color: string; icon: string }> = {
  LOW: {
    label: 'Sắp hết hàng',
    color: 'orange',
    icon: '⚠️',
  },
  CRITICAL: {
    label: 'Nguy hiểm',
    color: 'red',
    icon: '🔴',
  },
  OUT_OF_STOCK: {
    label: 'Hết hàng',
    color: 'default',
    icon: '⛔',
  },
};

const IngredientAlerts: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);

  // 1. Fetch danh sách cảnh báo tồn kho từ Backend
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['ingredients', 'alerts'],
    queryFn: () => ingredientService.getIngredientAlerts(),
  });

  const alertList = Array.isArray(alerts) ? alerts : [];

  const handleOpenRestock = (record: any) => {
    setSelectedIngredient(record);
    setIsRestockOpen(true);
  };

  const handleRestockSuccess = () => {
    setIsRestockOpen(false);
    // Invalidate và refetch các truy vấn liên quan đến cảnh báo
    queryClient.invalidateQueries({ queryKey: ['ingredients', 'alerts'] });
    queryClient.invalidateQueries({ queryKey: ['ingredients', 'alerts-count'] });
    queryClient.invalidateQueries({ queryKey: ['ingredients', 'low-stock'] });
    refetch();
  };

  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Tên nguyên liệu</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space direction="vertical" size={0}>
          <span className="font-bold text-gray-800 text-sm">{name}</span>
          <span className="text-[10px] text-gray-400 font-mono">SKU: {record.sku}</span>
        </Space>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Mức độ</span>,
      dataIndex: 'alertLevel',
      key: 'alertLevel',
      align: 'center' as const,
      render: (level: string) => {
        const conf = alertConfig[level] || { label: level, color: 'default', icon: '🔔' };
        return (
          <Tag color={conf.color} className="border-none rounded-lg font-bold px-3 py-1 text-xs">
            {conf.icon} {conf.label.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Tồn kho hiện tại</span>,
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'center' as const,
      render: (stock: number, record: any) => {
        const color = record.alertLevel === 'OUT_OF_STOCK' 
          ? 'text-red-700 font-black' 
          : record.alertLevel === 'CRITICAL' 
            ? 'text-red-500 font-bold' 
            : 'text-amber-600 font-semibold';
        return (
          <span className={`text-sm ${color}`}>
            {stock.toLocaleString('vi-VN')} {record.unit}
          </span>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Ngưỡng cảnh báo</span>,
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      align: 'center' as const,
      render: (threshold: number, record: any) => (
        <span className="text-sm font-semibold text-gray-600">
          {threshold.toLocaleString('vi-VN')} {record.unit}
        </span>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Ngưỡng nguy hiểm (CRITICAL)</span>,
      dataIndex: 'criticalAbsolute',
      key: 'criticalAbsolute',
      align: 'center' as const,
      render: (critical: number, record: any) => (
        <Tooltip title={`Bằng ${record.criticalStockThresholdPct || 5}% ngưỡng cảnh báo`}>
          <span className="text-sm font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">
            {critical ? critical.toLocaleString('vi-VN') : 0} {record.unit}
          </span>
        </Tooltip>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Gửi cảnh báo lúc</span>,
      dataIndex: 'lowStockAlertSentAt',
      key: 'lowStockAlertSentAt',
      align: 'center' as const,
      render: (sentAt: string) => (
        <span className="text-xs text-gray-500">
          {sentAt ? new Date(sentAt).toLocaleString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Nhập kho</span>,
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusSquareOutlined />}
          onClick={() => handleOpenRestock(record)}
          className="bg-orange-500 hover:bg-orange-600 border-none font-bold text-xs rounded-lg h-8 px-4"
        >
          Nhập kho
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header điều hướng */}
      <div className="flex items-center justify-between">
        <Space size="middle">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/ingredients')}
            className="text-gray-500 hover:text-orange-500"
          />
          <div>
            <Title level={4} style={{ margin: 0, fontFamily: "'Quicksand', sans-serif" }} className="font-black text-gray-800 uppercase tracking-tight">
              Cảnh báo tồn kho
            </Title>
            <Paragraph style={{ margin: 0 }} className="text-xs text-gray-400">
              Danh sách nguyên liệu và topping chạm ngưỡng cảnh báo, cần nhập kho gấp
            </Paragraph>
          </div>
        </Space>
      </div>

      {/* Alert tổng quát */}
      {alertList.length > 0 ? (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined className="text-red-500" />}
          message={
            <span className="font-bold text-red-800 text-sm">
              Có {alertList.length} nguyên liệu đang chạm ngưỡng cảnh báo hoặc đã hết hàng. Hãy xử lý nhập kho bổ sung!
            </span>
          }
          className="rounded-2xl border-red-200 bg-red-50/50"
        />
      ) : (
        <Alert
          type="success"
          showIcon
          message={
            <span className="font-bold text-green-800 text-sm">
              Tuyệt vời! Kho hàng hiện tại đang ở trạng thái an toàn, không có nguyên liệu nào chạm ngưỡng cảnh báo.
            </span>
          }
          className="rounded-2xl border-green-200 bg-green-50/50"
        />
      )}

      {/* Bảng chi tiết */}
      <Card
        variant="borderless"
        className="rounded-[24px] shadow-sm border border-gray-100 overflow-hidden"
        styles={{ body: { padding: '24px' } }}
      >
        <Table
          columns={columns}
          dataSource={alertList}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          className="custom-admin-table"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <div className="py-12 text-center text-gray-400 font-bold">Không có cảnh báo tồn kho nào!</div> }}
          rowClassName={(record) => 
            record.alertLevel === 'OUT_OF_STOCK' 
              ? 'bg-red-50/20' 
              : record.alertLevel === 'CRITICAL' 
                ? 'bg-red-50/10' 
                : 'bg-orange-50/5'
          }
        />
      </Card>

      {/* Modal Nhập kho nhanh */}
      <RestockModal
        open={isRestockOpen}
        ingredient={selectedIngredient}
        onCancel={() => setIsRestockOpen(false)}
        onSuccess={handleRestockSuccess}
      />
    </div>
  );
};

export default IngredientAlerts;
