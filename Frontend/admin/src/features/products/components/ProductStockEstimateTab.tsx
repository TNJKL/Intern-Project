// 📄 Vị trí file: src/features/products/components/ProductStockEstimateTab.tsx
import React, { useState } from 'react';
import { Table, Input, Tag, Spin, Card, Tooltip } from 'antd';
import { SearchOutlined, ExperimentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useQuery, useQueries } from '@tanstack/react-query';
import { productService } from '../../../services/product.service';
import { ingredientService } from '../../../services/ingredient.service';

interface EstimateRow {
  key: string;
  productId: string;
  variantId: string | null;
  productName: string;
  imageUrl?: string;
  sizeLabel: string;
  estimate: number | null;
  isLoading: boolean;
  isError: boolean;
}

const getStatusConfig = (estimate: number | null) => {
  if (estimate === null) return { color: 'default', text: 'Chưa có dữ liệu', bg: 'bg-gray-100', textColor: 'text-gray-400' };
  if (estimate <= 0) return { color: 'error', text: 'Hết nguyên liệu', bg: 'bg-red-50', textColor: 'text-red-600' };
  if (estimate <= 5) return { color: 'warning', text: 'Sắp hết', bg: 'bg-amber-50', textColor: 'text-amber-600' };
  if (estimate <= 20) return { color: 'processing', text: 'Còn ít', bg: 'bg-blue-50', textColor: 'text-blue-600' };
  return { color: 'success', text: 'Dồi dào', bg: 'bg-green-50', textColor: 'text-green-600' };
};

export const ProductStockEstimateTab: React.FC = () => {
  const [searchText, setSearchText] = useState('');

  // 1. Fetch tất cả sản phẩm kèm variants
  const { data: productsRes, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'all-for-estimate'],
    queryFn: () => productService.getAllProducts({ size: 1000 }),
  });

  const products = React.useMemo(() => {
    if (!productsRes) return [];
    const raw = (productsRes as any).data ?? (productsRes as any).content ?? (Array.isArray(productsRes) ? productsRes : []);
    return Array.isArray(raw) ? raw : [];
  }, [productsRes]);

  // 2. Xây dựng danh sách (productId, variantId) cần ước tính
  const estimatePairs = React.useMemo<{ productId: string; variantId: string | null; productName: string; imageUrl?: string; sizeLabel: string }[]>(() => {
    const pairs: { productId: string; variantId: string | null; productName: string; imageUrl?: string; sizeLabel: string }[] = [];
    for (const prod of products) {
      const variants = prod.variants ?? [];
      if (variants.length === 0) {
        // Sản phẩm không có variant: vẫn thử với variantId = null
        pairs.push({ productId: prod.id, variantId: null, productName: prod.name, imageUrl: prod.imageUrl, sizeLabel: 'Mặc định' });
      } else {
        for (const v of variants) {
          pairs.push({ productId: prod.id, variantId: v.id, productName: prod.name, imageUrl: prod.imageUrl, sizeLabel: v.sizeLabel || 'Mặc định' });
        }
      }
    }
    return pairs;
  }, [products]);

  // 3. Gọi song song API ước tính cho tất cả cặp (productId, variantId)
  const estimateQueries = useQueries({
    queries: estimatePairs.map((pair) => ({
      queryKey: ['stock-estimate', pair.productId, pair.variantId],
      queryFn: () => ingredientService.getStockByProductVariant(pair.productId, pair.variantId),
      enabled: estimatePairs.length > 0,
      retry: false,
    })),
  });

  // 4. Kết hợp dữ liệu thành các hàng bảng
  // QUAN TRỌNG: map theo index gốc của estimatePairs (khớp với estimateQueries), sau đó mới filter
  const rows = React.useMemo<EstimateRow[]>(() => {
    return estimatePairs
      .map((pair, idx) => {
        const q = estimateQueries[idx];
        let estimate: number | null = null;
        if (q?.data !== undefined && q?.data !== null) {
          // API trả về số nguyên hoặc object có nhiều dạng cấu trúc
          const d = q.data;
          estimate =
            typeof d === 'number'
              ? d
              : (d?.estimatedServings ?? d?.servings ?? d?.maxServings ?? d?.quantity ?? null);
        }
        return {
          key: `${pair.productId}-${pair.variantId ?? 'null'}`,
          productId: pair.productId,
          variantId: pair.variantId,
          productName: pair.productName,
          imageUrl: pair.imageUrl,
          sizeLabel: pair.sizeLabel,
          estimate,
          isLoading: q?.isLoading ?? false,
          isError: q?.isError ?? false,
        };
      })
      // Filter SAU KHI đã map để không làm lệch index với estimateQueries
      .filter((row) => row.productName.toLowerCase().includes(searchText.toLowerCase()));
  }, [estimatePairs, estimateQueries, searchText]);

  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Sản phẩm</span>,
      key: 'product',
      width: 240,
      render: (_: any, record: EstimateRow) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
            {record.imageUrl ? (
              <img src={record.imageUrl} alt={record.productName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[8px] text-gray-300 font-bold uppercase text-center">No img</span>
            )}
          </div>
          <span className="font-bold text-gray-800 text-sm leading-tight">{record.productName}</span>
        </div>
      ),
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Kích cỡ</span>,
      key: 'size',
      width: 110,
      render: (_: any, record: EstimateRow) => (
        <Tag className="border-none rounded-lg font-black uppercase text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600">
          {record.sizeLabel}
        </Tag>
      ),
    },
    {
      title: (
        <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest flex items-center gap-1">
          Số ly ước tính
          <Tooltip title="Số lượng ly tối đa có thể pha chế với lượng nguyên liệu đang có trong kho">
            <InfoCircleOutlined className="text-gray-400 cursor-help" />
          </Tooltip>
        </span>
      ),
      key: 'estimate',
      width: 160,
      align: 'center' as const,
      render: (_: any, record: EstimateRow) => {
        if (record.isLoading) return <Spin size="small" />;
        if (record.isError) return <span className="text-xs text-gray-300 italic">Chưa cấu hình CT</span>;
        if (record.estimate === null) return <span className="text-xs text-gray-300 italic">—</span>;
        const { bg, textColor } = getStatusConfig(record.estimate);
        return (
          <div className={`inline-flex items-center justify-center gap-1 ${bg} ${textColor} px-3 py-1 rounded-xl font-black text-base min-w-[64px]`}>
            <ExperimentOutlined className="text-sm opacity-70" />
            {record.estimate}
            <span className="text-[10px] font-bold opacity-70">ly</span>
          </div>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">Trạng thái</span>,
      key: 'status',
      width: 140,
      align: 'center' as const,
      render: (_: any, record: EstimateRow) => {
        if (record.isLoading) return null;
        if (record.isError) return null;
        const { color, text } = getStatusConfig(record.estimate);
        return (
          <Tag
            color={color}
            className="border-none rounded-full font-bold text-[11px] px-3 py-0.5"
          >
            {text}
          </Tag>
        );
      },
    },
  ];

  const isLoading = isLoadingProducts || estimateQueries.some((q) => q.isLoading);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
        <div>
          <h4 className="text-sm font-black uppercase text-gray-800 flex items-center gap-2">
            <ExperimentOutlined className="text-amber-500" />
            Ước tính Sản lượng Pha chế
          </h4>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Dự báo số lượng ly tối đa có thể pha được với nguyên liệu tồn kho hiện tại
          </p>
        </div>
        <Input
          placeholder="Tìm theo tên sản phẩm..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-[280px] rounded-xl border-gray-200 h-10 font-medium"
        />
      </div>

      <Card
        variant="borderless"
        className="rounded-[20px] shadow-sm border border-gray-100 p-1 overflow-hidden"
        styles={{ body: { padding: '16px' } }}
      >
        <Spin spinning={isLoading && rows.length === 0}>
          <Table
            dataSource={rows}
            columns={columns}
            rowKey="key"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => <span className="text-xs text-gray-400 font-medium">Tổng {total} biến thể</span>,
              className: 'custom-table-pagination font-bold',
            }}
            className="custom-table"
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <div className="py-12 text-center text-gray-400 font-bold">
                  Không có dữ liệu sản phẩm
                </div>
              ),
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};
