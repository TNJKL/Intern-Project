import React, { useState, useEffect } from 'react';
import { Modal, Button, Tag, Tabs, Empty } from 'antd';
import { ExperimentOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../../services/product.service';

interface RecipeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  recipes: any[];
  ingredientMap: Map<string, any>;
  onEditRecipe: (variantId: string, variantLabel: string) => void;
}

export const RecipeViewModal: React.FC<RecipeViewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  recipes,
  ingredientMap,
  onEditRecipe
}) => {
  const [activeVariantId, setActiveVariantId] = useState<string>('');

  // 1. Fetch danh sách variants của sản phẩm đang hoạt động từ backend
  const { data: variantsRes, isLoading: isLoadingVariants } = useQuery({
    queryKey: ['variants', productId],
    queryFn: () => productService.getVariants(productId),
    enabled: isOpen && !!productId
  });

  const variants = React.useMemo(() => {
    if (!variantsRes) return [];
    return Array.isArray(variantsRes) ? variantsRes : ((variantsRes as any)?.data || []);
  }, [variantsRes]);

  // Thiết lập active tab khi mở modal
  useEffect(() => {
    if (isOpen && variants.length > 0 && !activeVariantId) {
      setActiveVariantId(variants[0].id);
    }
  }, [isOpen, variants, activeVariantId]);

  // Reset khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setActiveVariantId('');
    }
  }, [isOpen]);

  const activeRecipe = recipes.find((r) => r.variantId === activeVariantId);
  const activeVariant = variants.find((v) => v.id === activeVariantId);
  const activeVariantLabel = activeVariant?.sizeLabel || 'Mặc định';

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <ExperimentOutlined className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-gray-800 leading-none">Chi tiết Công thức</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Sản phẩm: {productName}
            </p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="rounded-xl font-bold h-11 border-gray-200 px-6">
          Đóng
        </Button>,
        activeRecipe && activeVariant && (
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              onEditRecipe(activeVariantId, activeVariantLabel);
            }}
            className="rounded-xl font-bold h-11 bg-amber-500 hover:bg-amber-600 border-none shadow-sm shadow-amber-200"
          >
            Chỉnh sửa công thức (Size {activeVariantLabel})
          </Button>
        )
      ]}
      centered
      width={600}
      styles={{
        mask: { backdropFilter: 'blur(4px)' },
        body: { padding: '20px 24px' }
      }}
    >
      {isLoadingVariants ? (
        <div className="text-center py-12 text-gray-400 font-bold">
          Đang tải danh sách kích thước...
        </div>
      ) : variants.length === 0 ? (
        <Empty description="Sản phẩm này chưa được cấu hình kích thước" className="my-8" />
      ) : (
        <div>
          <Tabs
            activeKey={activeVariantId}
            onChange={(key) => setActiveVariantId(key)}
            className="font-bold custom-view-tabs mb-6"
            items={variants.map((v) => ({
              key: v.id,
              label: `Size ${v.sizeLabel || 'Mặc định'}`,
            }))}
          />

          {!activeRecipe ? (
            <div className="bg-gray-50/50 rounded-2xl p-8 border border-gray-100 text-center">
              <Empty
                description={`Kích thước Size ${activeVariantLabel} chưa có công thức pha chế`}
                className="mb-4"
              />
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => onEditRecipe(activeVariantId, activeVariantLabel)}
                className="rounded-xl font-bold h-11 bg-amber-500 hover:bg-amber-600 border-none shadow-sm shadow-amber-200"
              >
                Tạo công thức ngay
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <FileTextOutlined className="text-amber-500" />
                  Phiên bản công thức
                </span>
                <span className="font-bold text-gray-700 font-mono bg-white px-2.5 py-1 rounded-lg border border-gray-150 text-xs">
                  v{activeRecipe.version || 1}
                </span>
              </div>

              <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                Thành phần nguyên liệu
              </div>

              {(!activeRecipe.ingredients || activeRecipe.ingredients.length === 0) ? (
                <div className="text-gray-300 text-xs italic py-2">Không có nguyên liệu nào trong công thức</div>
              ) : (
                <div className="space-y-2">
                  {activeRecipe.ingredients.map((item: any, idx: number) => {
                    const ing = ingredientMap.get(item.ingredientId);
                    return (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-700 text-xs">{ing?.name || 'Nguyên liệu không rõ'}</span>
                        <Tag color="orange" className="border-none rounded-lg font-black text-xs px-2.5 py-0.5">
                          {item.quantity} {ing?.unit || ''}
                        </Tag>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
