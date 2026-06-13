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
  onClose: () => void;
  onSuccess?: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  paymentId,
  orderCode,
  maxAmount,
  isOpen,
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
        reasonSelect: 'Khách hàng yêu cầu hủy đơn',
        customReason: '',
      });
      setIsOtherReason(false);
    }
  }, [isOpen, maxAmount, form]);

  const refundMutation = useMutation({
    mutationFn: ({ pId, amount, reason }: { pId: string; amount: number; reason: string }) =>
      paymentService.refundPayment(pId, { amount, reason }),
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
    });
  };

  return (
    <Modal
      title={
        <div className="font-black text-gray-800 uppercase tracking-wide text-sm border-b border-gray-100 pb-3">
          Yêu cầu hoàn tiền — Đơn {orderCode}
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
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            addonAfter="đ"
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
            options={[
              { value: 'Khách hàng yêu cầu hủy đơn', label: 'Khách hàng yêu cầu hủy đơn' },
              { value: 'Hết nguyên liệu sản phẩm', label: 'Hết nguyên liệu sản phẩm' },
              { value: 'Không thể giao hàng / Sai địa chỉ', label: 'Không thể giao hàng / Sai địa chỉ' },
              { value: 'Giao dịch bị trùng lặp', label: 'Giao dịch bị trùng lặp' },
              { value: 'other', label: 'Lý do khác (Nhập thủ công)...' },
            ]}
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
