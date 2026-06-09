// 📄 Vị trí file: src/features/ingredients/components/RecipeListTab.tsx
import React, { useState } from 'react';
import { Table, Button, Input, Tag, Spin, Card } from 'antd';
import { EditOutlined, SearchOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useQuery, useQueries } from '@tanstack/react-query';
import { recipeService } from '../../../services/recipe.service';
import { productService } from '../../../services/product.service';
import { ingredientService } from '../../../services/ingredient.service';
import { RecipeModal } from '../../products/components/RecipeModal';
import { RecipeViewModal } from './RecipeViewModal';

export const RecipeListTab: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{ variantId: string; variantLabel: string } | null>(null);

  // 1. Fetch tất cả công thức
  const { data: recipesRes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['recipes', 'all'],
    queryFn: () => recipeService.getAllRecipes({ size: 1000 }),
  });

  const recipes = React.useMemo(() => {
    if (!recipesRes) return [];
    return recipesRes.data && Array.isArray(recipesRes.data)
      ? recipesRes.data
      : (recipesRes.content || recipesRes.results || (Array.isArray(recipesRes) ? recipesRes : []));
  }, [recipesRes]);

  // 2. Fetch tất cả sản phẩm để map tên
  const { data: productsRes, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'all-for-recipes'],
    queryFn: () => productService.getAllProducts({ size: 1000 }),
  });

  const products = React.useMemo(() => {
    if (!productsRes) return [];
    const prodData = (productsRes as any).data || (productsRes as any).content || (productsRes as any).results || (Array.isArray(productsRes) ? productsRes : []);
    return Array.isArray(prodData) ? prodData : [];
  }, [productsRes]);

  // Lấy danh sách productId duy nhất từ recipes
  const uniqueProductIds = React.useMemo(() => {
    return [...new Set<string>(recipes.map((r: any) => r.productId as string))];
  }, [recipes]);

  // Fetch variants của từng product riêng lẻ để đảm bảo có đủ dữ liệu kích thước
  const variantQueries = useQueries({
    queries: uniqueProductIds.map((productId) => ({
      queryKey: ['variants', productId],
      queryFn: () => productService.getVariants(productId),
      enabled: uniqueProductIds.length > 0,
    }))
  });


  const isLoadingVariants = variantQueries.some((q) => q.isLoading);

  const productActiveVariantsMap = React.useMemo(() => {
    const map = new Map<string, any[]>();
    uniqueProductIds.forEach((productId, idx) => {
      const q = variantQueries[idx];
      if (q && q.data) {
        const variants = Array.isArray(q.data) ? q.data : ((q.data as any)?.data || []);
        map.set(productId, variants);
      }
    });
    return map;
  }, [uniqueProductIds, variantQueries]);

  // 3. Fetch tất cả nguyên liệu để map tên
  const { data: ingredientsRes, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['ingredients', 'all-for-recipes'],
    queryFn: () => ingredientService.getAllIngredients({ size: 1000 }),
  });

  const ingredients = React.useMemo(() => {
    if (!ingredientsRes) return [];
    return ingredientsRes.data && Array.isArray(ingredientsRes.data)
      ? ingredientsRes.data
      : (ingredientsRes.content || ingredientsRes.results || (Array.isArray(ingredientsRes) ? ingredientsRes : []));
  }, [ingredientsRes]);

  const ingredientMap = React.useMemo(() => {
    const map = new Map<string, any>();
    ingredients.forEach((ing: any) => {
      map.set(ing.id, ing);
    });
    return map;
  }, [ingredients]);

  // Build recipeMap: productId -> list of recipes
  const recipesByProduct = React.useMemo(() => {
    const map: { [productId: string]: any[] } = {};
    recipes.forEach((rec: any) => {
      if (!map[rec.productId]) map[rec.productId] = [];
      map[rec.productId].push(rec);
    });
    return map;
  }, [recipes]);

  // Xây danh sách từ TẤT CẢ sản phẩm, không chỉ sản phẩm có công thức
  const groupedRecipes = React.useMemo(() => {
    return products
      .filter((prod: any) => prod.name.toLowerCase().includes(searchText.toLowerCase()))
      .map((prod: any) => ({
        productId: prod.id,
        productName: prod.name,
        recipes: recipesByProduct[prod.id] || []
      }));
  }, [products, recipesByProduct, searchText]);

  const selectedProductGroup = React.useMemo(() => {
    if (!selectedProductId) return null;
    return groupedRecipes.find((g) => g.productId === selectedProductId) || null;
  }, [groupedRecipes, selectedProductId]);

  // Cấu hình cột bảng
  const columns = [
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">SẢN PHẨM</span>,
      key: 'product',
      width: 200,
      render: (_: any, record: any) => (
        <span className="font-bold text-gray-800 text-sm">{record.productName}</span>
      )
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest">CÔNG THỨC THEO KÍCH THƯỚC</span>,
      key: 'recipes-summary',
      render: (_: any, record: any) => {
        const activeVariants = productActiveVariantsMap.get(record.productId) || [];
        if (activeVariants.length === 0) {
          return <span className="text-gray-300 italic text-xs">Chưa có kích thước</span>;
        }
        return (
          <div className="flex flex-col divide-y divide-gray-100">
            {activeVariants.map((v: any) => {
              const rec = record.recipes.find((r: any) => r.variantId === v.id);
              const recipeIngs = rec?.ingredients || [];
              return (
                <div key={v.id} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
                  {/* Size badge */}
                  <Tag
                    color={rec ? 'orange' : 'default'}
                    className="border-none rounded-lg font-black uppercase text-[10px] px-2 py-0.5 shrink-0 mt-0.5"
                  >
                    {v.sizeLabel || 'Mặc định'}
                  </Tag>

                  {/* Nguyên liệu */}
                  <div className="flex flex-wrap gap-1">
                    {!rec ? (
                      <span className="text-gray-300 italic text-[11px]">Chưa cấu hình công thức</span>
                    ) : recipeIngs.length === 0 ? (
                      <span className="text-gray-300 italic text-[11px]">Chưa có nguyên liệu</span>
                    ) : (
                      recipeIngs.map((item: any, idx: number) => {
                        const ing = ingredientMap.get(item.ingredientId);
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-gray-100/80 text-gray-700 px-2 py-0.5 rounded-lg text-[11px] font-semibold border border-gray-100"
                          >
                            {ing?.name || 'Nguyên liệu'}
                            <span className="text-amber-600 font-bold">
                              {item.quantity}{ing?.unit ? ` ${ing.unit}` : ''}
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    },
    {
      title: <span className="font-black text-gray-500 text-[11px] uppercase tracking-widest text-center block">HÀNH ĐỘNG</span>,
      key: 'actions',
      width: 140,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedProductId(record.productId);
            setSelectedProductName(record.productName);
            setIsViewModalOpen(true);
          }}
          className="rounded-xl border-amber-200 text-amber-600 font-bold text-[10px] uppercase hover:bg-amber-50 hover:border-amber-400"
        >
          Xem công thức
        </Button>
      )
    }
  ];

  const isLoading = isLoadingRecipes || isLoadingProducts || isLoadingIngredients || isLoadingVariants;

  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white p-2">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="text-base font-black uppercase text-gray-800 flex items-center gap-2">
              <ExperimentOutlined className="text-amber-500" />
              Công thức pha chế
            </h4>
            <p className="text-xs text-gray-400 font-medium">Danh sách các nguyên liệu cần thiết cho mỗi loại thức uống được gộp theo sản phẩm và chia theo kích thước</p>
          </div>

          <Input
            placeholder="Tìm theo tên sản phẩm..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-[300px] rounded-xl border-gray-200 h-10 font-medium"
          />
        </div>

        <Spin spinning={isLoading}>
          <Table
            dataSource={groupedRecipes}
            columns={columns}
            rowKey={(record) => record.productId}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              className: 'custom-table-pagination font-bold',
            }}
            className="custom-table"
          />
        </Spin>
      </div>

      {isViewModalOpen && selectedProductGroup && (
        <RecipeViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedProductId(null);
            setSelectedProductName('');
          }}
          productId={selectedProductGroup.productId}
          productName={selectedProductGroup.productName}
          recipes={selectedProductGroup.recipes}
          ingredientMap={ingredientMap}
          onEditRecipe={(variantId, variantLabel) => {
            setIsViewModalOpen(false);
            setEditingVariant({ variantId, variantLabel });
            setIsEditModalOpen(true);
          }}
        />
      )}

      {isEditModalOpen && selectedProductId && editingVariant && (
        <RecipeModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingVariant(null);
            // Reopen view modal
            setIsViewModalOpen(true);
          }}
          productId={selectedProductId}
          variantId={editingVariant.variantId}
          productName={selectedProductName}
          variantLabel={editingVariant.variantLabel}
        />
      )}
    </Card>
  );
};
