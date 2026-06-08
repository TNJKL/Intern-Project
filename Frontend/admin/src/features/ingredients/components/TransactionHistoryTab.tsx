import React, { useState } from 'react';
import { Table, Tag, Space, Select, Card } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { ingredientService } from '@/services/ingredient.service';

export const TransactionHistoryTab: React.FC = () => {
  const [txPage, setTxPage] = useState(0);
  const [txSize, setTxSize] = useState(10);
  const [txType, setTxType] = useState<string | undefined>(undefined);

  const { data: txRes, isLoading: isTxLoading } = useQuery({
    queryKey: ['inventory', 'transactions', txPage, txSize, txType],
    queryFn: () =>
      ingredientService.getInventoryTransactions({
        page: txPage,
        size: txSize,
        transactionType: txType,
        sort: 'createdAt,desc',
      }),
  });

  const txRecords = txRes?.data || txRes?.records || (Array.isArray(txRes) ? txRes : []);
  const txTotal = txRes?.totalElements || txRes?.total || 0;

  const txColumns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">THỜI GIAN</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => <span className="text-gray-600 font-medium">{date ? new Date(date).toLocaleString('vi-VN') : ''}</span>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">LOẠI</span>,
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 120,
      render: (type: string) => {
        let color = 'default';
        let text = type;
        if (type === 'RESTOCK' || type === 'IN') {
          color = 'success';
          text = 'Nhập kho';
        }
        if (type === 'USAGE' || type === 'OUT') {
          color = 'error';
          text = 'Xuất kho';
        }
        return <Tag color={color} className="font-bold">{text}</Tag>;
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">SỐ LƯỢNG</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center' as const,
      render: (qty: number) => <span className="font-black text-gray-800">{qty > 0 ? `+${qty}` : qty}</span>,
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">NGUYÊN LIỆU</span>,
      key: 'ingredient',
      render: (_: any, record: any) => {
        const id = record.ingredientId || record.toppingId;
        const name = record.ingredientName || record.toppingName;
        return name ? (
          <Space orientation="vertical" size={0}>
            <span className="font-bold text-gray-800">{name}</span>
            {id && <code className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded">{id}</code>}
          </Space>
        ) : id ? (
          <code className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">{id}</code>
        ) : (
          <span>-</span>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">MÃ ĐƠN HÀNG</span>,
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId: string, record: any) => {
        const refId = orderId || record.referenceId;
        return refId ? <code className="text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded">{refId}</code> : <span>-</span>;
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">GHI CHÚ</span>,
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => <span className="text-gray-600">{note || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <Space>
          <span className="font-bold text-gray-700">Lọc theo loại:</span>
          <Select
            allowClear
            placeholder="Tất cả"
            value={txType}
            onChange={(val) => {
              setTxPage(0);
              setTxType(val);
            }}
            style={{ width: 150 }}
            options={[
              { value: 'RESTOCK', label: 'Nhập kho' },
              { value: 'USAGE', label: 'Xuất kho' },
            ]}
          />
        </Space>
      </div>
      <Card
        variant="borderless"
        className="rounded-[20px] sm:rounded-[32px] shadow-sm border border-gray-100 p-1 sm:p-2 overflow-hidden"
        styles={{ body: { padding: '24px' } }}
      >
        <Table
          columns={txColumns}
          dataSource={txRecords}
          rowKey={(record: any) => record.id || Math.random().toString()}
          loading={isTxLoading}
          pagination={{
            current: txPage + 1,
            pageSize: txSize,
            total: txTotal,
            showSizeChanger: true,
            className: 'custom-pagination',
            onChange: (page, size) => {
              setTxPage(page - 1);
              setTxSize(size);
            },
          }}
          className="custom-admin-table"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <div className="py-12 text-center text-gray-400 font-bold">Không có dữ liệu giao dịch!</div> }}
        />
      </Card>
    </div>
  );
};
