import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber } from 'antd';
import { ingredientService } from '@/services/ingredient.service';
import { message } from '@/lib/antd';
import { useQueryClient } from '@tanstack/react-query';

interface ToppingThresholdModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  topping: any | null;
}

export const ToppingThresholdModal: React.FC<ToppingThresholdModalProps> = ({
  open,
  onCancel,
  onSuccess,
  topping,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Reset form khi mở modal
  useEffect(() => {
    if (open && topping) {
      const thresholdVal = topping.lowStockThreshold !== undefined 
        ? topping.lowStockThreshold 
        : (topping.threshold !== undefined ? topping.threshold : 10);
      form.setFieldsValue({ lowStockThreshold: thresholdVal });
    }
  }, [open, topping, form]);

  const handleSubmit = async () => {
    if (!topping) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const toppingId = topping.id || topping.toppingId;
      if (!toppingId) throw new Error('Không xác định được ID topping');

      await ingredientService.updateIngredient(toppingId, {
        lowStockThreshold: Number(values.lowStockThreshold),
      });

      const name = topping.name || topping.toppingName || 'Topping';
      message.success(`Cập nhật ngưỡng cảnh báo [${name}] thành công!`);

      // Làm mới dữ liệu bảng tồn kho topping
      queryClient.invalidateQueries({ queryKey: ['inventory', 'toppings'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });

      onSuccess();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ngưỡng cảnh báo');
    } finally {
      setLoading(false);
    }
  };

  if (!topping) return null;

  const name = topping.name || topping.toppingName || 'Chưa đặt tên';
  const currentStock = topping.currentStock !== undefined 
    ? topping.currentStock 
    : (topping.stock !== undefined ? topping.stock : (topping.quantity !== undefined ? topping.quantity : 0));
  const unit = topping.unit || topping.measure || 'phần';

  return (
    <Modal
      title={<span className="text-lg font-black uppercase text-gray-800 tracking-tight">⚠️ Sửa ngưỡng cảnh báo</span>}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      centered
      destroyOnClose
      okText="Xác nhận"
      cancelText="Hủy bỏ"
      okButtonProps={{ className: 'bg-amber-600 rounded-xl font-bold border-none h-10 px-6' }}
      cancelButtonProps={{ className: 'rounded-xl h-10' }}
    >
      <div className="py-2">
        <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-sm text-gray-700 font-medium mb-1">
            Topping: <span className="font-bold text-gray-900">{name}</span>
          </p>
          <p className="text-xs text-gray-500">
            Tồn kho hiện tại: <span className="font-bold text-amber-600">
              {currentStock} {unit}
            </span>
          </p>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="lowStockThreshold"
            label={
              <span className="text-xs font-bold text-gray-600">
                Ngưỡng cảnh báo hết hàng ({unit})
              </span>
            }
            rules={[
              { required: true, message: 'Vui lòng điền ngưỡng cảnh báo!' },
              { type: 'number', min: 0, message: 'Ngưỡng phải ≥ 0' },
            ]}
          >
            <InputNumber
              min={0}
              step={1}
              size="large"
              className="w-full rounded-xl"
              placeholder="Ví dụ: 10, 5..."
            />
          </Form.Item>
          <p className="text-xs text-gray-400 -mt-2">
            ℹ️ Hệ thống sẽ cảnh báo khi tồn kho ≤ ngưỡng này.
          </p>
        </Form>
      </div>
    </Modal>
  );
};
