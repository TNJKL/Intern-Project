import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Upload, Button } from 'antd';
import { message } from '@/lib/antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { fileService } from '../../../services/fileService';
import { useState } from 'react';
import type { Category } from '../../../services/categoryService';

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: any;
  categories: Category[];
  isLoading: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  editingProduct,
  categories,
  isLoading,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    
    setIsUploading(true);
    try {
      const imageUrl = await fileService.uploadImage(file as File);
      form.setFieldsValue({ imageUrl });
      onSuccess("ok");
      message.success('Tải ảnh lên thành công!');
    } catch (error) {
      console.error('Upload failed:', error);
      onError({ error });
      message.error('Tải ảnh lên thất bại!');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    customRequest: handleUpload,
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
      }
      return isJpgOrPng || Upload.LIST_IGNORE;
    },
  };

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        form.setFieldsValue({
          ...editingProduct,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editingProduct, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const payload = {
        ...values,
        isFeatured: values.isFeatured || false,
      };
      console.log('Sending values:', payload);
      onSave(payload);
    });
  };

  return (
    <Modal
      title={<span className="text-xl font-black uppercase text-gray-800">{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</span>}
      open={isOpen}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={isLoading}
      okText={editingProduct ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      okButtonProps={{ className: 'bg-[#d37533] rounded-lg font-bold shadow-md' }}
      cancelButtonProps={{ className: 'rounded-lg font-bold' }}
      centered
      width={700}
      styles={{ body: { borderRadius: '24px', padding: '24px' } }}
    >
      <Form form={form} layout="vertical" className="mt-6" initialValues={{ isAvailable: true, displayOrder: 0 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          
          <Form.Item 
            name="name" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Tên sản phẩm</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input size="large" placeholder="Ví dụ: Cà Phê Phin" className="rounded-xl" />
          </Form.Item>

          <Form.Item 
            name="categoryId" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Thuộc Danh mục</span>}
            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
          >
            <Select 
              size="large" 
              className="rounded-xl [&>.ant-select-selector]:!rounded-xl" 
              placeholder="Chọn danh mục"
              options={categories.map(c => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>

          <Form.Item 
            name="price" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Giá bán (VNĐ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
          >
            <InputNumber 
              size="large" 
              className="w-full rounded-xl" 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: any) => value!.replace(/\$\s?|(,*)/g, '')}
              min={0}
              step={1000}
            />
          </Form.Item>

          <Form.Item 
            name="slug" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Đường dẫn (Slug)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập slug!' }]}
          >
            <Input size="large" placeholder="vi-du-ca-phe-phin" className="rounded-xl" />
          </Form.Item>

          <Form.Item 
            name="description" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Mô tả sản phẩm</span>}
            className="md:col-span-2"
          >
            <Input.TextArea rows={3} placeholder="Mô tả về hương vị, thành phần..." className="rounded-xl" />
          </Form.Item>

          <div className="md:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
            <Form.Item 
              name="imageUrl" 
              label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Link hình ảnh đại diện</span>}
              className="mb-4"
            >
              <Input size="large" placeholder="https://..." className="rounded-xl" />
            </Form.Item>

            <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.imageUrl !== currentValues.imageUrl} className="mb-4">
              {({ getFieldValue }) => {
                const imgUrl = getFieldValue('imageUrl');
                return imgUrl ? (
                  <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center">
                    <img src={imgUrl} alt="Preview" className="h-full object-contain" />
                  </div>
                ) : null;
              }}
            </Form.Item>

            <Form.Item label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Hoặc tải lên từ máy tính</span>} className="mb-0">
              <Upload {...uploadProps} listType="picture" maxCount={1} className="w-full" disabled={isUploading}>
                <Button 
                  icon={isUploading ? <LoadingOutlined /> : <UploadOutlined />} 
                  className="rounded-xl h-11 w-full border-dashed border-gray-300 text-gray-500 hover:text-[#d37533] hover:border-[#d37533]"
                  disabled={isUploading}
                >
                  {isUploading ? 'Đang tải ảnh lên...' : 'Chọn file ảnh từ thiết bị'}
                </Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item 
            name="displayOrder" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Thứ tự hiển thị</span>}
          >
            <InputNumber size="large" className="w-full rounded-xl" min={0} />
          </Form.Item>

          <Form.Item 
            name="isAvailable" 
            label={<span className="font-bold text-gray-600 text-xs uppercase tracking-wider">Trạng thái Bán</span>}
          >
            <Select size="large" className="rounded-xl [&>.ant-select-selector]:!rounded-xl">
              <Select.Option value={true}>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Đang bán</div>
              </Select.Option>
              <Select.Option value={false}>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400"></span>Ngừng bán</div>
              </Select.Option>
            </Select>
          </Form.Item>

        </div>
      </Form>
    </Modal>
  );
};
