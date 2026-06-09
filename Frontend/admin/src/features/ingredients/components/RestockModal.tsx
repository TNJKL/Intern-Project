import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input } from 'antd';
import { ingredientService, type Ingredient } from '@/services/ingredient.service';
import { message } from '@/lib/antd';
import { useQueryClient } from '@tanstack/react-query';

interface RestockModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  ingredient: Ingredient | any | null;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  open,
  onCancel,
  onSuccess,
  ingredient,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Reset form khi mở modal với nguyên liệu mới
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, ingredient, form]);

  const handleSubmit = async () => {
    if (!ingredient) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const targetId = ingredient.id || ingredient.toppingId;
      if (!targetId) {
        throw new Error('Không xác định được ID đối tượng');
      }

      await ingredientService.restockIngredient(targetId, {
        quantity: Number(values.quantity),
        note: values.note || 'Nhập kho bổ sung từ danh sách',
      });

      const displayName = ingredient.name || ingredient.toppingName || 'Nguyên liệu';
      message.success(`Nhập kho thành công cho [${displayName}]!`);
      
      // Invalidate queries để đồng bộ dữ liệu tồn kho
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'toppings'] });
      
      onSuccess();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi nhập kho');
    } finally {
      setLoading(false);
    }
  };

  if (!ingredient) return null;

  const currentStock = ingredient.currentStock !== undefined 
    ? ingredient.currentStock 
    : (ingredient.stock !== undefined ? ingredient.stock : (ingredient.quantity !== undefined ? ingredient.quantity : 0));
  
  const unit = ingredient.unit || ingredient.measure || 'phần';
  const name = ingredient.name || ingredient.toppingName || 'Chưa đặt tên';

  return (
    <Modal
      title={<span className="text-lg font-black uppercase text-gray-800 tracking-tight">📥 Nhập kho bổ sung</span>}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      centered
      destroyOnClose
      okText="Xác nhận nhập"
      cancelText="Hủy bỏ"
      okButtonProps={{ className: 'bg-orange-600 rounded-xl font-bold border-none h-10 px-6' }}
      cancelButtonProps={{ className: 'rounded-xl h-10' }}
    >
      <div className="py-2">
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-700 font-medium mb-1">
            Đối tượng: <span className="font-bold text-gray-900">{name}</span>
          </p>
          <p className="text-xs text-gray-500">
            Tồn kho hiện tại: <span className="font-bold text-orange-600">{currentStock} {unit}</span>
          </p>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="quantity"
            label={<span className="text-xs font-bold text-gray-600">Số lượng nhập thêm ({unit})</span>}
            rules={[{ required: true, message: 'Vui lòng điền số lượng nhập kho!' }]}
          >
            <InputNumber min={0.001} size="large" className="w-full rounded-xl" placeholder="Ví dụ: 10, 2.5..." />
          </Form.Item>
          <Form.Item
            name="note"
            label={<span className="text-xs font-bold text-gray-600">Ghi chú nhập kho</span>}
          >
            <Input.TextArea rows={3} placeholder="Lý do nhập kho..." className="rounded-xl" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
