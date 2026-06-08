import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, DatePicker, Select } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { Voucher, VoucherFormData } from '@/services/voucher.service';
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
          applicableTier: initialData.applicableTier || 'ALL',
          dateRange: [dayjs(initialData.validFrom), dayjs(initialData.validUntil)]
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, discountType: 'PERCENTAGE', applicableTier: 'ALL' });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const { dateRange, ...rest } = values;
      const formData: VoucherFormData = {
        ...rest,
        applicableTier: rest.applicableTier || 'ALL',
        maxUsagePerUser: rest.maxUsagePerUser || null,
        validFrom: dateRange[0].toISOString().split('.')[0] + 'Z',
        validUntil: dateRange[1].toISOString().split('.')[0] + 'Z',
      };
      console.log("Submitting formData to backend:", formData);
      onSubmit(formData);
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-800 text-lg font-black uppercase tracking-tight">
          <span className="w-1.5 h-6 bg-coffee-medium rounded-full"></span>
          {initialData ? 'Chỉnh sửa Khuyến mãi' : 'Thêm Khuyến mãi mới'}
        </div>
      }
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={isLoading}
      width={840}
      style={{ top: 40 }}
      okText="Lưu lại"
      cancelText="Hủy"
      okButtonProps={{ size: 'large', className: 'bg-coffee-medium hover:bg-coffee-dark text-white rounded-xl px-6 font-bold border-none transition-all duration-200' }}
      cancelButtonProps={{ size: 'large', className: 'rounded-xl px-6 font-semibold' }}
    >
      <div className="py-4">
        <Form form={form} layout="vertical" requiredMark={false}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Mã Khuyến mãi */}
            <Form.Item
              name="code"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Mã Khuyến mãi
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập mã khuyến mãi' },
                { pattern: /^[A-Z0-9]+$/, message: 'Mã chỉ chứa chữ in hoa và số' }
              ]}
            >
              <Input placeholder="VD: GIAM10" className="uppercase rounded-xl" size="large" disabled={!!initialData} />
            </Form.Item>

            {/* Tên Khuyến mãi */}
            <Form.Item
              name="name"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Tên Khuyến mãi
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
            >
              <Input placeholder="Nhập tên khuyến mãi" className="rounded-xl" size="large" />
            </Form.Item>

            {/* Loại giảm giá */}
            <Form.Item
              name="discountType"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Loại giảm giá
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
            >
              <Select 
                size="large"
                className="w-full"
                onChange={() => {
                  form.setFieldsValue({ discountValue: undefined, maxDiscountAmount: undefined });
                }}
                popupClassName="rounded-xl"
              >
                <Select.Option value="PERCENTAGE">Phần trăm (%)</Select.Option>
                <Select.Option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</Select.Option>
              </Select>
            </Form.Item>

            {/* Mức giảm */}
            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}>
              {({ getFieldValue }) => {
                const discountType = getFieldValue('discountType');
                const isPercentage = discountType === 'PERCENTAGE';
                return (
                  <Form.Item
                    name="discountValue"
                    label={
                      <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                        {isPercentage ? "Mức giảm (%)" : "Mức giảm (VNĐ)"}
                      </span>
                    }
                    rules={[
                      { required: true, message: 'Vui lòng nhập mức giảm' },
                      { type: 'number', min: 0.01, message: 'Mức giảm phải lớn hơn 0' },
                      ...(isPercentage ? [{ type: 'number' as const, max: 100, message: 'Giảm tối đa 100%' }] : [])
                    ]}
                  >
                    <InputNumber 
                      size="large"
                      min={0.01 as number} 
                      max={isPercentage ? (100 as number) : undefined}
                      className="w-full rounded-xl" 
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

            {/* Đơn tối thiểu */}
            <Form.Item
              name="minOrderAmount"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Đơn tối thiểu (VNĐ)
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập đơn tối thiểu' }]}
            >
              <InputNumber 
                size="large"
                min={0 as number} 
                className="w-full rounded-xl"
                placeholder="Ví dụ: 50,000"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => {
                  if (!value) return 0;
                  return parseFloat(value.replace(/\$\s?|(,*)/g, '')) || 0;
                }}
              />
            </Form.Item>

            {/* Giảm tối đa / Info card */}
            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}>
              {({ getFieldValue }) => {
                const discountType = getFieldValue('discountType');
                if (discountType === 'PERCENTAGE') {
                  return (
                    <Form.Item
                      name="maxDiscountAmount"
                      label={
                        <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                          Giảm tối đa (VNĐ)
                        </span>
                      }
                      rules={[{ required: true, message: 'Vui lòng nhập mức giảm tối đa' }]}
                    >
                      <InputNumber 
                        size="large"
                        min={0 as number} 
                        className="w-full rounded-xl"
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
                  <Form.Item
                    label={
                      <span className="font-bold text-gray-400 text-sm uppercase tracking-wide select-none opacity-0">
                        Giới hạn
                      </span>
                    }
                  >
                    <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl px-4 flex flex-col justify-center h-[50px]">
                      <div className="flex items-center gap-1.5 text-gray-555 text-xs font-bold uppercase tracking-wider leading-none">
                        <InfoCircleOutlined className="text-coffee-medium text-sm" />
                        Giới hạn giảm tối đa
                      </div>
                      <p className="text-xs text-gray-400 italic leading-none mt-1.5">
                        Không áp dụng cho tiền cố định.
                      </p>
                    </div>
                  </Form.Item>
                );
              }}
            </Form.Item>

            {/* Số lượt dùng tối đa */}
            <Form.Item
              name="maxUsageCount"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Tổng lượt dùng tối đa
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập số lượt dùng' }]}
            >
              <InputNumber size="large" min={1} className="w-full rounded-xl" placeholder="Ví dụ: 100" />
            </Form.Item>

            {/* Số lượt dùng tối đa mỗi người */}
            <Form.Item
              name="maxUsagePerUser"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Lượt dùng/Người
                </span>
              }
            >
              <InputNumber size="large" min={1} className="w-full rounded-xl" placeholder="Để trống nếu không giới hạn" />
            </Form.Item>

            {/* Trạng thái hoạt động */}
            <Form.Item
              label={
                <span className="font-bold text-gray-400 text-sm uppercase tracking-wide select-none opacity-0">
                  Trạng thái
                </span>
              }
            >
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 flex items-center justify-between h-[50px]">
                <span className="text-xs font-bold text-gray-550 uppercase tracking-wider">Kích hoạt hoạt động</span>
                <Form.Item name="isActive" valuePropName="checked" className="mb-0">
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
              </div>
            </Form.Item>

            {/* Hạng thành viên áp dụng */}
            <Form.Item
              name="applicableTier"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Hạng thành viên áp dụng
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng chọn hạng thành viên áp dụng' }]}
            >
              <Select size="large" placeholder="Chọn hạng thành viên áp dụng" popupClassName="rounded-xl">
                <Select.Option value="ALL">ALL (Tất cả khách hàng)</Select.Option>
                <Select.Option value="MEMBER">MEMBER (Thành viên trở lên)</Select.Option>
                <Select.Option value="VIP">VIP (Chỉ khách hàng VIP)</Select.Option>
              </Select>
            </Form.Item>

            {/* Thời gian áp dụng */}
            <Form.Item
              name="dateRange"
              label={
                <span className="font-bold text-gray-750 text-sm uppercase tracking-wide">
                  Thời gian áp dụng
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng chọn thời gian áp dụng' }]}
            >
              <DatePicker.RangePicker 
                size="large"
                showTime 
                className="w-full rounded-xl" 
                format="DD/MM/YYYY HH:mm"
              />
            </Form.Item>

          </div>
        </Form>
      </div>
    </Modal>
  );
};
