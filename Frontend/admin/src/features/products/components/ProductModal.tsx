import React from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Row, Col, Space, Divider, Tooltip } from 'antd';
import { 
  PlusOutlined,
  DollarOutlined,
  ShoppingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { Category } from '@/services/category.service';
import { useProductForm } from '../hooks/useProductForm';
import { ImageUploadSection, VariantSection, AdditionalImagesSection } from './ProductFormParts';

interface ProductModalProps {
  isOpen: boolean;
  editingRecord: any;
  categories: Category[];
  isLoading: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen, editingRecord, categories, isLoading, onClose, onSave
}) => {
  const {
    form, isUploading, toppings, isFetchingToppings, isAddingTopping,
    newToppingName, setNewToppingName, newToppingPrice, setNewToppingPrice,
    handleUpload, handleUploadAdditional, handleQuickAddTopping
  } = useProductForm(isOpen, editingRecord);

  const imageUrl = Form.useWatch('imageUrl', form);

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={(
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-10 pb-6 sm:pb-10 pt-4">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest hidden sm:block">
            {editingRecord ? `ID: ${editingRecord.id}` : 'Đang tạo món mới'}
          </div>
          <Space size="middle" className="w-full sm:w-auto justify-center sm:justify-end">
            <Button onClick={onClose} className="rounded-xl font-bold h-11 border-gray-200 text-gray-500 px-6 sm:px-8 flex-1 sm:flex-none">Đóng</Button>
            <Button 
              type="primary" 
              onClick={() => form.validateFields().then(values => onSave({ ...values, isFeatured: !!values.isFeatured }))} 
              loading={isLoading}
              className="bg-[#d37533] rounded-xl font-bold h-11 px-6 sm:px-10 border-none shadow-lg shadow-orange-100 flex-1 sm:flex-none"
            >
              {editingRecord ? 'Cập nhật' : 'Tạo sản phẩm'}
            </Button>
          </Space>
        </div>
      )}
      centered width={1000} styles={{ body: { padding: 0 } }}
    >
      <div className="bg-white px-4 sm:px-10 pt-6 sm:pt-8 pb-4 border-b border-gray-100 rounded-t-3xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
            <ShoppingOutlined className="text-lg sm:text-xl text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-2xl font-black uppercase text-gray-800 tracking-tight leading-none">{editingRecord ? 'Chỉnh sửa sản phẩm' : 'Thêm món mới'}</h3>
            <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full shrink-0"></span> Quản lý thông tin thực đơn
            </p>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" className="px-4 sm:px-10 pb-6 sm:pb-10 pt-4 max-h-[75vh] overflow-y-auto scrollbar-hide bg-white">
        <Space orientation="vertical" size={24} className="w-full">
          {/* Nhóm 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <FileTextOutlined className="text-gray-400" />
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Thông tin sản phẩm</span>
            </div>
            
            <Form.Item name="name" label={<span className="text-[10px] font-black uppercase text-gray-500">Tên sản phẩm</span>} rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
              <Input size="large" placeholder="Ví dụ: Cà Phê Muối" className="rounded-xl border-gray-200 focus:border-[#d37533] h-12 text-sm font-bold" />
            </Form.Item>

            <Form.Item name="categoryId" label={<span className="text-[10px] font-black uppercase text-gray-500">Danh mục sản phẩm</span>} rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select size="large" placeholder="Chọn danh mục món..." className="rounded-xl h-12" options={categories.map(c => ({ label: c.name, value: c.id }))} />
            </Form.Item>

            <Form.Item name="description" label={<span className="text-[10px] font-black uppercase text-gray-500">Mô tả sản phẩm</span>}>
              <Input.TextArea rows={3} placeholder="Giới thiệu hương vị, thành phần..." className="rounded-xl border-gray-200 focus:border-[#d37533] text-sm p-4" />
            </Form.Item>
          </div>

          {/* Nhóm 2: Cấu hình & Trạng thái */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <DollarOutlined className="text-gray-400" />
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Trạng thái & Hiển thị</span>
            </div>

            <Row gutter={[24, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item name="isAvailable" label={<span className="text-[10px] font-black uppercase text-gray-500">Trạng thái bán</span>}>
                  <Select size="large" className="rounded-xl h-12" options={[{ label: 'Đang mở bán', value: true }, { label: 'Tạm ngừng', value: false }]} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="displayOrder" label={<span className="text-[10px] font-black uppercase text-gray-500">Thứ tự hiển thị</span>}>
                  <InputNumber size="large" className="w-full rounded-xl border-gray-200 h-12 flex items-center" placeholder="0" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="toppingIds" label={<Space className="w-full justify-between"><span className="text-[10px] font-black uppercase text-gray-500">Toppings đi kèm</span><Tooltip title="Thêm nhanh topping mới"><PlusOutlined className="text-[#d37533] cursor-pointer" /></Tooltip></Space>}>
              <Select mode="multiple" size="large" placeholder="Chọn topping..." className="rounded-xl min-h-[48px]" loading={isFetchingToppings} options={toppings.map(t => ({ label: `${t.name} (+${t.price.toLocaleString()}đ)`, value: t.id }))} maxTagCount="responsive"
                dropdownRender={(menu) => (
                  <div className="bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden">
                    {menu}<Divider style={{ margin: '8px 0' }} />
                    <div className="p-3 flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase text-gray-400 px-1">Tạo nhanh Topping</span>
                      <div className="flex gap-2">
                        <Input placeholder="Tên..." value={newToppingName} onChange={(e) => setNewToppingName(e.target.value)} className="rounded-lg text-xs" />
                        <InputNumber placeholder="Giá" value={newToppingPrice} onChange={(val) => setNewToppingPrice(val || 0)} className="w-24 rounded-lg text-xs" min={0} />
                        <Button type="primary" size="small" loading={isAddingTopping} onClick={handleQuickAddTopping} className="bg-[#d37533] border-none rounded-lg text-[10px] font-bold uppercase h-8">Thêm</Button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </Form.Item>
          </div>

          {/* Nhóm 3: Tùy chọn nâng cao */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <PlusOutlined className="text-gray-400" />
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Tùy chọn nâng cao</span>
            </div>
            
            <Row gutter={[24, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item name="isFeatured" label={<span className="text-[10px] font-black uppercase text-gray-500">Loại sản phẩm</span>}>
                  <Select size="large" className="rounded-xl h-12" options={[{ label: 'Bình thường', value: false }, { label: 'Top đề xuất', value: true }]} />
                </Form.Item>
              </Col>
              {editingRecord && (
                <Col xs={24} sm={12}>
                  <Form.Item name="slug" label={<span className="text-[10px] font-black uppercase text-gray-500">Slug định danh</span>}>
                    <Input size="large" readOnly className="rounded-xl border-gray-200 bg-gray-50 text-gray-400 font-mono text-xs h-12" />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </div>

          {!editingRecord && <VariantSection />}

          {/* Phần hình ảnh - Để cuối cùng, thiết kế nhỏ gọn hơn */}
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <ImageUploadSection imageUrl={imageUrl} isUploading={isUploading} uploadProps={{ customRequest: handleUpload, showUploadList: false }} />
            <AdditionalImagesSection form={form} handleUploadAdditional={handleUploadAdditional} />
          </div>
        </Space>
      </Form>
    </Modal>
  );
};
