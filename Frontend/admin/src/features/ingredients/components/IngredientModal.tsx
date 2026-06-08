// 📄 Vị trí file: src/features/ingredients/components/IngredientModal.tsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Button } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

interface IngredientModalProps {
  isOpen: boolean;
  editingRecord: any;
  isLoading: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
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
          ...editingRecord,
          isActive: editingRecord.isActive ?? true,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, currentStock: 0, lowStockThreshold: 10, costPerUnit: 0 });
      }
    }
  }, [isOpen, editingRecord, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(values);
    });
  };

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={isLoading}
      centered
      width={800}
      className="w-full max-w-[calc(100vw-24px)] sm:max-w-[600px] md:max-w-[720px] lg:max-w-[800px] rounded-3xl overflow-hidden"
      footer={(
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 px-6 md:px-10 pb-6 md:pb-10 pt-4 border-t border-gray-50 bg-white">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center sm:text-left w-full sm:w-auto">
            {editingRecord ? `ID: ${editingRecord.id}` : 'Đang thêm nguyên liệu mới'}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button onClick={onClose} className="rounded-xl font-bold h-11 border-gray-200 text-gray-500 flex-1 sm:flex-initial sm:px-8">
              Đóng
            </Button>
            <Button type="primary" onClick={handleSave} loading={isLoading} className="bg-[#d37533] rounded-xl font-bold h-11 flex-1 sm:flex-initial sm:px-10 border-none shadow-lg shadow-orange-100">
              {editingRecord ? 'Cập nhật' : 'Lưu nguyên liệu'}
            </Button>
          </div>
        </div>
      )}
      styles={{ body: { padding: 0 } }}
    >
      <div className="bg-white px-6 md:px-10 pt-6 md:pt-8 pb-4 border-b border-gray-100 rounded-t-3xl">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
            <AppstoreOutlined className="text-lg md:text-xl text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-black uppercase text-gray-800 tracking-tight leading-none">
              {editingRecord ? 'Chỉnh sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
            </h3>
            <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1.5 md:mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
              Quản lý nguyên liệu kho
            </p>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" className="px-6 md:px-10 pb-6 md:pb-10 pt-4 max-h-[65vh] md:max-h-[70vh] overflow-y-auto scrollbar-hide bg-white">
        <div className="flex flex-col gap-6 w-full">
          <div className="space-y-1">
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="name" label={<span className="text-[10px] font-black uppercase text-gray-500">Tên nguyên liệu</span>} rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                  <Input size="large" placeholder="Ví dụ: Cà phê hạt..." className="rounded-xl border-gray-200 focus:border-[#d37533] h-12 text-sm font-bold" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="sku" label={<span className="text-[10px] font-black uppercase text-gray-500">Mã SKU</span>} rules={[{ required: true, message: 'Vui lòng nhập SKU!' }]}>
                  <Input size="large" placeholder="Ví dụ: CF-001" className="rounded-xl border-gray-200 focus:border-[#d37533] h-12 text-sm font-mono" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="unit" label={<span className="text-[10px] font-black uppercase text-gray-500">Đơn vị tính</span>} rules={[{ required: true, message: 'Vui lòng nhập đơn vị!' }]}>
                  <Input size="large" placeholder="Ví dụ: kg, lít, hộp..." className="rounded-xl border-gray-200 focus:border-[#d37533] h-12 text-sm" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="costPerUnit" label={<span className="text-[10px] font-black uppercase text-gray-500">Giá vốn (VNĐ)</span>} rules={[{ required: true, message: 'Vui lòng nhập giá vốn!' }]}>
                  <InputNumber size="large" className="w-full rounded-xl border-gray-200 h-12 flex items-center px-2" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value!.replace(/\$\s?|(,*)/g, '')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="currentStock" label={<span className="text-[10px] font-black uppercase text-gray-500">Tồn kho hiện tại</span>} rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}>
                  <InputNumber size="large" className="w-full rounded-xl border-gray-200 h-12 flex items-center px-2" disabled={!!editingRecord} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="lowStockThreshold" label={<span className="text-[10px] font-black uppercase text-gray-500">Mức cảnh báo hết</span>} rules={[{ required: true, message: 'Vui lòng nhập ngưỡng cảnh báo!' }]}>
                  <InputNumber size="large" className="w-full rounded-xl border-gray-200 h-12 flex items-center px-2" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col xs={24}>
                <Form.Item name="isActive" label={<span className="text-[10px] font-black uppercase text-gray-500">Trạng thái</span>}>
                  <Select size="large" className="rounded-xl h-12" options={[{ label: 'Đang dùng', value: true }, { label: 'Ngừng dùng', value: false }]} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      </Form>
    </Modal>
  );
};