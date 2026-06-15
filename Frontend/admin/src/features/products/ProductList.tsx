import React from 'react';
import { ProductModal } from './components/ProductModal';
import { ProductDetailView } from './components/ProductDetailView';
import { productService, type Product } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import { BaseManagement } from '../common/BaseManagement';
import { useQuery } from '@tanstack/react-query';
import { OrderedListOutlined, ExperimentOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Button, Tag, Tabs } from 'antd';
import { ProductVariantModal } from '@/features/products/components/ProductVariantModal';
import { ProductStockEstimateTab } from './components/ProductStockEstimateTab';

const ProductList: React.FC = () => {
  // Fetch Categories for display in table and modal
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAllCategories({ size: 100 }), // Lấy đủ để làm filter
  });

  const categories = (Array.isArray(categoriesData) ? categoriesData : ((categoriesData as any)?.data || []))
    .filter((c: any) => !(c.isDeleted || c.deleted || c.deletedAt));

  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">HÌNH ẢNH</span>,
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imgUrl: string) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100 flex items-center justify-center">
          {imgUrl ? (
            <img src={imgUrl} alt="product" className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-300 text-[10px] font-black uppercase text-center px-1">No Image</div>
          )}
        </div>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TÊN SẢN PHẨM</span>,
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Product) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm uppercase tracking-tight ${(record as any).isDeleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
              {text}
            </span>
            {(record as any).isDeleted && (
              <Tag color="error" className="text-[9px] font-black uppercase px-1.5 py-0 border-none rounded-sm">Đã xóa</Tag>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-medium line-clamp-1 max-w-[200px]">{record.description || 'Không có mô tả'}</p>
        </div>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">DANH MỤC</span>,
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 130,
      render: (catId: string) => {
        const category = (categories as any[]).find((c: any) => c.id === catId);
        return <Tag className="border-none rounded-lg font-bold text-gray-600 bg-gray-100">{category?.name || 'Chưa phân loại'}</Tag>;
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">GIÁ BÁN</span>,
      key: 'price',
      width: 130,
      render: (_: any, record: Product) => {
        const variants = record.variants || [];
        if (variants.length === 0) return <span className="text-gray-300 text-xs italic">Chưa có giá</span>;
        const minPrice = Math.min(...variants.map(v => v.price));
        return (
          <span className="font-black text-[#d37533] text-sm">
            Từ {minPrice.toLocaleString('vi-VN')}đ
          </span>
        );
      }
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">TRẠNG THÁI</span>,
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      width: 120,
      render: (isAvailable: boolean, record: Product) => {
        const isDeleted = (record as any).isDeleted || (record as any).deleted || (record as any).deletedAt;
        if (isDeleted) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold border border-red-200 bg-red-50 text-red-600 whitespace-nowrap inline-block">
              ĐÃ XÓA
            </span>
          );
        }
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-block ${isAvailable ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {isAvailable ? 'ĐANG BÁN' : 'NGỪNG BÁN'}
          </span>
        );
      },
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest text-center block">CẤU HÌNH</span>,
      key: 'variants',
      width: 150,
      render: (_: any, record: Product) => (
        <Button
          icon={<OrderedListOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setVariantProduct(record);
            setIsVariantModalOpen(true);
          }}
          className="rounded-xl border-amber-200 text-amber-600 font-bold text-[10px] uppercase hover:bg-amber-50"
        >
          Quản lý Size
        </Button>
      )
    }
  ];

  const [isVariantModalOpen, setIsVariantModalOpen] = React.useState(false);
  const [variantProduct, setVariantProduct] = React.useState<Product | null>(null);



  const renderDetail = (viewingProduct: Product) => (
    <ProductDetailView product={viewingProduct} categories={categories} />
  );

  return (
    <>
      <Tabs
        defaultActiveKey="management"
        size="large"
        className="custom-main-tabs"
        items={[
          {
            key: 'management',
            label: (
              <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                <AppstoreOutlined className="text-orange-500" />
                Quản lý Sản phẩm
              </span>
            ),
            children: (
              <>
                <BaseManagement<Product>
                  title="Kho Hàng Sản Phẩm"
                  description="Quản lý các món ăn, thức uống và cập nhật giá"
                  addButtonText="Thêm sản phẩm mới"
                  entityName="Sản phẩm"
                  queryKey="products"
                  service={{
                    getAll: productService.getAllProducts,
                    getById: productService.getProductById,
                    create: productService.createProduct,
                    update: productService.updateProduct,
                    delete: productService.deleteProduct,
                    restore: productService.restoreProduct
                  }}
                  extraFilters={{
                    categories: (categories as any[]).map((c: any) => ({ id: c.id, name: c.name })),
                    showStatusFilter: true,
                    showFeaturedFilter: true,
                    showDeletedFilter: true
                  }}
                  columns={columns}
                  ModalComponent={ProductModal}
                  renderDetail={renderDetail}
                  formatSaveValues={(values) => {
                    const formatted = {
                      ...values,
                      displayOrder: Number(values.displayOrder || 0),
                      toppingIds: values.toppingIds || [],
                    };

                    console.log('[DEBUG] Formatted Payload:', formatted);

                    // Khi cập nhật (có ID), loại bỏ variants để tránh lỗi trùng lặp
                    if (values.id) {
                      delete (formatted as any).variants;
                    }
                    return formatted;
                  }}
                  modalExtraProps={{ categories }}
                />

                {isVariantModalOpen && variantProduct && (
                  <ProductVariantModal
                    isOpen={isVariantModalOpen}
                    onClose={() => {
                      setIsVariantModalOpen(false);
                      setVariantProduct(null);
                    }}
                    product={variantProduct}
                  />
                )}
              </>
            ),
          },
          {
            key: 'stock-estimate',
            label: (
              <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                <ExperimentOutlined className="text-amber-500" />
                Ước tính Sản lượng
              </span>
            ),
            children: <ProductStockEstimateTab />,
          },
        ]}
      />
    </>
  );
};

export default ProductList;
