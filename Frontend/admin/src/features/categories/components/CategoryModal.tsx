import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Upload, Button, Divider } from 'antd';
import { message } from '@/lib/antd';
import { 
  UploadOutlined, 
  TagOutlined, 
  AlignLeftOutlined, 
  LinkOutlined, 
  OrderedListOutlined, 
  CheckCircleOutlined,
  CompassOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { type Category } from '../../../services/categoryService';
import { fileService } from '../../../services/fileService';

interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  isLoading: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  editingCategory,
  isLoading,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        form.setFieldsValue({
          ...editingCategory,
          isActive: editingCategory.isActive ? 'active' : 'inactive'
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editingCategory, form]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const payload = {
        ...values,
        slug: values.slug || generateSlug(values.name),
        isActive: values.isActive === 'active',
        displayOrder: parseInt(values.displayOrder) || 0,
        imageUrl: values.imageUrl
      };
      onSave(payload);
    });
  };
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

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 bg-[#d37533]/10 rounded-xl flex items-center justify-center text-[#d37533]">
            {editingCategory ? <AlignLeftOutlined className="text-xl" /> : <TagOutlined className="text-xl" />}
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-gray-800 leading-none">
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              {editingCategory ? 'Cập nhật thông tin thực đơn' : 'Mở rộng thực đơn của quán'}
            </p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={isLoading}
      okText={editingCategory ? "Cập nhật ngay" : "Tạo danh mục"}
      cancelText="Đóng"
      okButtonProps={{ 
        className: 'bg-[#d37533] hover:!bg-[#b85c1e] h-11 px-8 rounded-xl font-bold shadow-lg shadow-[#d37533]/20 border-none transition-all' 
      }}
      cancelButtonProps={{ 
        className: 'h-11 px-6 rounded-xl font-bold border-gray-200 hover:text-[#d37533] hover:border-[#d37533] transition-all' 
      }}
      centered
      width={550}
      styles={{ 
        mask: { backdropFilter: 'blur(4px)' },
        body: { padding: '12px 0' }
      }}
    >
      <Divider className="my-0 opacity-50" />
      
      <Form 
        form={form} 
        layout="vertical" 
        className="px-6 py-6"
        requiredMark={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Form.Item 
            name="name" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2"><TagOutlined /> Tên danh mục</span>}
            rules={[{ required: true, message: 'Nhập tên danh mục!' }]}
          >
            <Input size="large" placeholder="Cà Phê Pha Máy" className="rounded-xl border-gray-200 hover:border-[#d37533] focus:border-[#d37533] h-12" />
          </Form.Item>
          
          <Form.Item 
            name="slug" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2"><CompassOutlined /> Đường dẫn (Slug)</span>}
          >
            <Input size="large" placeholder="ca-phe-pha-may" className="rounded-xl border-gray-200 hover:border-[#d37533] focus:border-[#d37533] h-12" />
          </Form.Item>
        </div>

        <Form.Item 
          name="description" 
          label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2"><AlignLeftOutlined /> Mô tả ngắn</span>}
        >
          <Input.TextArea 
            rows={2} 
            placeholder="Mô tả về các loại thức uống trong danh mục này..." 
            className="rounded-xl border-gray-200 hover:border-[#d37533] focus:border-[#d37533] py-3" 
          />
        </Form.Item>

        <div className="bg-gray-50/50 p-5 rounded-[24px] border border-gray-100 mb-6">
          <Form.Item 
            name="imageUrl" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2"><LinkOutlined /> Link hình ảnh đại diện</span>}
            className="mb-4"
          >
            <Input size="large" placeholder="https://images.unsplash.com/..." className="rounded-xl border-gray-200 h-11" />
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

          <Form.Item label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider">Hoặc tải lên từ máy tính</span>} className="mb-0">
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

        <div className="grid grid-cols-2 gap-6">
          <Form.Item 
            name="displayOrder" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2"><OrderedListOutlined /> Thứ tự hiển thị</span>}
            initialValue={0}
          >
            <Input type="number" size="large" className="rounded-xl border-gray-200 h-12" />
          </Form.Item>

          <Form.Item 
            name="isActive" 
            label={<span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-2"><CheckCircleOutlined /> Trạng thái</span>}
            initialValue="active"
          >
            <Select size="large" className="rounded-xl [&>.ant-select-selector]:!rounded-xl h-12">
              <Select.Option value="active">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Hoạt động</span>
              </Select.Option>
              <Select.Option value="inactive">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400" /> Đã ẩn</span>
              </Select.Option>
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};
