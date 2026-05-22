import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Upload, Button, Row, Col, Space } from 'antd';
import { message } from '@/lib/antd';
import { 
  UploadOutlined, 
  LoadingOutlined, 
  LinkOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { fileService } from '@/services/file.service';

interface CategoryModalProps {
  isOpen: boolean;
  editingRecord: any;
  isLoading: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  editingRecord,
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
      if (!isJpgOrPng) message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
      return isJpgOrPng || Upload.LIST_IGNORE;
    },
  };

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          isActive: editingRecord.isActive ?? true,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, displayOrder: 0 });
      }
    }
  }, [isOpen, editingRecord, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(values);
    });
  };

  const imageUrl = Form.useWatch('imageUrl', form);

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={isLoading}
      centered
      width={800}
      footer={(
        <div className="flex justify-between items-center px-10 pb-10 pt-4">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            {editingRecord ? `ID: ${editingRecord.id}` : 'Đang tạo danh mục mới'}
          </div>
          <Space size="middle">
            <Button onClick={onClose} className="rounded-xl font-bold h-11 border-gray-200 text-gray-500 px-8">Đóng</Button>
            <Button 
              type="primary" 
              onClick={handleSave} 
              loading={isLoading}
              className="bg-[#d37533] rounded-xl font-bold h-11 px-10 border-none shadow-lg shadow-orange-100"
            >
              {editingRecord ? 'Cập nhật' : 'Tạo danh mục'}
            </Button>
          </Space>
        </div>
      )}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header */}
      <div className="bg-white px-10 pt-8 pb-4 border-b border-gray-100 rounded-t-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
            <AppstoreOutlined className="text-xl text-gray-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase text-gray-800 tracking-tight leading-none">
              {editingRecord ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
              Cấu hình phân loại thực đơn
            </p>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" className="px-10 pb-10 pt-4 max-h-[75vh] overflow-y-auto scrollbar-hide bg-white">
        <Space orientation="vertical" size={24} className="w-full">
          {/* Nhóm 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={<span className="text-[10px] font-black uppercase text-gray-500">Tên danh mục</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                >
                  <Input size="large" placeholder="Ví dụ: Cà Phê, Trà Trái Cây..." className="rounded-xl border-gray-200 focus:border-[#d37533] h-12 text-sm font-bold" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="slug"
                  label={<span className="text-[10px] font-black uppercase text-gray-500">Đường dẫn (Slug)</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập slug!' }]}
                  extra={<span className="text-[10px] text-gray-400 italic">Đường dẫn không dấu, ví dụ: ca-phe-truyen-thong</span>}
                >
                  <Input size="large" placeholder="ca-phe" className="rounded-xl border-gray-200 focus:border-[#d37533] h-12 text-sm font-mono" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="displayOrder" label={<span className="text-[10px] font-black uppercase text-gray-500">Thứ tự hiển thị</span>}>
                  <InputNumber size="large" className="w-full rounded-xl border-gray-200 h-12 flex items-center px-2" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="isActive" label={<span className="text-[10px] font-black uppercase text-gray-500">Trạng thái</span>}>
                  <Select size="large" className="rounded-xl h-12" options={[{ label: 'Hiển thị', value: true }, { label: 'Ẩn đi', value: false }]} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label={<span className="text-[10px] font-black uppercase text-gray-500">Mô tả chi tiết</span>}
            >
              <Input.TextArea rows={4} placeholder="Mô tả ngắn về nhóm sản phẩm này..." className="rounded-xl border-gray-200 focus:border-[#d37533] text-sm p-4" />
            </Form.Item>
          </div>

          {/* Nhóm 2: Hình ảnh (Để cuối cùng) */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-32 h-32 shrink-0">
                <div className="w-full h-full rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group hover:border-[#d37533]/30 transition-all shadow-sm">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center opacity-20">
                      <UploadOutlined className="text-2xl" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <LoadingOutlined className="text-xl text-[#d37533]" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-4">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Hình ảnh đại diện</span>
                <Upload {...uploadProps} className="w-full">
                  <Button block className="rounded-xl h-11 font-bold border-gray-200 hover:border-[#d37533] hover:text-[#d37533] flex items-center justify-center gap-2">
                    <UploadOutlined /> Chọn ảnh từ máy tính
                  </Button>
                </Upload>
                <Form.Item name="imageUrl" className="mb-0">
                  <Input prefix={<LinkOutlined className="text-gray-300" />} placeholder="Hoặc dán link ảnh vào đây..." className="rounded-xl border-gray-200 h-11 text-xs" />
                </Form.Item>
              </div>
            </div>
          </div>
        </Space>
      </Form>
    </Modal>
  );
};
