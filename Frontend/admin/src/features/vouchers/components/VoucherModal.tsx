import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, DatePicker, Select } from 'antd';
import type { Voucher, VoucherFormData } from '@/services/voucherService';
import dayjs from 'dayjs';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VoucherFormData) => void;
  initialData?: Voucher | null;
  isLoading: boolean;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          dateRange: [dayjs(initialData.validFrom), dayjs(initialData.validUntil)]
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, discountType: 'PERCENTAGE' });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const { dateRange, ...rest } = values;
      const formData: VoucherFormData = {
        ...rest,
        validFrom: dateRange[0].toISOString(),
        validUntil: dateRange[1].toISOString(),
      };
      onSubmit(formData);
    });
  };

  return (
    <Modal
      title={initialData ? 'Chỉnh sửa Khuyến mãi' : 'Thêm Khuyến mãi mới'}
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={isLoading}
      width={600}
      style={{ top: 40 }}
    >
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="code"
            label="Mã Khuyến mãi"
            rules={[
              { required: true, message: 'Vui lòng nhập mã khuyến mãi' },
              { pattern: /^[A-Z0-9]+$/, message: 'Mã chỉ chứa chữ in hoa và số' }
            ]}
          >
            <Input placeholder="VD: GIAM10" className="uppercase" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên Khuyến mãi"
            rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
          >
            <Input placeholder="Nhập tên khuyến mãi" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="discountType"
            label="Loại giảm giá"
            rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
          >
            <Select onChange={() => {
              // Reset discount values to prevent type mismatch
              form.setFieldsValue({ discountValue: undefined, maxDiscountAmount: undefined });
            }}>
              <Select.Option value="PERCENTAGE">Phần trăm (%)</Select.Option>
              <Select.Option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}>
            {({ getFieldValue }) => {
              const discountType = getFieldValue('discountType');
              const isPercentage = discountType === 'PERCENTAGE';
              return (
                <Form.Item
                  name="discountValue"
                  label={isPercentage ? "Mức giảm (%)" : "Mức giảm (VNĐ)"}
                  rules={[
                    { required: true, message: 'Vui lòng nhập mức giảm' },
                    { type: 'number', min: 0.01, message: 'Mức giảm phải lớn hơn 0' },
                    isPercentage ? { type: 'number', max: 100, message: 'Giảm tối đa 100%' } : {}
                  ]}
                >
                  <InputNumber 
                    min={0.01} 
                    max={isPercentage ? 100 : undefined}
                    className="w-full" 
                    placeholder={isPercentage ? "Ví dụ: 10" : "Ví dụ: 25,000"}
                    formatter={value => isPercentage ? `${value}%` : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => {
                      if (!value) return 0;
                      let clean = value.replace('%', '').replace(/\$\s?|(,*)/g, '');
                      return parseFloat(clean) || 0;
                    }}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="minOrderAmount"
            label="Đơn tối thiểu (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập đơn tối thiểu' }]}
          >
            <InputNumber 
              min={0} 
              className="w-full"
              placeholder="Ví dụ: 50,000"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => {
                if (!value) return 0;
                return parseFloat(value.replace(/\$\s?|(,*)/g, '')) || 0;
              }}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}>
            {({ getFieldValue }) => {
              const discountType = getFieldValue('discountType');
              if (discountType === 'PERCENTAGE') {
                return (
                  <Form.Item
                    name="maxDiscountAmount"
                    label="Giảm tối đa (VNĐ)"
                    rules={[{ required: true, message: 'Vui lòng nhập mức giảm tối đa' }]}
                  >
                    <InputNumber 
                      min={0} 
                      className="w-full"
                      placeholder="Ví dụ: 30,000"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => {
                        if (!value) return 0;
                        return parseFloat(value.replace(/\$\s?|(,*)/g, '')) || 0;
                      }}
                    />
                  </Form.Item>
                );
              }
              return (
                <div className="flex items-center h-full pt-6 text-xs text-gray-400 italic">
                  Không áp dụng giới hạn giảm tối đa đối với tiền cố định.
                </div>
              );
            }}
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="maxUsageCount"
            label="Số lượt dùng tối đa"
            rules={[{ required: true, message: 'Vui lòng nhập số lượt dùng' }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm ẩn" />
          </Form.Item>
        </div>

        <Form.Item
          name="dateRange"
          label="Thời gian áp dụng"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian áp dụng' }]}
        >
          <DatePicker.RangePicker 
            showTime 
            className="w-full" 
            format="DD/MM/YYYY HH:mm"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
