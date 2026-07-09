import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, Button } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { message } from '@/lib/antd';

interface RefundModalProps {
  paymentId?: string;
  orderCode?: string;
  maxAmount: number;
  isOpen: boolean;
  isFixedAmount?: boolean;
  recipientType?: 'CUSTOMER' | 'SHIPPER';
  onClose: () => void;
  onSuccess?: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  paymentId,
  orderCode,
  maxAmount,
  isOpen,
  isFixedAmount = false,
  recipientType = 'CUSTOMER',
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [isOtherReason, setIsOtherReason] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        amount: maxAmount,
        reasonSelect: recipientType === 'SHIPPER'
          ? 'Hoàn trả tiền ứng cho Shipper do đơn hàng bị bom'
          : (isFixedAmount
            ? 'Hoàn tiền cho đơn hàng đã bị hủy'
            : 'Khách hàng yêu cầu hủy đơn'),
        customReason: '',
        shipperName: '',
        shipperPhone: '',
      });
      setIsOtherReason(false);
    }
  }, [isOpen, maxAmount, form, isFixedAmount, recipientType]);

  const refundMutation = useMutation({
    mutationFn: ({
      pId,
      amount,
      reason,
      recipientType,
      shipperName,
      shipperPhone,
    }: {
      pId: string;
      amount: number;
      reason: string;
      recipientType?: 'CUSTOMER' | 'SHIPPER';
      shipperName?: string;
      shipperPhone?: string;
    }) =>
      paymentService.refundPayment(pId, {
        amount,
        reason,
        recipientType,
        shipperName,
        shipperPhone,
      }),
    onSuccess: (res) => {
      if (res.success) {
        message.success('Đã thực hiện hoàn tiền thành công');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['refunds'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        message.error(res.message || 'Hoàn tiền thất bại');
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi hoàn tiền');
    },
  });

  const handleSubmit = (values: any) => {
    if (!paymentId) return;
    const finalReason = values.reasonSelect === 'other' ? values.customReason : values.reasonSelect;
    if (!finalReason || finalReason.trim() === '') {
      message.error('Vui lòng nhập lý do hoàn tiền');
      return;
    }
    refundMutation.mutate({
      pId: paymentId,
      amount: values.amount,
      reason: finalReason,
      recipientType,
      shipperName: values.shipperName,
      shipperPhone: values.shipperPhone,
    });
  };

  return (
    <Modal
      title={
        <div className="font-black text-gray-800 uppercase tracking-wide text-sm border-b border-gray-100 pb-3">
          {recipientType === 'SHIPPER' ? 'Hoàn tiền ứng cho Shipper' : 'Yêu cầu hoàn tiền'} — Đơn {orderCode}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      className="rounded-3xl overflow-hidden"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="pt-4 space-y-4"
      >
        {recipientType === 'SHIPPER' && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-4 mb-4">
            <h4 className="font-extrabold text-orange-800 text-xs uppercase tracking-wider">Thông tin Shipper nhận tiền ứng</h4>
            
            <Form.Item
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Tên Shipper</span>}
              name="shipperName"
              rules={[{ required: true, message: 'Vui lòng nhập tên Shipper' }]}
            >
              <Input placeholder="Ví dụ: Nguyễn Văn A (AhaMove)" className="rounded-xl py-1.5" />
            </Form.Item>

            <Form.Item
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Số điện thoại Shipper</span>}
              name="shipperPhone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại Shipper' },
                { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Số điện thoại không hợp lệ (định dạng Việt Nam)' }
              ]}
            >
              <Input placeholder="Ví dụ: 0901234567" className="rounded-xl py-1.5" />
            </Form.Item>
          </div>
        )}

        <Form.Item
          label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Số tiền hoàn (đ)</span>}
          name="amount"
          rules={[
            { required: true, message: 'Vui lòng nhập số tiền hoàn' },
            {
              validator: (_, value) => {
                if (value === null || value === undefined) return Promise.resolve();
                if (value <= 0) return Promise.reject('Số tiền hoàn phải lớn hơn 0');
                if (value > maxAmount) return Promise.reject(`Không được vượt quá số tiền tối đa: ${maxAmount.toLocaleString()}đ`);
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            className="w-full rounded-xl py-1.5"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => (value ? `${value}` : '').replace(/\$\s?|(,*)/g, '')}
            addonAfter="đ"
            disabled={isFixedAmount}
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Lý do hoàn tiền</span>}
          name="reasonSelect"
          rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}
        >
          <Select
            className="w-full rounded-xl"
            popupClassName="rounded-xl"
            onChange={(val) => setIsOtherReason(val === 'other')}
            options={
              recipientType === 'SHIPPER'
                ? [
                  { value: 'Hoàn trả tiền ứng cho Shipper do đơn hàng bị bom', label: 'Hoàn trả tiền ứng cho Shipper do đơn hàng bị bom' },
                  { value: 'Hoàn trả tiền ứng do cửa hàng chuẩn bị sai món', label: 'Hoàn trả tiền ứng do cửa hàng chuẩn bị sai món' },
                  { value: 'other', label: 'Lý do khác (Nhập thủ công)...' },
                ]
                : (isFixedAmount
                  ? [
                    {
                      value: 'Đơn hàng đã bị hủy nhưng nhận được thanh toán thành công',
                      label: 'Đơn hàng đã bị hủy nhưng nhận được thanh toán thành công',
                    },
                    { value: 'other', label: 'Lý do khác (Nhập thủ công)...' },
                  ]
                  : [
                    { value: 'Khách hàng yêu cầu hủy đơn', label: 'Khách hàng yêu cầu hủy đơn' },
                    { value: 'Hết nguyên liệu sản phẩm', label: 'Hết nguyên liệu sản phẩm' },
                    { value: 'Không thể giao hàng / Sai địa chỉ', label: 'Không thể giao hàng / Sai địa chỉ' },
                    { value: 'Giao dịch bị trùng lặp', label: 'Giao dịch bị trùng lặp' },
                    { value: 'other', label: 'Lý do khác (Nhập thủ công)...' },
                  ])
            }
          />
        </Form.Item>

        {isOtherReason && (
          <Form.Item
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Mô tả lý do khác</span>}
            name="customReason"
            rules={[{ required: true, message: 'Vui lòng điền chi tiết lý do khác' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do hoàn tiền chi tiết tại đây..."
              className="rounded-xl"
            />
          </Form.Item>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button onClick={onClose} className="rounded-xl font-bold">
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={refundMutation.isPending}
            className="rounded-xl bg-[#d37533] hover:bg-[#b05d25] font-bold"
          >
            Xác nhận hoàn tiền
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
