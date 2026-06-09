import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Button } from 'antd';
import type { Topping } from '../../../services/topping.service';

interface ToppingModalProps {
  isOpen: boolean;
  editingRecord: Topping | null;
  isLoading: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
}

export const ToppingModal: React.FC<ToppingModalProps> = ({
  isOpen,
  editingRecord,
  isLoading,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        form.setFieldsValue({
          name: editingRecord.name,
          price: editingRecord.price,
          displayOrder: editingRecord.displayOrder,
          isAvailable: editingRecord.isAvailable,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          displayOrder: 0,
          isAvailable: true
        });
      }
    }
  }, [isOpen, editingRecord, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-black uppercase text-gray-800 tracking-tight">{editingRecord ? 'Chỉnh Sửa Topping' : 'Thêm Topping Mới'}</span>}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} className="rounded-xl font-medium">
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isLoading}
          onClick={handleSubmit}
          className="bg-[#d37533] rounded-xl font-bold px-6"
        >
          {editingRecord ? 'Lưu thay đổi' : 'Thêm mới'}
        </Button>,
      ]}
      centered
      width={600}
    >
      <div className="mt-6">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="custom-form"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={<span className="font-bold text-gray-600">Tên Topping</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên topping!' }]}
              className="col-span-2"
            >
              <Input size="large" placeholder="VD: Trân châu đen..." className="rounded-xl bg-gray-50 border-gray-200" />
            </Form.Item>

            <Form.Item
              name="price"
              label={<span className="font-bold text-gray-600">Giá bán (VNĐ)</span>}
              rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
            >
              <InputNumber
                size="large"
                className="w-full rounded-xl bg-gray-50 border-gray-200"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                min={0 as number}
                placeholder="VD: 10000"
              />
            </Form.Item>

            <Form.Item
              name="displayOrder"
              label={<span className="font-bold text-gray-600">Thứ tự hiển thị</span>}
              rules={[{ required: true, message: 'Vui lòng nhập thứ tự hiển thị!' }]}
            >
              <InputNumber
                size="large"
                className="w-full rounded-xl bg-gray-50 border-gray-200"
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="isAvailable"
              label={<span className="font-bold text-gray-600">Trạng thái bán</span>}
              valuePropName="checked"
              className="col-span-2"
            >
              <Switch checkedChildren="Đang phục vụ" unCheckedChildren="Hết hàng" />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
