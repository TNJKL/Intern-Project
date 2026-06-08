// 📄 Vị trí file: src/features/products/components/RecipeModal.tsx
import React, { useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, Divider, Spin } from 'antd';
import { ExperimentOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { message } from '@/lib/antd';
import { recipeService, type Recipe } from '../../../services/recipe.service';
import { ingredientService } from '../../../services/ingredient.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  productId,
  variantId,
  productName,
  variantLabel
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 1. Fetch toàn bộ danh sách nguyên liệu hoạt động để chọn
  const { data: ingredientsRes, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['ingredients', 'active-list'],
    queryFn: () => ingredientService.getAllIngredients({ size: 1000, isActive: true }),
    enabled: isOpen
  });

  const ingredients = React.useMemo(() => {
    if (!ingredientsRes) return [];
    return ingredientsRes.data && Array.isArray(ingredientsRes.data)
      ? ingredientsRes.data
      : (ingredientsRes.content || ingredientsRes.results || (Array.isArray(ingredientsRes) ? ingredientsRes : []));
  }, [ingredientsRes]);

  // 2. Fetch toàn bộ danh sách công thức để tránh API getRecipe đơn lẻ bị lỗi 500
  const { data: recipesRes, isLoading: isLoadingRecipe } = useQuery({
    queryKey: ['recipes', 'all'],
    queryFn: () => recipeService.getAllRecipes({ size: 1000 }),
    enabled: isOpen
  });

  const recipeData = React.useMemo(() => {
    if (!recipesRes) return undefined;
    const list = recipesRes.data && Array.isArray(recipesRes.data)
      ? recipesRes.data
      : (recipesRes.content || recipesRes.results || (Array.isArray(recipesRes) ? recipesRes : []));
    return list.find((r: any) => r.productId === productId && r.variantId === variantId) as Recipe | undefined;
  }, [recipesRes, productId, variantId]);

  // 3. Reset form và điền thông tin công thức cũ
  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      if (recipeData) {
        form.setFieldsValue({
          version: recipeData.version || 1,
          ingredients: recipeData.ingredients || []
        });
      } else {
        form.setFieldsValue({
          version: 1,
          ingredients: []
        });
      }
    }
  }, [isOpen, recipeData, form]);

  // Tìm đơn vị đo của nguyên liệu
  const getIngredientUnit = (id: string) => {
    const ing = ingredients.find((i: any) => i.id === id);
    return ing ? ing.unit : '';
  };

  // 4. Mutation lưu hoặc cập nhật công thức
  const saveRecipeMutation = useMutation({
    mutationFn: (payload: Recipe) => {
      if (recipeData && recipeData.id) {
        return recipeService.updateRecipe(recipeData.id, payload);
      }
      return recipeService.saveRecipe(payload);
    },
    onSuccess: () => {
      message.success('Đã lưu công thức thành công');
      queryClient.invalidateQueries({ queryKey: ['recipe', productId, variantId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] }); // Làm tươi lại danh sách công thức
      onClose();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Không thể lưu công thức');
    }
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Recipe = {
        ...(recipeData?.id ? { id: recipeData.id } : {}),
        productId,
        variantId,
        version: Number(values.version || 1),
        ingredients: (values.ingredients || []).map((item: any) => ({
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity)
        }))
      };
      
      saveRecipeMutation.mutate(payload);
    } catch (error) {
      // Validate failed
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <ExperimentOutlined className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-gray-800 leading-none">Cấu hình Công thức</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              {productName} - Size {variantLabel}
            </p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} className="rounded-xl font-bold h-11 border-gray-200">
          Hủy bỏ
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={saveRecipeMutation.isPending}
          className="rounded-xl font-bold h-11 bg-amber-500 hover:bg-amber-600 border-none shadow-sm shadow-amber-200"
        >
          Lưu công thức
        </Button>
      ]}
      centered
      width={650}
      forceRender
      styles={{
        mask: { backdropFilter: 'blur(4px)' },
        body: { padding: '24px 0' }
      }}
    >
      <Spin spinning={isLoadingRecipe || isLoadingIngredients}>
        <Form form={form} layout="vertical" className="px-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <Form.Item
            label={<span className="font-bold text-gray-700 text-xs uppercase tracking-wide">Phiên bản công thức</span>}
            name="version"
            rules={[{ required: true, message: 'Nhập số phiên bản' }]}
            className="mb-6 w-1/3"
          >
            <InputNumber min={1} className="w-full rounded-xl border-gray-200 font-bold h-10 flex items-center" placeholder="1" />
          </Form.Item>

          <Divider orientation={"left" as any} className="m-0 mb-4">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Danh sách nguyên liệu pha chế</span>
          </Divider>

          <Form.List name="ingredients">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-100 transition-all"
                  >
                    {/* Chọn nguyên liệu */}
                    <Form.Item
                      {...restField}
                      name={[name, 'ingredientId']}
                      rules={[{ required: true, message: 'Chọn nguyên liệu' }]}
                      className="mb-0 flex-[3]"
                    >
                      <Select
                        showSearch
                        placeholder="Chọn nguyên liệu..."
                        optionFilterProp="label"
                        className="w-full rounded-xl border-gray-200 text-xs font-bold"
                        options={ingredients.map((ing: any) => ({
                          value: ing.id,
                          label: `${ing.name} (SKU: ${ing.sku})`,
                        }))}
                      />
                    </Form.Item>

                    {/* Số lượng */}
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Nhập số lượng' }]}
                      className="mb-0 flex-[2]"
                    >
                      <InputNumber
                        min={0.001}
                        step={0.001}
                        className="w-full rounded-xl border-gray-200 font-bold text-xs h-10 flex items-center"
                        placeholder="Số lượng"
                      />
                    </Form.Item>

                    {/* Đơn vị đo hiển thị động */}
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.ingredients?.[name]?.ingredientId !== currentValues.ingredients?.[name]?.ingredientId
                      }
                    >
                      {() => {
                        const selectedId = form.getFieldValue(['ingredients', name, 'ingredientId']);
                        const unit = getIngredientUnit(selectedId);
                        return (
                          <div className="w-14 text-center font-bold text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 whitespace-nowrap">
                            {unit || 'ĐV'}
                          </div>
                        );
                      }}
                    </Form.Item>

                    {/* Nút xóa nguyên liệu */}
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined className="text-sm" />}
                      onClick={() => remove(name)}
                      className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-50 hover:bg-red-100 transition-colors"
                    />
                  </div>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  className="rounded-2xl border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-400 bg-amber-50/30 h-12 font-bold text-[11px] uppercase tracking-widest mt-4 flex items-center justify-center gap-2"
                >
                  Thêm nguyên liệu
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Spin>
    </Modal>
  );
};
